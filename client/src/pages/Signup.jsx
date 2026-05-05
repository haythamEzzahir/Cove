import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const result = await signup(name, email, password);

    if (result.success) {
      navigate(`/verify-pending?email=${encodeURIComponent(email)}`, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <div className="w-full max-w-[400px] bg-surface border border-default rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">Create account</h1>
          <p className="text-sm text-secondary">Get started with FinTracker</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-danger/15 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              maxLength={100}
              className="h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              maxLength={255}
              className="h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 8 characters)"
              required
              minLength={8}
              maxLength={128}
              className="h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 bg-accent rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-5">
          Already have an account? <Link to={`/login${location.search}`} className="text-accent no-underline font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
