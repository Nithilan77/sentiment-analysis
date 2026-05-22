"""
main.py
-------
FastAPI application — serves the sentiment analysis model as a REST API.

Endpoints:
    GET  /health          — service health check
    POST /predict         — single review prediction
    POST /predict/batch   — batch review prediction
"""

from fastapi            import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic           import BaseModel, Field
from typing             import List
import time
import logging

from predict import predict, predict_batch

# logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title       = "Sentiment Analysis API",
    description = "Analyzes product reviews and classifies sentiment as Positive, Neutral, or Negative.",
    version     = "1.0.0"
)

# CORS — allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Request / Response Schemas ──────────────────────────────────────────────

class ReviewRequest(BaseModel):
    text: str = Field(
        ...,
        min_length  = 3,
        max_length  = 5000,
        description = "Raw review text to analyze",
        example     = "The food was absolutely amazing, best restaurant in town!"
    )

class BatchReviewRequest(BaseModel):
    texts: List[str] = Field(
        ...,
        min_length  = 1,
        max_length  = 100,
        description = "List of review texts (max 100 per request)",
        example     = ["Great product!", "Terrible experience.", "It was okay."]
    )

class SentimentScore(BaseModel):
    Positive : float
    Neutral  : float
    Negative : float

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


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint.
    Used by load balancers and monitoring tools.
    """
    return {
        "status"  : "healthy",
        "model"   : "TF-IDF + Logistic Regression",
        "version" : "1.0.0"
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_sentiment(request: ReviewRequest):
    """
    Predict sentiment for a single review.
    
    Returns:
        - sentiment   : Positive | Neutral | Negative
        - confidence  : confidence score (0-100)
        - scores      : probability for each class
        - latency_ms  : inference time in milliseconds
    """
    start = time.time()

    try:
        result = predict(request.text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal prediction error.")

    result['latency_ms'] = round((time.time() - start) * 1000, 2)
    logger.info(f"Predicted: {result['sentiment']} ({result['confidence']}%) in {result['latency_ms']}ms")

    return result


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
def predict_batch_sentiment(request: BatchReviewRequest):
    """
    Predict sentiment for multiple reviews in one request.
    Max 100 reviews per request.
    
    Returns:
        - results     : list of predictions
        - total       : number of reviews processed
        - latency_ms  : total inference time
    """
    start = time.time()

    try:
        results = predict_batch(request.texts)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal prediction error.")

    latency = round((time.time() - start) * 1000, 2)
    logger.info(f"Batch predicted {len(results)} reviews in {latency}ms")

    return {
        "results"    : results,
        "total"      : len(results),
        "latency_ms" : latency
    }