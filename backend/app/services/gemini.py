import google.generativeai as genai
from app.config import settings
from app.schemas.models import AnalyzeResponse

genai.configure(api_key=settings.gemini_api_key)
_model = genai.GenerativeModel("gemini-2.0-flash")


def _build_prompt(data: AnalyzeResponse) -> str:
    c = data.constraints
    p = data.planning_metrics
    m = data.market_metrics
    ml = data.ml_prediction

    return f"""
You are a professional UK planning consultant. Using ONLY the data provided below,
write a structured planning intelligence report. Do not speculate beyond the data.

LOCATION: {data.postcode} ({data.location.district}, {data.location.ward})

CONSTRAINTS:
- Flood Zone: {c.flood_zone} (1=low, 2=medium, 3=high risk)
- Conservation Area: {"Yes" if c.in_conservation_area else "No"}
- Greenbelt: {"Yes" if c.in_greenbelt else "No"}
- Article 4 Zone: {"Yes" if c.in_article4_zone else "No"}

PLANNING METRICS (500m radius, last 5 years):
- Local approval rate: {p.local_approval_rate * 100:.1f}%
- Average decision time: {p.avg_decision_time_days:.0f} days
- Similar applications nearby: {p.similar_applications_nearby}

MARKET METRICS:
- Average price per m²: £{m.avg_price_per_m2:,.0f}
- Price trend (24 months): {m.price_trend_24m * 100:+.1f}%
- Average EPC rating: {m.avg_epc_rating}

ML PREDICTION:
- Approval probability: {ml.approval_probability * 100:.1f}%
- Viability score: {data.viability_score}/100

Respond in this exact JSON format with no additional text:
{{
  "overall_outlook": "<2-3 sentence summary of development prospects>",
  "key_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "strategic_recommendation": "<1-2 sentence actionable recommendation>",
  "risk_mitigation": ["<mitigation 1>", "<mitigation 2>", "<mitigation 3>"]
}}
""".strip()


async def generate_report(data: AnalyzeResponse) -> dict:
    prompt = _build_prompt(data)
    response = await _model.generate_content_async(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.3,
        ),
    )
    import json
    return json.loads(response.text)
