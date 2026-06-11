import { sha256 } from "@noble/hashes/sha256";

/** Hash a passphrase/seed to create a deterministic unique string */
export function hashPassphrase(passphrase: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase.trim().toLowerCase());
  const hashBytes = sha256(data);
  return Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Upload an avatar image to Vercel Blob storage via the /api/upload-avatar endpoint.
 * Naming is deterministic if a seed phrase is provided to associate it with the user.
 * Returns the public Blob URL on success.
 */
export async function uploadAvatar(file: File, seed?: string): Promise<string> {
  // Always normalize to .jpg so uploads with same seed always overwrite the same file
  const seedHash = seed ? hashPassphrase(seed) : null;
  const filename = seedHash
    ? `avatar-${seedHash}.jpg`
    : `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const res = await fetch("/api/upload-avatar", {
    method: "POST",
    headers: {
      "x-content-type": "image/jpeg",
      "x-filename": filename,
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  return data.url as string;
}

export interface UserVercelProfile {
  nickname: string;
  profile: {
    colorA: string;
    colorB: string;
    icon: string;
    photoUrl?: string;
  };
}

export async function saveProfileToVercel(
  seed: string,
  nickname: string,
  profile: UserVercelProfile["profile"]
): Promise<void> {
  const seedHash = hashPassphrase(seed);
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seedHash,
      profileData: {
        nickname,
        profile,
      },
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to save profile on Vercel");
  }
}

export async function getProfileFromVercel(seed: string): Promise<UserVercelProfile | null> {
  const seedHash = hashPassphrase(seed);
  try {
    const res = await fetch(`/api/profile?seedHash=${encodeURIComponent(seedHash)}&t=${Date.now()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to load profile from Vercel", err);
    return null;
  }
}

export async function deleteAvatar(url: string): Promise<void> {
  try {
    const res = await fetch(`/api/upload-avatar?url=${encodeURIComponent(url)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete avatar from Vercel");
    }
  } catch (err) {
    console.error("Failed to delete avatar from Vercel Blob", err);
    throw err;
  }
}


