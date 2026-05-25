# Sentiment Analysis — Product Review Classifier

A complete end-to-end ML pipeline that classifies product and service reviews as **Positive**, **Neutral**, or **Negative**. Built with multiple approaches — TF-IDF, GloVe embeddings, and fine-tuned BERT — served via FastAPI and visualized through a React frontend.

---

## Project Structure

```
sentiment-analysis/
├── data/
│   ├── raw/                             ← original dataset (not tracked)
│   └── processed/                       ← cleaned data (not tracked)
├── glove/                               ← GloVe vectors (not tracked)
├── notebooks/
│   ├── 01_eda.ipynb                     ← exploratory data analysis
│   ├── 02_baseline.ipynb                ← TF-IDF pipeline
│   ├── 03_glove.ipynb                   ← GloVe average pooling
│   ├── 04_glove_tfidf.ipynb             ← GloVe TF-IDF weighted pooling
│   └── 05_bert.ipynb                    ← BERT fine-tuning (Google Colab)
├── src/
│   ├── preprocess.py                    ← shared preprocessing pipeline
│   ├── predict.py                       ← TF-IDF inference module
│   ├── predict_bert.py                  ← BERT inference module
│   ├── main.py                          ← TF-IDF FastAPI app (port 8000)
│   └── main_bert.py                     ← BERT FastAPI app (port 8001)
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                ← axios API clients
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   └── ConfidenceBar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx                 ← single review analysis
│   │   │   └── Compare.jsx              ← side by side model comparison
│   │   │   └── BatchUpload.jsx          ← CSV upload and batch processing
│   │   └── App.jsx
│   └── package.json
├── models/                              ← saved model files (not tracked)
├── reports/
│   └── figures/                         ← all plots and visualizations
├── requirements.txt
└── README.md
```

---

## Dataset

- **Source:** Yelp Academic Dataset
- **File used:** `yelp_academic_dataset_review.json`
- **Size:** 1,798,312 reviews (balanced — ~599k per class)
- **Classes:**
  - Positive → 4 and 5 star reviews
  - Neutral  → 3 star reviews
  - Negative → 1 and 2 star reviews
- **Download:** https://www.yelp.com/dataset

---

## Approaches & Results

| Approach | Model | Weighted F1 |
|---|---|---|
| BERT fine-tuned (raw text) | bert-base-uncased | **0.8236** |
| TF-IDF | Logistic Regression | **0.7991** |
| TF-IDF | Linear SVM | 0.7973 |
| TF-IDF | Naive Bayes | 0.7521 |
| GloVe avg pooling | Logistic Regression | 0.6745 |
| GloVe avg pooling | Linear SVM | 0.6664 |
| GloVe TF-IDF weighted | Logistic Regression | 0.6523 |
| GloVe TF-IDF weighted | Linear SVM | 0.6430 |
| BERT fine-tuned (processed text) | bert-base-uncased | 0.7934 |

---

## Key Findings

**TF-IDF outperformed GloVe** on long reviews (average 100+ words) because average pooling dilutes semantic signal across many word vectors. TF-IDF with unigrams and bigrams captures negation patterns more effectively on longer text.

**GloVe weighted pooling underperformed simple average pooling** because at 1.8M reviews, IDF scores became too uniform — almost every word appeared enough times to receive a similar weight, adding noise instead of signal.

**BERT on raw text is the best model overall (F1: 0.8236)** — outperforming TF-IDF despite 
being trained on only 150k samples vs 1.8M. This demonstrates BERT's fundamental superiority 
in language understanding. The preprocessed BERT (0.7934) scored below TF-IDF, proving that 
input quality matters as much as model quality.

**Preprocessing hurts BERT performance** — BERT trained on preprocessed text scored 0.7934 
while BERT trained on raw text scored 0.8236, a 3-point improvement simply by removing the 
preprocessing step. BERT is designed to read natural language as-is — removing stopwords 
and punctuation strips away contextual cues the model relies on.

**Neutral class was the hardest to classify** across all approaches — expected, as neutral language is inherently ambiguous and sits between two opposing sentiment poles.

---

## GloVe Vectors

- **Source:** Stanford NLP GloVe
- **Download:** https://nlp.stanford.edu/projects/glove/
- **File used:** `glove.6B.100d.txt`
- **Vocabulary:** 400,000 words, 100-dimensional vectors

---

## BERT Training Details

- **Model:** bert-base-uncased (110M parameters)
- **Environment:** Google Colab T4 GPU (15.6GB)
- **Training samples:** 150,000 (50,000 per class)
- **Input:** Raw unprocessed text
- **Split:** 70% train / 15% val / 15% test
- **Epochs:** 3
- **Batch size:** 32
- **Learning rate:** 2e-5
- **Max token length:** 128
- **Best val F1:** 0.8206 (epoch 2)
- **Test F1:** 0.8236

---

## Papers Referenced

1. Pang, Lee & Vaithyanathan (2002) — *Thumbs Up? Sentiment Classification Using Machine Learning Techniques* — https://arxiv.org/abs/cs/0205070
2. Devlin, Chang, Lee & Toutanova (2018) — *BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding* — https://arxiv.org/abs/1810.04805
3. Gunasekaran (2023) — *Exploring Sentiment Analysis Techniques in NLP: A Comprehensive Review* — https://arxiv.org/abs/2305.14842

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Nithilan77/sentiment-analysis.git
cd sentiment-analysis
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Download NLTK data

```python
import nltk
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('punkt')
```

### 4. Download dataset and GloVe vectors

- Yelp dataset → https://www.yelp.com/dataset → place `yelp_academic_dataset_review.json` in `data/raw/`
- GloVe vectors → https://nlp.stanford.edu/projects/glove/ → place `glove.6B.100d.txt` in `glove/`

### 5. Run notebooks in order

```
01_eda.ipynb          ← explore and sample dataset
02_baseline.ipynb     ← train TF-IDF models
03_glove.ipynb        ← train GloVe avg models
04_glove_tfidf.ipynb  ← train GloVe weighted models
05_bert.ipynb         ← fine-tune BERT (run on Google Colab with GPU)
```

---

## Running the APIs

### TF-IDF API (port 8000)

```bash
cd src
uvicorn main:app --reload --port 8000
```

Interactive docs → http://localhost:8000/docs

### BERT API (port 8001)

```bash
cd src
uvicorn main_bert:app --reload --port 8001
```

Interactive docs → http://localhost:8001/docs

### Run both simultaneously

```bash
# Terminal 1
cd src && uvicorn main:app --reload --port 8000

# Terminal 2
cd src && uvicorn main_bert:app --reload --port 8001
```

---

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "model": "TF-IDF + Logistic Regression",
  "version": "1.0.0"
}
```

### Single Prediction
```
POST /predict
Content-Type: application/json

{
  "text": "The food was absolutely amazing, best restaurant in town!"
}
```

Response:
```json
{
  "sentiment": "Positive",
  "confidence": 98.88,
  "scores": {
    "Positive": 98.88,
    "Neutral": 1.03,
    "Negative": 0.09
  },
  "input": "The food was absolutely amazing, best restaurant in town!",
  "latency_ms": 2.49
}
```

### Batch Prediction
```
POST /predict/batch
Content-Type: application/json

{
  "texts": [
    "Absolutely loved it!",
    "Terrible service, never coming back.",
    "It was okay, nothing special."
  ]
}
```

Response:
```json
{
  "results": [
    {"sentiment": "Positive", "confidence": 69.23, ...},
    {"sentiment": "Negative", "confidence": 98.97, ...},
    {"sentiment": "Neutral",  "confidence": 91.23, ...}
  ],
  "total": 3,
  "latency_ms": 8.97
}
```

### Batch File Prediction
```
POST /predict/file
Content-Type: multipart/form-data
```
Upload a CSV file with a `review` column.
Returns a CSV with sentiment, confidence and scores for every row.
Max: 50,000 reviews per file.

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open → http://localhost:5173

### Pages

- **Analyze** — single review, choose TF-IDF or BERT
- **Compare** — same review through both models side by side
- **Batch** — upload CSV, download results with sentiment scores

---

## Requirements

```
pandas==2.1.0
numpy==1.26.0
scikit-learn==1.3.0
nltk==3.8.1
matplotlib==3.8.0
seaborn==0.13.0
wordcloud==1.9.2
joblib==1.3.2
fastapi==0.104.0
uvicorn==0.24.0
pydantic==2.4.2
torch
transformers
```

---

## What is Not Tracked in Git

```
data/raw/          ← Yelp dataset (5GB+)
data/processed/    ← cleaned CSV (large)
glove/             ← GloVe vectors (822MB)
models/            ← trained model files (large)
```

To reproduce — download dataset and GloVe, run notebooks in order, models will be saved to `models/`.

---

## Author

Nithilan S
