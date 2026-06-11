/**
 * QR Login Session Manager
 * Uses Vercel Blob as a temporary key-value store for cross-device login.
 * Sessions expire after 5 minutes automatically (via TTL check).
 */

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface QRSession {
  id: string;
  createdAt: number;
  status: "pending" | "claimed" | "expired";
  requestDevice?: string;
  authData?: {
    token: string;
    userId: string;
    sessionId: string;
    seed: string;
    backendUrl: string;
    account: {
      nickname: string;
      profile: { colorA: string; colorB: string; icon: string; photoUrl?: string };
    };
  };
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator for non-secure HTTP contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Create a new QR login session. Returns the session ID. */
export async function createQRSession(requestDevice?: string): Promise<QRSession> {
  const id = generateUUID();
  const session: QRSession = {
    id,
    createdAt: Date.now(),
    status: "pending",
    requestDevice,
  };
  await saveSession(session);
  return session;
}

/**
 * Claim a QR session with auth data (called by the logged-in scanning device).
 * Directly saves the claimed state without a pre-fetch verification to avoid
 * race conditions and CDN caching issues.
 */
export async function claimQRSession(
  id: string,
  authData: QRSession["authData"],
): Promise<void> {
  // First, verify the session still exists and is claimable
  const session = await getQRSession(id);

  if (!session) {
    throw new Error("Session not found. The QR code may have expired — please generate a new one.");
  }
  if (session.status === "expired") {
    throw new Error("This QR code has expired. Please generate a new one on the requesting device.");
  }
  if (session.status === "claimed") {
    throw new Error("This QR code has already been claimed.");
  }

  // Overwrite the session with claimed status and auth payload
  await saveSession({
    ...session,
    status: "claimed",
    authData,
  });
}

/** Poll a QR session for its current state. Returns null if not found. */
export async function getQRSession(id: string): Promise<QRSession | null> {
  try {
    const res = await fetch(
      `/api/qr-session?id=${encodeURIComponent(id)}&t=${Date.now()}`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );

    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server error ${res.status}`);
    }

    const data = await res.json();

    // Client-side TTL expiry check
    if (Date.now() - data.createdAt > SESSION_TTL_MS) {
      return { ...data, status: "expired" as const };
    }

    return data as QRSession;
  } catch (err) {
    console.error("getQRSession error:", err);
    return null;
  }
}

/** Delete a QR session from Vercel Blob storage (best-effort cleanup). */
export async function deleteQRSession(id: string): Promise<void> {
  try {
    await fetch(`/api/qr-session?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("deleteQRSession error:", err);
  }
}

/** Internal: persist a session to Vercel Blob storage via the API proxy */
async function saveSession(session: QRSession): Promise<void> {
  const res = await fetch("/api/qr-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: session.id, session }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to save QR session" }));
    throw new Error(err.error || "Failed to save QR session");
  }
}

/** Get the full URL that the QR code on the landing page will encode */
export function getQRCodeUrl(sessionId: string): string {
  // Use current origin so it works on both localhost and production
  const origin = window.location.origin;
  return `${origin}/qr-login/${sessionId}`;
}
