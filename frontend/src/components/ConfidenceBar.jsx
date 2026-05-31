const COLORS = {
  Positive : '#3B6D11',
  Neutral  : '#B87D00',
  Negative : '#A32D2D'
}

export default function ConfidenceBar({ scores }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([label, score]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-sm w-20 text-gray-600">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width      : `${score}%`,
                  background : COLORS[label]
                }}
              />
            </div>
            <span className="text-sm font-medium w-14 text-right">
              {score.toFixed(1)}%
            </span>
          </div>
        ))}
    </div>
  )
}