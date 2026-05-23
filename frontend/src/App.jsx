import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar  from './components/Navbar'
import Home    from './pages/Home'
import Compare from './pages/Compare'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/"        element={<Home />}    />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}