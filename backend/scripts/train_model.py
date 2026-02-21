"""
Train the XGBoost approval prediction model.

Pulls feature-engineered training data from the planning_applications table
and saves the trained model to ml/planning_model.pkl.

Usage:
    python scripts/train_model.py
"""
import asyncio
import asyncpg
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]
MODEL_PATH = Path(__file__).parent.parent / "ml" / "planning_model.pkl"

EPC_MAP = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}

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
]


async def fetch_training_data(db_url: str) -> pd.DataFrame:
    """
    Fetch pre-computed features from the planning_applications table.
    Expects columns matching FEATURE_COLS plus 'approved' (0/1 target).
    """
    conn = await asyncpg.connect(db_url)
    rows = await conn.fetch("""
        SELECT
            flood_zone,
            in_conservation_area::int,
            in_greenbelt::int,
            in_article4_zone::int,
            local_approval_rate,
            avg_decision_time_days,
            similar_applications_nearby,
            avg_price_per_m2,
            price_trend_24m,
            avg_epc_rating,
            CASE WHEN decision = 'approved' THEN 1 ELSE 0 END AS approved
        FROM planning_applications
        WHERE flood_zone IS NOT NULL
          AND local_approval_rate IS NOT NULL
    """)
    await conn.close()

    df = pd.DataFrame([dict(r) for r in rows])
    df["epc_score"] = df["avg_epc_rating"].map(EPC_MAP).fillna(4)
    return df


def train(df: pd.DataFrame):
    X = df[FEATURE_COLS].values
    y = df["approved"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)

    probs = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, probs)
    print(f"\nROC-AUC: {auc:.4f}")

    # Feature importance
    importance = dict(zip(FEATURE_COLS, model.feature_importances_))
    print("\nFeature importances:")
    for feat, score in sorted(importance.items(), key=lambda x: -x[1]):
        print(f"  {feat:40s} {score:.4f}")

    return model


if __name__ == "__main__":
    print("Fetching training data...")
    df = asyncio.run(fetch_training_data(DB_URL))
    print(f"Loaded {len(df):,} records. Class balance: {df['approved'].mean():.2%} approved")

    print("\nTraining XGBoost model...")
    model = train(df)

    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
