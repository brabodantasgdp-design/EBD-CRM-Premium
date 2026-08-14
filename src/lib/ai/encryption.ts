import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const algorithm = "aes-256-gcm";
const version = "v1";

function masterKey(): Buffer {
  const raw = process.env.AI_CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) throw new Error("ai_encryption_key_not_configured");
  const key = Buffer.from(raw, /^[0-9a-f]{64}$/i.test(raw) ? "hex" : "base64");
  if (key.length !== 32) throw new Error("ai_encryption_key_invalid");
  return key;
}

export function encryptAICredential(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, masterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [version, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptAICredential(payload: string): string {
  const [payloadVersion, ivValue, tagValue, encryptedValue] = payload.split(":");
  if (payloadVersion !== version || !ivValue || !tagValue || !encryptedValue) throw new Error("ai_credential_invalid");
  const decipher = createDecipheriv(algorithm, masterKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}
