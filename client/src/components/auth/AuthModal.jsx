import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AUTH_REDIRECT_KEY = 'fintracker_auth_redirect';

function getSafeRedirectPath(path) {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

function getRedirectAfterAuth(redirectTo) {
  const savedRedirect = sessionStorage.getItem(AUTH_REDIRECT_KEY);
  const target = getSafeRedirectPath(redirectTo || savedRedirect);
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);

  return target;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', redirectTo = '/' }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, googleLogin } = useAuth();

  const handleAuthSuccess = () => {
    const target = getRedirectAfterAuth(redirectTo);
    onClose?.();
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
          handleAuthSuccess();
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

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    const result = mode === 'login'
      ? await login(email, password)
      : await signup(name, email, password);

    if (result.success) {
      handleAuthSuccess();
      return;
    }

    setError(result.error);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface border border-default rounded-2xl p-8 w-[420px] max-w-[90vw] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex border-b border-default mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-3 text-base font-medium border-none bg-transparent cursor-pointer ${mode === 'login' ? 'text-accent border-b-2 border-accent -mb-px' : 'text-muted hover:text-primary'}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-3 text-base font-medium border-none bg-transparent cursor-pointer ${mode === 'signup' ? 'text-accent border-b-2 border-accent -mb-px' : 'text-muted hover:text-primary'}`}
          >
            Sign up
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={() => googleLoginHandler()}
            disabled={loading}
            className="h-12 flex items-center justify-center gap-2.5 rounded-xl border border-default bg-base text-base font-medium text-primary hover:bg-overlay cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-default" />
          <span className="text-sm text-muted">or</span>
          <div className="flex-1 h-px bg-default" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-danger/15 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12 px-4 rounded-xl border border-default bg-base text-base text-primary outline-none focus:border-accent placeholder:text-muted"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-12 px-4 rounded-xl border border-default bg-base text-base text-primary outline-none focus:border-accent placeholder:text-muted"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (min 6 characters)'}
                className="w-full h-12 px-4 pr-12 rounded-xl border border-default bg-base text-base text-primary outline-none focus:border-accent placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary cursor-pointer bg-transparent border-none p-1"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.72a3 3 0 1 1 4.24 4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 bg-accent rounded-xl text-base font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-50 mt-2"
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Log in' : 'Create account')}
          </button>
        </form>
      </div>
    </div>
  );
}
