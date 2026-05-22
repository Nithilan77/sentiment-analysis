"""
predict.py
----------
Inference module — loads trained TF-IDF + Logistic Regression model
and exposes a clean predict() function.

Model is loaded once at startup and reused for all predictions.
"""

import joblib
import numpy as np
from pathlib import Path
from preprocess import preprocess

# paths — relative to src/
MODELS_DIR   = Path(__file__).resolve().parent.parent / 'models'
MODEL_PATH   = MODELS_DIR / 'tfidf_best_model.joblib'
VECTORIZER_PATH = MODELS_DIR / 'tfidf_vectorizer.joblib'

# label mapping
ID_TO_LABEL = {0: 'Negative', 1: 'Neutral', 2: 'Positive'}

# load model and vectorizer once at module import
print(f"Loading model from      : {MODEL_PATH}")
print(f"Loading vectorizer from : {VECTORIZER_PATH}")

model      = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

print("Model and vectorizer loaded successfully.")


def predict(text: str) -> dict:
    """
    Predict sentiment for a single review.

    Args:
        text: Raw review string

    Returns:
        dict with keys:
            - sentiment   : 'Positive' | 'Neutral' | 'Negative'
            - confidence  : float (0-100)
            - scores      : dict of all class probabilities
            - input       : original input text
    """
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty.")

    # preprocess
    clean = preprocess(text)

    if not clean.strip():
        raise ValueError("Input text has no meaningful content after preprocessing.")

    # vectorize
    vector = vectorizer.transform([clean])

    # predict
    label_id   = model.predict(vector)[0]
    proba      = model.predict_proba(vector)[0]

    sentiment  = ID_TO_LABEL[label_id]
    confidence = round(float(proba[label_id]) * 100, 2)

    scores = {
        ID_TO_LABEL[i]: round(float(p) * 100, 2)
        for i, p in enumerate(proba)
    }

    return {
        'sentiment' : sentiment,
        'confidence': confidence,
        'scores'    : scores,
        'input'     : text
    }


def predict_batch(texts: list) -> list:
    """
    Predict sentiment for a list of reviews.

    Args:
        texts: List of raw review strings

    Returns:
        List of prediction dicts
    """
    if not texts:
        raise ValueError("Input list cannot be empty.")

    results = []
    for text in texts:
        try:
            results.append(predict(text))
        except ValueError as e:
            results.append({'error': str(e), 'input': text})

    return results