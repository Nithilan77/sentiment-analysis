import ConfidenceBar from './ConfidenceBar'

const SENTIMENT_CONFIG = {
  Positive : { emoji: '😊', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  Neutral  : { emoji: '😐', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  Negative : { emoji: '😞', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' }
}

export default function ResultCard({ result, model }) {
  if (!result) return null

  const config = SENTIMENT_CONFIG[result.sentiment]

  return (
    <div className={`rounded-2xl border p-6 ${config.bg} ${config.border}`}>
      
      {/* model badge */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {model === 'bert' ? 'BERT (fine-tuned)' : 'TF-IDF + Logistic Regression'}
        </span>
        <span className="text-xs text-gray-400">{result.latency_ms}ms</span>
      </div>

      {/* sentiment */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-5xl">{config.emoji}</span>
        <div>
          <p className={`text-3xl font-bold ${config.color}`}>
            {result.sentiment}
          </p>
          <p className="text-sm text-gray-500">
            {result.confidence.toFixed(1)}% confidence
          </p>
        </div>
      </div>

      {/* confidence bars */}
      <ConfidenceBar scores={result.scores} />

    </div>
  )
}