import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = window.location.pathname.split('/verify/')[1];
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/verify/${token}`);
        const data = await response.json();

        if (response.ok) {
          window.location.href = '/login?msg=verified';
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch {
        setStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <div className="w-full max-w-[400px] bg-surface border border-default rounded-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-xl font-bold text-primary mb-2">Verifying your email...</h1>
            <p className="text-sm text-secondary">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-danger mb-2">Verification Failed</h1>
            <p className="text-sm text-secondary mb-4">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-block h-10 bg-accent rounded-lg text-sm font-semibold text-white px-6 cursor-pointer hover:opacity-90 transition-opacity"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}