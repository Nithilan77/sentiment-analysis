import { useState, useRef } from 'react'
import axios from 'axios'

export default function BatchUpload() {
  const [file,     setFile]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [summary,  setSummary]  = useState(null)
  const [error,    setError]    = useState(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.')
      return
    }
    setFile(f)
    setError(null)
    setSummary(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setSummary(null)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(
        'http://localhost:8000/predict/file',
        formData,
        {
          headers      : { 'Content-Type': 'multipart/form-data' },
          responseType : 'blob',
          onUploadProgress: (e) => {
            setProgress(Math.round(e.loaded / e.total * 50))
          },
          onDownloadProgress: (e) => {
            setProgress(50 + Math.round(e.loaded / (e.total || 1) * 50))
          }
        }
      )

      // extract summary from response headers
      const total   = response.headers['x-total-reviews']
      const posPct  = response.headers['x-positive-pct']
      const neuPct  = response.headers['x-neutral-pct']
      const negPct  = response.headers['x-negative-pct']

      setSummary({ total, posPct, neuPct, negPct })

      // trigger download
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', 'sentiment_results.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

    } catch (err) {
      if (err.response) {
        const text = await err.response.data.text()
        try {
          const parsed = JSON.parse(text)
          setError(parsed.detail || 'Something went wrong.')
        } catch {
          setError('Something went wrong.')
        }
      } else {
        setError('Could not connect to API. Make sure the server is running.')
      }
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Batch Analysis
      </h1>
      <p className="text-gray-500 mb-8">
        Upload a CSV file with a <code className="bg-gray-100 px-1 rounded">review</code> column.
        Get back a results CSV with sentiment and confidence for every row.
      </p>

      {/* format note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
        CSV must have a column named <strong>review</strong>. Other columns are preserved in the output.
        Maximum 50,000 reviews per file.
      </div>

      {/* upload area */}
      <div
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10
                   text-center cursor-pointer hover:border-gray-500
                   transition-all mb-4 bg-white"
      >
        <p className="text-4xl mb-3">📂</p>
        {file
          ? <p className="text-gray-700 font-medium">{file.name}</p>
          : <p className="text-gray-400">Click to select a CSV file</p>
        }
        {file && (
          <p className="text-xs text-gray-400 mt-1">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* progress bar */}
      {loading && (
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-full bg-gray-800 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-3 rounded-xl bg-gray-800 text-white font-medium
                   hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all mb-6"
      >
        {loading ? `Processing... ${progress}%` : 'Analyze & Download Results'}
      </button>

      {/* error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200
                        rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* summary */}
      {summary && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <p className="text-green-700 font-semibold mb-4">
            ✅ Done — {summary.total} reviews analyzed. Results downloaded.
          </p>
        </div>
      )}

      {/* sample CSV hint */}
      <div className="mt-8 text-xs text-gray-400">
        <p className="font-medium mb-1">Expected CSV format:</p>
        <code className="block bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-600">
          review<br/>
          "The food was amazing!"<br/>
          "Terrible service, never coming back."<br/>
          "It was okay, nothing special."
        </code>
      </div>

    </div>
  )
}