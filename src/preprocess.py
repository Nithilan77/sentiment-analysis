"""
preprocess.py
-------------
Text preprocessing pipeline — identical to what was used during training.
Must be kept in sync with training preprocessing to avoid train/serve skew.
"""

import re
import nltk
nltk.download('stopwords', quiet=True)
nltk.download('wordnet',   quiet=True)
from nltk.corpus import stopwords
from nltk.stem  import WordNetLemmatizer

# initialize once at module level — not inside function
STOP_WORDS  = set(stopwords.words('english'))
LEMMATIZER  = WordNetLemmatizer()


def preprocess(text: str) -> str:
    """
    Clean and normalize raw review text.
    
    Steps:
        1. Lowercase
        2. Remove URLs
        3. Remove punctuation and numbers
        4. Tokenize
        5. Remove stopwords
        6. Lemmatize
    
    Args:
        text: Raw review string
    
    Returns:
        Cleaned string ready for feature extraction
    """
    # lowercase
    text = str(text).lower()
    # remove URLs
    text = re.sub(r'http\S+|www\S+', '', text)
    # remove punctuation and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # tokenize
    tokens = text.split()
    # remove stopwords and lemmatize, filter short tokens
    tokens = [
        LEMMATIZER.lemmatize(w)
        for w in tokens
        if w not in STOP_WORDS and len(w) > 2
    ]
    return ' '.join(tokens)