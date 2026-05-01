import { Resend } from "resend";

export const sendVerificationEmail = async (email, name, token) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const verifyUrl = `${process.env.CLIENT_URL}/verify/${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Verify your email address",
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a>
      <p>Or copy this link: ${verifyUrl}</p>
    `
  });
};