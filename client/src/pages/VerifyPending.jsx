import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  
  const [email, setEmail] = useState(emailParam || '');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.message || 'Failed to resend email');
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <div className="w-full max-w-[400px] bg-surface border border-default rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-primary mb-2">Check your email</h1>
        <p className="text-sm text-secondary mb-6">
          We've sent a verification link to your email address.
          Click the link to verify your account.
        </p>

        {sent ? (
          <div className="bg-success/15 border border-success/30 rounded-lg p-3 text-sm text-success mb-4">
            Verification email sent! Please check your inbox.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={handleResend}
                disabled={loading}
                className="h-10 bg-accent rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="bg-danger/15 border border-danger/30 rounded-lg p-3 text-sm text-danger mb-4">
            {error}
          </div>
        )}

        <button
          onClick={() => navigate('/login')}
          className="inline-block h-10 bg-accent rounded-lg text-sm font-semibold text-white px-6 cursor-pointer hover:opacity-90 transition-opacity"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}