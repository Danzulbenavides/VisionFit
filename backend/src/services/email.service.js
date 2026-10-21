import axios from "axios";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const isEmailConfigured = () =>
  Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }

  try {
    await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: process.env.EMAIL_FROM_NAME || "VisionFit",
          email: process.env.EMAIL_FROM,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        timeout: 15000,
      },
    );
  } catch (error) {
    console.error(
      "Brevo transactional email failed:",
      error.response?.status || error.code || error.message,
    );
    throw new Error("Could not send email through Brevo.");
  }
};
export const sendVerificationEmail = async ({ to, firstName, code }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }



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

  await sendEmail({
    to,
    subject: "Your VisionFit verification code",
    text: `Your VisionFit verification code is: ${code}. It expires in 10 minutes.`,
    html,
  });
};

export const sendPasswordResetEmail = async ({ to, firstName, code }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }



  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E5E5E5; border-radius: 12px;">
      <h2 style="margin: 0 0 8px; color: #111111;">VisionFit</h2>
      <p style="margin: 0 0 16px; color: #444444;">Hi ${firstName || "there"},</p>
      <p style="margin: 0 0 16px; color: #444444;">
        Use the code below to reset your VisionFit password. It expires in 10
        minutes.
      </p>
      <p style="font-size: 34px; font-weight: bold; letter-spacing: 10px; text-align: center; color: #111111; background: #F5F5F5; padding: 18px 0; border-radius: 8px; margin: 0 0 16px;">
        ${code}
      </p>
      <p style="margin: 0; color: #888888; font-size: 13px;">
        If you did not request a password reset, you can safely ignore this
        email. Your password will not change.
      </p>
    </div>
  `;

  await sendEmail({
    to,
    subject: "Your VisionFit password reset code",
    text: `Your VisionFit password reset code is: ${code}. It expires in 10 minutes.`,
    html,
  });
};

export const sendPinResetEmail = async ({
  to,
  firstName,
  code,
  accountEmail,
}) => {
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }



  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E5E5E5; border-radius: 12px;">
      <h2 style="margin: 0 0 8px; color: #111111;">VisionFit</h2>
      <p style="margin: 0 0 16px; color: #444444;">Hi ${firstName || "there"},</p>
      <p style="margin: 0 0 16px; color: #444444;">
        Use the code below to reset the VisionFit PIN for
        <strong>${accountEmail}</strong>. It expires in 10 minutes.
      </p>
      <p style="font-size: 34px; font-weight: bold; letter-spacing: 10px; text-align: center; color: #111111; background: #F5F5F5; padding: 18px 0; border-radius: 8px; margin: 0 0 16px;">
        ${code}
      </p>
      <p style="margin: 0; color: #888888; font-size: 13px;">
        If you did not request a PIN reset, you can safely ignore this email.
        The PIN will not change.
      </p>
    </div>
  `;

  await sendEmail({
    to,
    subject: "Your VisionFit PIN reset code",
    text: `Your VisionFit PIN reset code is: ${code}. It resets the PIN for ${accountEmail} and expires in 10 minutes.`,
    html,
  });
};

