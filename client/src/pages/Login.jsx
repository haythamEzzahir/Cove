import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_REDIRECT_KEY = 'fintracker_auth_redirect';

function getSafeRedirectPath(path) {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

function getInitialEmail(search) {
  const params = new URLSearchParams(search);
  return params.get('msg') === 'verify' ? params.get('email') || '' : '';
}

function getSuccessMessage(search) {
  const params = new URLSearchParams(search);
  const msg = params.get('msg');

  if (msg === 'verify') {
    return 'Account created! Please verify your email before logging in.';
  }

  if (msg === 'verified') {
    return 'Email verified! You can now log in.';
  }

  return '';
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => getInitialEmail(location.search));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const success = getSuccessMessage(location.search);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
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
    navigate(target, { replace: true });
  };

  const googleLoginHandler = useGoogleLogin({
    flow: 'auth-code',
    scope: 'openid email profile',
    onSuccess: async (codeResponse) => {
      try {
        setError('');
        setLoading(true);

        if (!codeResponse.code) {
          setError('Google authorization code missing');
          setLoading(false);
          return;
        }

        const result = await googleLogin({ code: codeResponse.code });

        if (result.success) {
          redirectAfterAuth();
          return;
        }

        setError(result.error || 'Google authentication failed');
      } catch (error) {
        console.error('Google login handler error:', error);
        setError('Google authentication failed');
      }

      setLoading(false);
    },
    onError: () => {
      setError('Google login failed');
      setLoading(false);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      redirectAfterAuth();
      return;
    } else {
      if (result.needsVerification) {
        setNeedsVerification(true);
        setError(result.error);
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setVerificationSent(true);
        setError('');
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <div className="w-full max-w-[400px] bg-surface border border-default rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome back</h1>
          <p className="text-sm text-secondary">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {success && (
            <div className="bg-success/15 border border-success/30 rounded-lg p-3 text-sm text-success">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-danger/15 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {needsVerification && !verificationSent && (
            <button
              type="button"
              onClick={handleResendVerification}
              className="text-sm text-accent hover:underline cursor-pointer"
            >
              Resend verification email
            </button>
          )}

          {verificationSent && (
            <div className="bg-success/15 border border-success/30 rounded-lg p-3 text-sm text-success">
              Verification email sent! Please check your inbox.
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
            disabled={loading}
            className="h-10 rounded-lg border border-default bg-base text-sm font-semibold text-primary cursor-pointer hover:bg-overlay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-5">
          Don't have an account? <Link to={`/signup${location.search}`} className="text-accent no-underline font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
