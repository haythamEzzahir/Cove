import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { getJson } from '../config';

export default function VerifyPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      pasted.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');

    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await getJson(response);

      if (response.ok) {
        setSuccess('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login?msg=verified'), 1500);
      } else {
        setError(data.message || 'Invalid code');
        if (data.attemptsRemaining != null) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  const handleResend = useCallback(async () => {
    setError('');
    setResendDisabled(true);
    setAttemptsRemaining(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await getJson(response);

      if (response.ok) {
        setSuccess('New code sent! Check your inbox.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setTimeout(() => setResendDisabled(false), 60000);
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <div className="w-full max-w-[400px] bg-surface border border-default rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-primary mb-2">Check your email</h1>
        <p className="text-sm text-secondary mb-2">
          We've sent a 6-digit code to
        </p>
        <p className="text-sm font-medium text-primary mb-6">{email}</p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <div className="flex gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-default bg-base text-primary outline-none focus:border-accent transition-colors"
              />
            ))}
          </div>

          {error && (
            <div className="w-full bg-danger/15 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
              {attemptsRemaining != null && attemptsRemaining > 0 && (
                <span className="block mt-1">{attemptsRemaining} attempts remaining</span>
              )}
            </div>
          )}

          {success && (
            <div className="w-full bg-success/15 border border-success/30 rounded-lg p-3 text-sm text-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 bg-accent rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 w-full"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resendDisabled}
          className="mt-4 text-sm text-accent hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendDisabled ? 'Resend in 60s...' : "Didn't receive the code? Resend"}
        </button>

        <button
          onClick={() => navigate('/login')}
          className="mt-4 block text-sm text-secondary hover:text-primary cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
