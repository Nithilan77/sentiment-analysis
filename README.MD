# Sentiment Analysis — Product Review Classifier

A complete ML pipeline that classifies product/service reviews 
as **Positive**, **Neutral**, or **Negative**.

---

## Project Structure
sentiment-analysis/
├── data/
│   ├── raw/                        ← original dataset (not tracked)
│   └── processed/                  ← cleaned data (not tracked)
├── glove/                          ← GloVe vectors (not tracked)
├── notebooks/
│   ├── 01_eda.ipynb                ← exploratory data analysis
│   ├── 02_baseline.ipynb           ← TF-IDF pipeline
│   ├── 03_glove.ipynb              ← GloVe avg pooling
│   ├── 04_glove_tfidf.ipynb        ← GloVe weighted pooling
│   └── 05_bert.ipynb               ← BERT fine-tuning (Colab)
├── src/
│   ├── preprocess.py               ← preprocessing pipeline
│   ├── predict.py                  ← inference module
│   └── main.py                     ← FastAPI application
├── models/                         ← saved models (not tracked)
├── reports/
│   └── figures/                    ← all plots and charts
├── requirements.txt
└── README.md
---

## Dataset

- **Source:** Yelp Academic Dataset
- **Size:** 1,798,312 reviews (balanced — 599k per class)
- **Classes:** Positive (4-5 stars) | Neutral (3 stars) | Negative (1-2 stars)
- **Reference:** https://www.yelp.com/dataset

---

## Results

| Approach | Model | Weighted F1 |
|---|---|---|
| TF-IDF | Logistic Regression | **0.7991** |
| TF-IDF | Linear SVM | 0.7973 |
| TF-IDF | Naive Bayes | 0.7521 |
| GloVe avg pooling | Logistic Regression | 0.6745 |
| GloVe weighted | Logistic Regression | 0.6523 |
| BERT fine-tuned | bert-base-uncased | 0.7934 |

**Best model:** TF-IDF + Logistic Regression (F1: 0.7991)

---

## Key Findings

- TF-IDF outperformed GloVe on long reviews (avg 100+ words) 
  because average pooling dilutes semantic signal
- BERT scored comparably to TF-IDF on 100k samples — 
  expected to outperform on full 1.8M data with raw text
- Neutral class is hardest to classify across all approaches
- TF-IDF with bigrams captures negation patterns effectively on long text

---

## Setup

```bash
pip install -r requirements.txt
```

Download NLTK data:
```python
import nltk
nltk.download('stopwords')
nltk.download('wordnet')
```

---

## Run the API

```bash
cd src
uvicorn main:app --reload --port 8000
```

API will be live at: http://localhost:8000

Interactive docs at: http://localhost:8000/docs

---

## API Endpoints

### Health Check
GET /health
### Single Prediction
POST /predict
Content-Type: application/json
{
"text": "The food was absolutely amazing!"
}
Response:
```json
{
  "sentiment": "Positive",
  "confidence": 94.3,
  "scores": {
    "Positive": 94.3,
    "Neutral": 3.1,
    "Negative": 2.6
  },
  "input": "The food was absolutely amazing!",
  "latency_ms": 12.4
}
```

### Batch Prediction
POST /predict/batch
Content-Type: application/json
{
"texts": [
"Absolutely loved it!",
"Terrible service.",
"It was okay, nothing special."
]
}
---

## Papers Referenced

- Pang et al. (2002) — Thumbs Up? Sentiment Classification Using ML
- Devlin et al. (2018) — BERT: Pre-training of Deep Bidirectional Transformers
- Gunasekaran (2023) — Exploring Sentiment Analysis Techniques in NLP