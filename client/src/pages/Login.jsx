import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = login(email, password);
    
    if (result.success) {
      window.location.href = '/';
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0d1117]">
      <div className="w-full max-w-[400px] bg-[#161b22] border border-[#30363d] rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#e6edf3] mb-2">Welcome back</h1>
          <p className="text-sm text-[#c9d1d9]">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-sm text-red-500">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#c9d1d9]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#0d1117] text-sm text-[#e6edf3] outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#c9d1d9]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#0d1117] text-sm text-[#e6edf3] outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="h-10 bg-blue-500 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#c9d1d9] mt-5">
          Don't have an account? <Link to="/signup" className="text-blue-500 no-underline font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}