import { Resend } from "resend";

export const sendVerificationEmail = async (email, name, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "FinTracker <onboarding@resend.dev>",
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