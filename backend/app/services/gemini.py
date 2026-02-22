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
    proj = data.project_params

    app_type_labels = {
        "extension": "Extension",
        "new_build": "New Build",
        "loft_conversion": "Loft Conversion",
        "change_of_use": "Change of Use",
        "listed_building": "Listed Building Works",
        "demolition": "Demolition",
        "other": "Other",
    }
    prop_type_labels = {
        "detached": "Detached",
        "semi_detached": "Semi-Detached",
        "terraced": "Terraced",
        "flat": "Flat/Apartment",
        "commercial": "Commercial",
        "land": "Land Only",
    }

    return f"""
You are a professional UK planning consultant. Using ONLY the data provided below,
write a structured planning intelligence report. Do not speculate beyond the data.
Tailor your advice specifically to the proposed project described below.

LOCATION: {data.postcode} ({data.location.district}, {data.location.ward})

PROPOSED PROJECT:
- Application Type: {app_type_labels.get(proj.application_type.value, proj.application_type.value)}
- Property Type: {prop_type_labels.get(proj.property_type.value, proj.property_type.value)}
- Number of Storeys: {proj.num_storeys}
- Estimated Floor Area: {proj.estimated_floor_area_m2} m²

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
  "overall_outlook": "<2-3 sentence summary of development prospects, specifically for the proposed {app_type_labels.get(proj.application_type.value, 'project')}>",
  "key_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "strategic_recommendation": "<1-2 sentence actionable recommendation tailored to the specific project type and scale>",
  "risk_mitigation": ["<mitigation 1>", "<mitigation 2>", "<mitigation 3>"]
}}
""".strip()


def _fallback_report(data: AnalyzeResponse) -> dict:
    """Generate a rule-based report when Gemini is unavailable."""
    c = data.constraints
    p = data.planning_metrics
    m = data.market_metrics
    prob = data.ml_prediction.approval_probability
    score = data.viability_score

    outlook_parts = []
    if prob >= 0.75:
        outlook_parts.append(f"{data.postcode} presents a strong development opportunity with a {prob*100:.0f}% predicted approval probability.")
    elif prob >= 0.55:
        outlook_parts.append(f"{data.postcode} offers moderate development potential with a {prob*100:.0f}% predicted approval probability.")
    else:
        outlook_parts.append(f"{data.postcode} carries significant planning risk with only a {prob*100:.0f}% predicted approval probability.")

    if m.avg_price_per_m2 > 5000:
        outlook_parts.append(f"The local market is strong at £{m.avg_price_per_m2:,.0f}/m², supporting development viability.")
    elif m.avg_price_per_m2 > 3000:
        outlook_parts.append(f"Market values at £{m.avg_price_per_m2:,.0f}/m² are moderate, offering reasonable returns.")
    else:
        outlook_parts.append(f"Market values at £{m.avg_price_per_m2:,.0f}/m² are lower, which may challenge viability margins.")

    outlook_parts.append(f"The overall viability score is {score}/100.")

    risks = []
    if c.flood_zone == 3:
        risks.append("High flood risk (Zone 3) — sequential and exception tests required before development.")
    elif c.flood_zone == 2:
        risks.append("Moderate flood risk (Zone 2) — flood risk assessment required for planning applications.")
    if c.in_conservation_area:
        risks.append("Conservation Area designation restricts demolition, materials, and design — heightened scrutiny expected.")
    if c.in_greenbelt:
        risks.append("Greenbelt location — development strongly restricted to very special circumstances only.")
    if c.in_article4_zone:
        risks.append("Article 4 Direction removes permitted development rights — full planning consent required for changes.")
    if p.local_approval_rate < 0.6:
        risks.append(f"Below-average local approval rate of {p.local_approval_rate*100:.0f}% indicates a restrictive planning authority.")
    if m.price_trend_24m < 0:
        risks.append(f"Falling prices ({m.price_trend_24m*100:+.1f}% over 24 months) may erode development margins.")
    # Always pad to 3 risks with relevant generic observations
    generic = [
        f"Average decision time of {p.avg_decision_time_days:.0f} days introduces programme risk — factor this into project timelines.",
        "Construction cost inflation and supply chain pressures should be stress-tested against projected GDV.",
        f"With {p.similar_applications_nearby} recent applications in the area, competition for contractor capacity may affect build costs.",
        "Viability assessments may be required if affordable housing thresholds are triggered by the scheme size.",
    ]
    for g in generic:
        if len(risks) >= 3:
            break
        risks.append(g)
    if not risks:
        risks.append("No major planning constraints identified — standard application process expected.")

    if c.in_conservation_area:
        rec = "Engage a heritage consultant early to align proposed design with Conservation Area character — pre-application advice from the LPA is strongly recommended."
    elif c.flood_zone >= 2:
        rec = "Commission a Flood Risk Assessment and explore mitigation measures such as raised finished floor levels before submitting a planning application."
    elif prob >= 0.75:
        rec = f"Proceed with confidence — commission a pre-application consultation with {data.location.district} to confirm scheme parameters and de-risk the formal submission."
    else:
        rec = "Conduct a thorough pre-application engagement with the Local Planning Authority to understand policy requirements before committing to detailed design costs."

    mitigations = [
        f"Submit a pre-application enquiry to the LPA to receive early officer opinion and reduce formal refusal risk.",
        f"With {p.similar_applications_nearby} recent applications nearby, review comparable decisions to identify acceptable design precedents.",
        f"Instruct a planning consultant to prepare a robust Planning Statement addressing all identified constraints.",
    ]

    return {
        "overall_outlook": " ".join(outlook_parts),
        "key_risks": risks[:3],
        "strategic_recommendation": rec,
        "risk_mitigation": mitigations,
    }


async def generate_report(data: AnalyzeResponse) -> dict:
    prompt = _build_prompt(data)
    try:
        response = await _model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        import json
        return json.loads(response.text)
    except Exception:
        return _fallback_report(data)
