import { useState, useEffect } from 'react'
import axios from 'axios'

const COLORS = {
  Positive : { bg: '#3B6D11', light: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  Negative : { bg: '#A32D2D', light: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  Neutral  : { bg: '#B87D00', light: '#fefce8', border: '#fef08a', text: '#854d0e' }
}

export default function Keywords() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [topN,    setTopN]    = useState(20)
  const [view,    setView]    = useState('bars') // 'bars' or 'cloud'

  useEffect(() => {
    fetchKeywords()
  }, [topN])

  const fetchKeywords = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`http://localhost:8000/keywords?top_n=${topN}`)
      setData(res.data)
    } catch {
      setError('Could not connect to API. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const maxCount = (sentiment) => {
    if (!data) return 1
    return Math.max(...data[sentiment].map(w => w.count))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Keyword Analysis
      </h1>
      <p className="text-gray-500 mb-8">
        Most common words per sentiment class extracted from 1.8M Yelp reviews.
      </p>

      {/* controls */}
      <div className="flex gap-4 items-center mb-8 flex-wrap">

        {/* top N selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show top</span>
          {[10, 20, 30].map(n => (
            <button
              key={n}
              onClick={() => setTopN(n)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all
                ${topN === n
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'
                }`}
            >
              {n}
            </button>
          ))}
          <span className="text-sm text-gray-500">words</span>
        </div>

        {/* view toggle */}
        <div className="flex gap-2 ml-auto">
          {['bars', 'cloud'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all
                ${view === v
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'
                }`}
            >
              {v === 'bars' ? '📊 Bar Chart' : '☁️ Word Cloud'}
            </button>
          ))}
        </div>
      </div>

      {/* error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200
                        rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* loading */}
      {loading && (
        <div className="text-center py-20 text-gray-400">
          Loading keyword data...
        </div>
      )}

      {/* content */}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Positive', 'Negative', 'Neutral'].map(sentiment => (
            <div
              key={sentiment}
              className="rounded-2xl border p-6"
              style={{ background: COLORS[sentiment].light, borderColor: COLORS[sentiment].border }}
            >
              {/* header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: COLORS[sentiment].text }}>
                  {sentiment === 'Positive' ? '😊' : sentiment === 'Negative' ? '😞' : '😐'} {sentiment}
                </h2>
                <span className="text-xs text-gray-400">Top {topN} words</span>
              </div>

              {/* bar chart view */}
              {view === 'bars' && (
                <div className="flex flex-col gap-2">
                  {data[sentiment].map((item, idx) => (
                    <div key={item.word} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4 text-right">{idx + 1}</span>
                      <span className="text-xs font-medium w-20 truncate">{item.word}</span>
                      <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width     : `${(item.count / maxCount(sentiment)) * 100}%`,
                            background: COLORS[sentiment].bg
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* word cloud view */}
              {view === 'cloud' && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {data[sentiment].map((item) => {
                    const size = 12 + Math.round((item.count / maxCount(sentiment)) * 20)
                    return (
                      <span
                        key={item.word}
                        className="font-medium transition-all"
                        style={{
                          fontSize : `${size}px`,
                          color    : COLORS[sentiment].bg,
                          opacity  : 0.5 + (item.count / maxCount(sentiment)) * 0.5
                        }}
                        title={`${item.word}: ${item.count.toLocaleString()}`}
                      >
                        {item.word}
                      </span>
                    )
                  })}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  )
}