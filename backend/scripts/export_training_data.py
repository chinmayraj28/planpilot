import asyncio
import asyncpg
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]
OUTPUT_FILE = "planning_applications_training.csv"

# Columns expected by the training script
FEATURE_COLS = [
    "flood_zone",
    "in_conservation_area",
    "in_greenbelt",
    "in_article4_zone",
    "local_approval_rate",
    "avg_decision_time_days",
    "similar_applications_nearby",
    "avg_price_per_m2",
    "price_trend_24m",
    "epc_score",
    "approved" # Target variable
]

async def export_data():
    print(f"Connecting to {DB_URL}...")
    conn = await asyncpg.connect(DB_URL)
    
    print("Fetching training data...")
    # Select only rows where we have the target (approved is not null)
    query = f"""
        SELECT {', '.join(FEATURE_COLS)}
        FROM planning_applications
        WHERE approved IS NOT NULL
    """
    
    rows = await conn.fetch(query)
    await conn.close()
    
    if not rows:
        print("No training data found! Have you run feature_engineering.py?")
        return

    print(f"Found {len(rows)} records. Saving to {OUTPUT_FILE}...")
    df = pd.DataFrame(rows, columns=FEATURE_COLS)
    df.to_csv(OUTPUT_FILE, index=False)
    print("Done! You can now upload this CSV to Google Colab.")

if __name__ == "__main__":
    asyncio.run(export_data())
