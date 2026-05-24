"""
predict_bert.py
---------------
Inference module for BERT fine-tuned model.
Runs independently from TF-IDF pipeline.
Model loaded once at startup.
"""

import torch
import numpy as np
from pathlib  import Path
from transformers import BertTokenizer, BertForSequenceClassification
from preprocess import preprocess

# paths
MODELS_DIR  = Path(__file__).resolve().parent.parent / 'models'
MODEL_PATH  = MODELS_DIR / 'bert_best_model_raw_data.pt'

# config
MAX_LEN     = 128
ID_TO_LABEL = {0: 'Negative', 1: 'Neutral', 2: 'Positive'}
device      = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# load tokenizer and model once
print(f"Loading BERT model from : {MODEL_PATH}")
print(f"Device                  : {device}")

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

model = BertForSequenceClassification.from_pretrained(
    'bert-base-uncased',
    num_labels=3
)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.to(device)
model.eval()

print("BERT model loaded successfully.")


def predict_bert(text: str) -> dict:
    """
    Predict sentiment using fine-tuned BERT model.

    Args:
        text: Raw review string

    Returns:
        dict with sentiment, confidence, scores, input
    """
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty.")

    # BERT works best on raw text — minimal preprocessing
    # only basic cleaning, no stopword removal or lemmatization
    clean = str(text).strip()

    # tokenize
    encoding = tokenizer(
        clean,
        max_length      = MAX_LEN,
        padding         = 'max_length',
        truncation      = True,
        return_tensors  = 'pt'
    )

    input_ids   = encoding['input_ids'].to(device)
    attn_mask   = encoding['attention_mask'].to(device)

    # inference
    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attn_mask)
        logits  = outputs.logits
        proba   = torch.softmax(logits, dim=1).cpu().numpy()[0]

    label_id   = int(np.argmax(proba))
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


def predict_bert_batch(texts: list) -> list:
    """
    Predict sentiment for multiple reviews.

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
            results.append(predict_bert(text))
        except ValueError as e:
            results.append({'error': str(e), 'input': text})

    return results