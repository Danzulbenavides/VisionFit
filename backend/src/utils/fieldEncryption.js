import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION = "v1";

const getEncryptionKey = () => {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY is missing from the environment");
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
  }

  return Buffer.from(keyHex, "hex");
};

export const encryptField = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  const key = getEncryptionKey();

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = Buffer.from(JSON.stringify(value), "utf8");

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decryptField = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  // Allows existing unencrypted records to continue
  // working during the migration period.
  if (typeof value !== "string" || !value.startsWith(`${VERSION}:`)) {
    return value;
  }

  const parts = value.split(":");

  if (parts.length !== 4) {
    throw new Error("Invalid encrypted field format");
  }

  const [, ivHex, authTagHex, encryptedHex] = parts;

  const key = getEncryptionKey();

  const iv = Buffer.from(ivHex, "hex");

  const authTag = Buffer.from(authTagHex, "hex");

  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
};
