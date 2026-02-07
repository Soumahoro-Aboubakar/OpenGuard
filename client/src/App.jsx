import { Routes, Route, NavLink } from 'react-router-dom';
import { Shield, User, Users } from 'lucide-react';
import Contributor from './pages/Contributor';
import Maintainer from './pages/Maintainer';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-primary-dark font-bold text-xl">
            <Shield className="w-8 h-8 text-primary" />
            OpenGuard
          </NavLink>
          <nav className="flex gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <User className="w-4 h-4" />
              Open-source contributor
            </NavLink>
            <NavLink
              to="/maintainer"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Users className="w-4 h-4" />
              Project maintainer
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Contributor />} />
          <Route path="/maintainer" element={<Maintainer />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-gray-500 text-sm">
        OpenGuard — Automatic Pull Request Analysis and Fixing with Gemini
      </footer>
    </div>
  );
}

export default App;