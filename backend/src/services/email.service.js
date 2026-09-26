import nodemailer from "nodemailer";

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;

export const isEmailConfigured = () =>
  Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () =>
  nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendVerificationEmail = async ({ to, firstName, code }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }

  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E5E5E5; border-radius: 12px;">
      <h2 style="margin: 0 0 8px; color: #111111;">VisionFit</h2>
      <p style="margin: 0 0 16px; color: #444444;">Hi ${firstName || "there"},</p>
      <p style="margin: 0 0 16px; color: #444444;">
        Use the verification code below to finish creating your account.
        It expires in 10 minutes.
      </p>
      <p style="font-size: 34px; font-weight: bold; letter-spacing: 10px; text-align: center; color: #111111; background: #F5F5F5; padding: 18px 0; border-radius: 8px; margin: 0 0 16px;">
        ${code}
      </p>
      <p style="margin: 0; color: #888888; font-size: 13px;">
        If you did not create a VisionFit account, you can safely ignore this
        email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Your VisionFit verification code",
    text: `Your VisionFit verification code is: ${code}. It expires in 10 minutes.`,
    html,
  });
};
