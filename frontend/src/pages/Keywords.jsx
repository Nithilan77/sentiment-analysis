import { useState, useEffect } from 'react'
import axios from 'axios'

const SENTIMENT_CONFIG = {
  Positive : { emoji: '😊', light: '#f0fdf4', border: '#bbf7d0', text: '#166534', bar: '#3B6D11' },
  Negative : { emoji: '😞', light: '#fef2f2', border: '#fecaca', text: '#991b1b', bar: '#A32D2D' },
  Neutral  : { emoji: '😐', light: '#fefce8', border: '#fef08a', text: '#854d0e', bar: '#B87D00' }
}

const ASPECT_EMOJIS = {
  Quality   : '⭐',
  Service   : '👤',
  Food      : '🍕',
  Price     : '💰',
  Ambience  : '🏠',
  Experience: '✨'
}

export default function Keywords() {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [sentiment, setSentiment] = useState('Positive')
  const [aspect,    setAspect]    = useState(null)

  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('http://localhost:8000/keywords?top_n=10')
      setData(res.data)
      // set default aspect to first available
      const firstAspect = Object.keys(res.data['Positive'])[0]
      setAspect(firstAspect)
    } catch {
      setError('Could not connect to API. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const config = SENTIMENT_CONFIG[sentiment]

  const maxCount = (words) => Math.max(...words.map(w => w.count))

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Keyword Analysis
      </h1>
      <p className="text-gray-500 mb-8">
        Most common words per aspect — extracted from 1.8M Yelp reviews.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200
                        rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-gray-400">
          Loading keyword data...
        </div>
      )}

      {!loading && data && (
        <>
          {/* sentiment selector */}
          <div className="flex gap-3 mb-6">
            {['Positive', 'Negative', 'Neutral'].map(s => (
              <button
                key={s}
                onClick={() => setSentiment(s)}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all
                  ${sentiment === s
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'
                  }`}
              >
                {SENTIMENT_CONFIG[s].emoji} {s}
              </button>
            ))}
          </div>

          {/* aspect tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {Object.keys(data[sentiment]).map(a => (
              <button
                key={a}
                onClick={() => setAspect(a)}
                className={`px-4 py-2 rounded-xl text-sm border transition-all
                  ${aspect === a
                    ? `text-white border-transparent`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                style={aspect === a ? { background: config.bar } : {}}
              >
                {ASPECT_EMOJIS[a]} {a}
              </button>
            ))}
          </div>

          {/* keyword bars */}
          {aspect && data[sentiment][aspect] && (
            <div
              className="rounded-2xl border p-6"
              style={{ background: config.light, borderColor: config.border }}
            >
              <h2 className="text-lg font-bold mb-6" style={{ color: config.text }}>
                {ASPECT_EMOJIS[aspect]} {aspect} — {sentiment} Reviews
              </h2>

              <div className="flex flex-col gap-3">
                {data[sentiment][aspect].map((item, idx) => (
                  <div key={item.word} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}</span>
                    <span className="text-sm font-medium w-28">{item.word}</span>
                    <div className="flex-1 bg-white rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width     : `${(item.count / maxCount(data[sentiment][aspect])) * 100}%`,
                          background: config.bar
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* all aspects overview */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data[sentiment]).map(([asp, words]) => (
              <div
                key={asp}
                onClick={() => setAspect(asp)}
                className="rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all bg-white"
                style={{ borderColor: aspect === asp ? config.bar : '#e5e7eb' }}
              >
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {ASPECT_EMOJIS[asp]} {asp}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {words.slice(0, 5).map(w => w.word).join(', ')}...
                </p>
              </div>
            ))}
          </div>

        </>
      )}

    </div>
  )
}