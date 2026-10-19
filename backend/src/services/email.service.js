import dns from "node:dns";
import nodemailer from "nodemailer";

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;

export const isEmailConfigured = () =>
  Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

// Why this exists: nodemailer's internal resolver prefers IPv6, and this
// network's IPv6 path to smtp.gmail.com stalls. On top of that nodemailer's
// default connectionTimeout is 2 minutes, so a cold send used to sit ~110s
// before falling back to IPv4. Resolving the IPv4 address ourselves (the
// system resolver answers in <200ms) and handing nodemailer a literal IP
// with the correct TLS SRI name removes that stall: cold sends ~3s, warm
// sends ~1.5s on the pooled connection.
const resolveIPv4 = () =>
  new Promise((resolve) => {
    dns.lookup(SMTP_HOST, { family: 4 }, (error, address) => {
      resolve(error ? null : address);
    });
  });

// One shared, pooled transporter: the TLS+AUTH handshake happens once and
// every later send reuses the live connection instead of re-handshaking.
let sharedTransporter = null;
let creatingTransporter = null;
let resolvedIp = null;

const dropTransporter = (transporter) => {
  if (sharedTransporter !== transporter) {
    return;
  }
  sharedTransporter = null;
  resolvedIp = null; // Gmail rotates IPs; re-resolve on next create
  try {
    transporter.close();
  } catch {
    // already closed
  }
};

const createTransporter = () => {
  if (sharedTransporter) {
    return Promise.resolve(sharedTransporter);
  }

  if (!creatingTransporter) {
    // Single-flight: concurrent first sends share one creation instead of
    // racing and building duplicate transporters.
    creatingTransporter = (async () => {
      if (!resolvedIp) {
        resolvedIp = await resolveIPv4();
      }

      const ip = resolvedIp;

      const transporter = nodemailer.createTransport({
        host: ip || SMTP_HOST,
        servername: ip ? SMTP_HOST : undefined,
        port: SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        pool: true,
        maxConnections: 1,
        keepAlive: true,
        connectionTimeout: 10 * 1000,
        greetingTimeout: 10 * 1000,
        socketTimeout: 60 * 1000,
      });

      transporter.on("error", (error) => {
        console.error("SMTP transporter error:", error.message);
        // If the cached connection/IP went bad, drop it so the next send
        // re-resolves and reconnects fresh.
        dropTransporter(transporter);
      });

      sharedTransporter = transporter;
      return transporter;
    })().finally(() => {
      creatingTransporter = null;
    });
  }

  return creatingTransporter;
};

export const sendVerificationEmail = async ({ to, firstName, code }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }

  const transporter = await createTransporter();

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

export const sendPasswordResetEmail = async ({ to, firstName, code }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }

  const transporter = await createTransporter();

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

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
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

  const transporter = await createTransporter();

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

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Your VisionFit PIN reset code",
    text: `Your VisionFit PIN reset code is: ${code}. It resets the PIN for ${accountEmail} and expires in 10 minutes.`,
    html,
  });
};

