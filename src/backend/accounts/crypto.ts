import { pbkdf2Async } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import forge from "node-forge";

type Keys = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  seed: Uint8Array;
};

function uint8ArrayToBuffer(array: Uint8Array): forge.util.ByteStringBuffer {
  return forge.util.createBuffer(
    Array.from(array)
      .map((byte) => String.fromCharCode(byte))
      .join(""),
  );
}

async function seedFromMnemonic(mnemonic: string) {
  return pbkdf2Async(sha256, mnemonic, "mnemonic", {
    c: 2048,
    dkLen: 32,
  });
}

export function verifyValidMnemonic(mnemonic: string) {
  // First try to validate as BIP39 mnemonic
  if (validateMnemonic(mnemonic, wordlist)) {
    return true;
  }

  // If not a valid BIP39 mnemonic, check if it's a valid custom passphrase
  const validPassphraseRegex =
    /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=:;"'<>[\]{}|\\/`~]+$/;
  return mnemonic.length >= 8 && validPassphraseRegex.test(mnemonic);
}

export async function keysFromSeed(seed: Uint8Array): Promise<Keys> {
  const { privateKey, publicKey } = forge.pki.ed25519.generateKeyPair({
    seed,
  });

  return {
    privateKey: new Uint8Array(privateKey),
    publicKey: new Uint8Array(publicKey),
    seed,
  };
}

export async function keysFromMnemonic(mnemonic: string): Promise<Keys> {
  const seed = await seedFromMnemonic(mnemonic);

  return keysFromSeed(seed);
}

export function genMnemonic(): string {
  return generateMnemonic(wordlist);
}

/**
 * Generate a deterministic passphrase from username and password.
 * This allows users to login with familiar credentials while maintaining
 * backend compatibility that expects a passphrase/mnemonic.
 */
export async function generatePassphraseFromCredentials(
  username: string,
  password: string,
): Promise<string> {
  // Create a combined string from username and password
  const combined = `nexus:${username.toLowerCase().trim()}:${password}`;

  // Use PBKDF2 to derive 16 bytes of entropy (128 bits, enough for 12-word mnemonic)
  const entropy = await pbkdf2Async(sha256, combined, "nexus-auth-salt", {
    c: 10000, // 10000 iterations for reasonable security
    dkLen: 16, // 16 bytes = 128 bits = 12 word mnemonic
  });

  // Convert entropy to mnemonic using BIP39
  // This creates a valid 12-word mnemonic from the derived entropy
  const { entropyToMnemonic } = await import("@scure/bip39");
  return entropyToMnemonic(entropy, wordlist);
}

export async function signCode(
  code: string,
  privateKey: Uint8Array,
): Promise<Uint8Array> {
  const signature = forge.pki.ed25519.sign({
    encoding: "utf8",
    message: code,
    privateKey: uint8ArrayToBuffer(privateKey),
  });
  return new Uint8Array(signature);
}

export function bytesToBase64(bytes: Uint8Array) {
  return forge.util.encode64(String.fromCodePoint(...bytes));
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=+$/, "");
}

export async function signChallenge(keys: Keys, challengeCode: string) {
  const signature = await signCode(challengeCode, keys.privateKey);
  return bytesToBase64Url(signature);
}

export function base64ToBuffer(data: string) {
  return forge.util.binary.base64.decode(data);
}

export function base64ToStringBuffer(data: string) {
  const decoded = base64ToBuffer(data);

  return uint8ArrayToBuffer(decoded);
}

export function stringBufferToBase64(buffer: forge.util.ByteStringBuffer) {
  return forge.util.encode64(buffer.getBytes());
}

export async function encryptData(data: string, secret: Uint8Array) {
  if (secret.byteLength !== 32)
    throw new Error("Secret must be at least 256-bit");

  const iv = await new Promise<string>((resolve, reject) => {
    forge.random.getBytes(16, (err, bytes) => {
      if (err) reject(err);
      resolve(bytes);
    });
  });

  const cipher = forge.cipher.createCipher(
    "AES-GCM",
    uint8ArrayToBuffer(secret),
  );
  cipher.start({
    iv,
    tagLength: 128,
  });
  cipher.update(forge.util.createBuffer(data, "utf8"));
  cipher.finish();

  const encryptedData = cipher.output;
  const tag = cipher.mode.tag;

  return `${forge.util.encode64(iv)}.${stringBufferToBase64(
    encryptedData,
  )}.${stringBufferToBase64(tag)}` as const;
}

export function decryptData(data: string, secret: Uint8Array) {
  if (secret.byteLength !== 32) throw new Error("Secret must be 256-bit");

  const [iv, encryptedData, tag] = data.split(".");

  const decipher = forge.cipher.createDecipher(
    "AES-GCM",
    uint8ArrayToBuffer(secret),
  );
  decipher.start({
    iv: base64ToStringBuffer(iv),
    tag: base64ToStringBuffer(tag),
    tagLength: 128,
  });
  decipher.update(base64ToStringBuffer(encryptedData));
  const pass = decipher.finish();

  if (!pass) throw new Error("Error decrypting data");

  return decipher.output.toString();
}
