import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="font-bold text-gray-800 text-lg">
          SentimentAI
        </span>
        <div className="flex gap-6">
          {[
            { to: '/',        label: 'Analyze' },
            { to: '/compare', label: 'Compare' },
            { to: '/batch', label: 'Batch' }
          ].map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors
                 ${isActive ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}