import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AUTH_REDIRECT_KEY = 'fintracker_auth_redirect';

function getSafeRedirectPath(path) {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();

  const getRedirectPath = () => {
    const params = new URLSearchParams(location.search);
    const redirectParam = params.get('redirect');
    const savedRedirect = sessionStorage.getItem(AUTH_REDIRECT_KEY);
    return getSafeRedirectPath(redirectParam || savedRedirect);
  };

  const redirectAfterAuth = () => {
    const target = getRedirectPath();
    sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    window.location.href = target;
  };

  const googleLoginHandler = useGoogleLogin({
    flow: 'auth-code',
    scope: 'openid email profile',
    onSuccess: async (codeResponse) => {
      try {
        setError('');

        if (!codeResponse.code) {
          setError('Google authorization code missing');
          return;
        }

        const result = await googleLogin(codeResponse.code);

        if (result.success) {
          redirectAfterAuth();
        } else {
          setError(result.error || 'Google authentication failed');
        }
      } catch (error) {
        console.error('Google login handler error:', error);
        setError('Google authentication failed');
      }
    },
    onError: () => {
      setError('Google login failed');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      redirectAfterAuth();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <div className="w-full max-w-[400px] bg-surface border border-default rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome back</h1>
          <p className="text-sm text-secondary">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-danger/15 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="h-10 bg-accent rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => googleLoginHandler()}
            className="h-10 rounded-lg border border-default bg-base text-sm font-semibold text-primary cursor-pointer hover:bg-overlay transition-colors"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-5">
          Don't have an account? <Link to={`/signup${location.search}`} className="text-accent no-underline font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
