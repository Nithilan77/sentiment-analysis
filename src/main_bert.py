"""
main_bert.py
------------
FastAPI application for BERT sentiment analysis.
Runs on port 8001 — independent from TF-IDF API on port 8000.

Endpoints:
    GET  /health          — service health check
    POST /predict         — single review prediction
    POST /predict/batch   — batch prediction
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List
import time
import pandas as pd
import io
import logging

from predict_bert import predict_bert as predict
from predict_bert import predict_bert_batch

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# app
app = FastAPI(
    title       = "Sentiment Analysis API — BERT",
    description = "Fine-tuned BERT model for 3-class sentiment classification.",
    version     = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────

class ReviewRequest(BaseModel):
    text: str = Field(
        ...,
        min_length  = 3,
        max_length  = 5000,
        description = "Raw review text to analyze",
        example     = "The food was absolutely amazing!"
    )

class BatchReviewRequest(BaseModel):
    texts: List[str] = Field(
        ...,
        min_length  = 1,
        max_length  = 50,
        description = "List of reviews (max 50 — BERT is heavier than TF-IDF)",
        example     = ["Great!", "Terrible.", "It was okay."]
    )

class PredictionResponse(BaseModel):
    sentiment  : str
    confidence : float
    scores     : dict
    input      : str
    latency_ms : float

class BatchPredictionResponse(BaseModel):
    results    : List[dict]
    total      : int
    latency_ms : float


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status"  : "healthy",
        "model"   : "BERT fine-tuned (bert-base-uncased)",
        "version" : "1.0.0"
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_sentiment(request: ReviewRequest):
    """
    Predict sentiment using fine-tuned BERT.
    Heavier than TF-IDF but understands context and nuance better.
    """
    start = time.time()

    try:
        result = predict_bert(request.text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"BERT prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal prediction error.")

    result['latency_ms'] = round((time.time() - start) * 1000, 2)
    logger.info(f"BERT predicted: {result['sentiment']} ({result['confidence']}%) in {result['latency_ms']}ms")

    return result


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
def predict_batch_sentiment(request: BatchReviewRequest):
    """
    Batch prediction using BERT.
    Max 50 reviews per request (BERT is compute heavy).
    """
    start = time.time()

    try:
        results = predict_bert_batch(request.texts)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"BERT batch error: {e}")
        raise HTTPException(status_code=500, detail="Internal prediction error.")

    latency = round((time.time() - start) * 1000, 2)
    logger.info(f"BERT batch: {len(results)} reviews in {latency}ms")

    return {
        "results"   : results,
        "total"     : len(results),
        "latency_ms": latency
    }

@app.post("/predict/file", tags=["Batch"])
async def predict_from_file(file: UploadFile = File(...)):
    """
    Accept a CSV file with a 'review' column.
    Returns a CSV with sentiment, confidence and scores added.
    Max recommended: 50,000 reviews per file.
    """
    # validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=422, detail="Only CSV files are accepted.")

    try:
        contents = await file.read()
        # try utf-8 first, fall back to latin-1
        try:
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8', engine='python')
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(contents), encoding='latin-1', engine='python')
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read CSV file: {str(e)}")

    if 'review' not in df.columns:
        raise HTTPException(
            status_code=422,
            detail="CSV must have a column named 'review'."
        )

    if len(df) > 50000:
        raise HTTPException(
            status_code=422,
            detail="Maximum 50,000 reviews per file."
        )

    # drop empty reviews
    df = df.dropna(subset=['review']).reset_index(drop=True)

    # run predictions
    sentiments, confidences, pos_scores, neu_scores, neg_scores = [], [], [], [], []

    for text in df['review']:
        try:
            result = predict(str(text))
            sentiments.append(result['sentiment'])
            confidences.append(result['confidence'])
            pos_scores.append(result['scores'].get('Positive', 0))
            neu_scores.append(result['scores'].get('Neutral', 0))
            neg_scores.append(result['scores'].get('Negative', 0))
        except Exception:
            sentiments.append('Error')
            confidences.append(0)
            pos_scores.append(0)
            neu_scores.append(0)
            neg_scores.append(0)

    # add results to dataframe
    df['sentiment']          = sentiments
    df['confidence_%']       = confidences
    df['score_positive_%']   = pos_scores
    df['score_neutral_%']    = neu_scores
    df['score_negative_%']   = neg_scores

    # summary stats
    total    = len(df)
    pos_pct  = round(df[df['sentiment'] == 'Positive'].shape[0] / total * 100, 1)
    neu_pct  = round(df[df['sentiment'] == 'Neutral'].shape[0]  / total * 100, 1)
    neg_pct  = round(df[df['sentiment'] == 'Negative'].shape[0] / total * 100, 1)

    logger.info(f"Batch file: {total} reviews — Pos:{pos_pct}% Neu:{neu_pct}% Neg:{neg_pct}%")

    # return as downloadable CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=sentiment_results.csv",
            "X-Total-Reviews"   : str(total),
            "X-Positive-Pct"    : str(pos_pct),
            "X-Neutral-Pct"     : str(neu_pct),
            "X-Negative-Pct"    : str(neg_pct),
        }
    )