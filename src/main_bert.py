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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import time
import logging

from predict_bert import predict_bert, predict_bert_batch

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