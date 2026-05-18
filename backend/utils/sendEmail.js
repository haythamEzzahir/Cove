import { Resend } from "resend";

let resend = null;

// Lazy-init the Resend client (only if API key is configured)
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Send an OTP verification email to the user
export const sendVerificationEmail = async (email, name, otp) => {
  const client = getResend();
  if (!client) {
    console.error("RESEND_API_KEY is not configured");
    return;
  }

  await client.emails.send({
    from: "Cove <onboarding@resend.dev>",
    to: email,
    subject: "Your verification code",
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Use the code below to verify your email address:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #3b82f6;">${otp}</div>
      <p>This code expires in 10 minutes.</p>
    `
  });
};

// Send a price alert notification email when a user's alert is triggered
export const sendPriceAlertEmail = async (email, name, coinName, condition, targetPrice, currentPrice, symbol) => {
  const client = getResend();
  if (!client) {
    console.error("RESEND_API_KEY is not configured");
    return;
  }

  const color = condition === 'above' ? '#22c55e' : '#ef4444';
  const arrow = condition === 'above' ? '↑' : '↓';

  await client.emails.send({
    from: "Cove <onboarding@resend.dev>",
    to: email,
    subject: `🔔 Price Alert: ${coinName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 400px; margin: 0 auto;">
        <div style="background: ${color}; padding: 16px 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <span style="font-size: 24px;">${arrow}</span>
          <h2 style="color: #fff; margin: 4px 0 0;">${coinName} Price Alert</h2>
        </div>
        <div style="background: #1a1f27; padding: 24px; border-radius: 0 0 12px 12px; color: #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0 0 16px;">Hi ${name}, your alert was triggered:</p>
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">Target: <span style="color: ${color}; font-weight: 600;">${symbol}${targetPrice.toLocaleString()}</span></p>
            <p style="margin: 0; font-size: 13px; color: #9ca3af;">Current: <span style="color: #fff; font-weight: 600;">${symbol}${currentPrice.toLocaleString()}</span></p>
          </div>
          <p style="color: #6b7280; font-size: 11px; margin: 0;">— Cove</p>
        </div>
      </div>
    `
  });
};