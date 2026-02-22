"""
Document Upload + OCR endpoint.
Uses Gemini 2.0 Flash multimodal to extract planning-relevant data from uploaded
PDFs or images (planning decision letters, site plans, EPC certificates, etc.).
Returns structured overrides that the frontend can pre-fill into the analysis form.
"""

import json
import base64
import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import google.generativeai as genai

from app.config import settings
from app.middleware.auth import verify_jwt

log = logging.getLogger(__name__)

genai.configure(api_key=settings.gemini_api_key)

# Primary and fallback models for rate-limit resilience
_MODELS = [
    genai.GenerativeModel("gemini-2.5-flash"),
    genai.GenerativeModel("gemini-2.0-flash-lite"),
]

router = APIRouter()

_EXTRACTION_PROMPT = """
You are a UK planning document analyser. Extract as much structured data as possible
from this document. The document may be a planning decision letter, site plan,
EPC certificate, flood risk assessment, or similar planning-related document.

Return ONLY a JSON object with the fields below. Use null for any field you cannot
confidently extract. Do NOT guess — only include values clearly stated in the document.

{
  "postcode": "<UK postcode if found>",
  "application_type": "<one of: extension, new_build, loft_conversion, change_of_use, listed_building, demolition, other>",
  "property_type": "<one of: detached, semi_detached, terraced, flat, commercial, land>",
  "num_storeys": <integer or null>,
  "estimated_floor_area_m2": <number or null>,
  "flood_zone": <1, 2, or 3 or null>,
  "in_conservation_area": <true/false or null>,
  "in_greenbelt": <true/false or null>,
  "in_article4_zone": <true/false or null>,
  "epc_rating": "<A-G or null>",
  "decision": "<approved or refused if this is a decision letter, else null>",
  "summary": "<1-2 sentence summary of what this document is>"
}
""".strip()

ALLOWED_MIME = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
}

MAX_SIZE_MB = 10


@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    _token: dict = Depends(verify_jwt),
):
    """Upload a planning document (PDF or image) and extract structured data via Gemini OCR."""

    # Validate MIME type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Please upload a PDF, PNG, JPEG, WebP, or GIF.",
        )

    # Read file
    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(data) / 1024 / 1024:.1f}MB). Maximum is {MAX_SIZE_MB}MB.",
        )

    # Build Gemini multimodal request
    file_part = {
        "mime_type": content_type,
        "data": base64.b64encode(data).decode("utf-8"),
    }

    try:
        response = await _call_gemini_with_retry(file_part)
        result = json.loads(response.text)

        # Clean up: remove null values so frontend only gets actual extractions
        cleaned = {k: v for k, v in result.items() if v is not None}

        return {
            "success": True,
            "filename": file.filename,
            "extracted": cleaned,
        }

    except json.JSONDecodeError:
        return {
            "success": False,
            "filename": file.filename,
            "extracted": {},
            "error": "Could not parse structured data from this document. Try a clearer image or PDF.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Document analysis failed: {str(e)}",
        )


async def _call_gemini_with_retry(file_part: dict, max_retries: int = 2) -> object:
    """Try each model, with a short retry on 429 rate-limit errors."""
    last_error = None

    for model in _MODELS:
        for attempt in range(max_retries + 1):
            try:
                return await model.generate_content_async(
                    [
                        {"inline_data": file_part},
                        _EXTRACTION_PROMPT,
                    ],
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    ),
                )
            except Exception as e:
                last_error = e
                err_str = str(e)

                # Rate-limited — wait and retry or fall through to next model
                if "429" in err_str or "quota" in err_str.lower():
                    if attempt < max_retries:
                        wait = 3 * (attempt + 1)  # 3s, 6s
                        log.warning(
                            "Rate limited on %s (attempt %d), retrying in %ds",
                            model.model_name, attempt + 1, wait,
                        )
                        await asyncio.sleep(wait)
                        continue
                    else:
                        log.warning(
                            "Rate limit exhausted on %s, trying fallback model",
                            model.model_name,
                        )
                        break  # try next model
                else:
                    raise  # non-rate-limit error, propagate immediately

    # All models and retries exhausted
    raise HTTPException(
        status_code=429,
        detail=(
            "The AI service is temporarily rate-limited. "
            "Please wait about 30-60 seconds and try again."
        ),
    )
