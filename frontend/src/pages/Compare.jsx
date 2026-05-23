import { useState } from 'react'
import { compareSentiment } from '../api/client'
import ResultCard from '../components/ResultCard'

export default function Compare() {
  const [text,    setText]    = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleCompare = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const data = await compareSentiment(text)
      setResults(data)
    } catch (err) {
      setError('Failed to connect to APIs. Make sure both servers are running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Model Comparison
      </h1>
      <p className="text-gray-500 mb-8">
        Run the same review through both models and compare results side by side.
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste a review to compare both models..."
        rows={5}
        className="w-full border border-gray-200 rounded-xl p-4 text-sm
                   focus:outline-none focus:ring-2 focus:ring-gray-300
                   resize-none mb-4 bg-white"
      />

      {/* example buttons */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { label: 'Positive', text: 'Absolutely loved it, best experience ever!' },
          { label: 'Negative', text: 'Terrible service, never coming back again.' },
          { label: 'Neutral',  text: 'It was okay, nothing special honestly.' },
          { label: 'Nuanced',  text: 'Not bad at all, could have been better though.' }
        ].map(ex => (
          <button
            key={ex.label}
            onClick={() => { setText(ex.text); setResults(null) }}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200
                       text-gray-500 hover:border-gray-400 transition-all bg-white"
          >
            Try {ex.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleCompare}
        disabled={loading || !text.trim()}
        className="w-full py-3 rounded-xl bg-gray-800 text-white font-medium
                   hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all mb-6"
      >
        {loading ? 'Comparing...' : 'Compare Both Models'}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200
                        rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResultCard result={results.tfidf} model="tfidf" />
          <ResultCard result={results.bert}  model="bert"  />
        </div>
      )}

    </div>
  )
}