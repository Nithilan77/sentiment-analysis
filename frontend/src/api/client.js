import axios from 'axios'

export const tfidfClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

export const bertClient = axios.create({
  baseURL: 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' }
})

export const predictSentiment = async (text, model = 'tfidf') => {
  const client = model === 'bert' ? bertClient : tfidfClient
  const response = await client.post('/predict', { text })
  return response.data
}

export const compareSentiment = async (text) => {
  const [tfidf, bert] = await Promise.all([
    tfidfClient.post('/predict', { text }),
    bertClient.post('/predict', { text })
  ])
  return {
    tfidf : tfidf.data,
    bert  : bert.data
  }
}