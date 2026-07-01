import { put, list, del } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("BLOB_READ_WRITE_TOKEN is not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // ── POST: Create or update a QR session ──────────────────────────────────
  if (req.method === "POST") {
    try {
      const { id, session } = req.body;
      if (!id || !session) {
        return res.status(400).json({ error: "Missing id or session body" });
      }

      const blob = await put(`nexus-qr-${id}.json`, JSON.stringify(session), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        token,
        allowOverwrite: true,
      });

      return res.status(200).json({ url: blob.url });
    } catch (err: any) {
      console.error("Vercel QR POST error:", err);
      return res.status(500).json({ error: err.message || "Failed to save session" });
    }
  }

  // ── GET: Read a QR session ────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const id = req.query.id as string;
      if (!id) {
        return res.status(400).json({ error: "Missing session ID" });
      }

      const listResult = await list({
        prefix: `nexus-qr-${id}.json`,
        token,
      });

      const blobs = listResult.blobs || [];
      if (blobs.length === 0) {
        return res.status(404).json({ error: "Session not found" });
      }

      const latestBlob = blobs[0];

      // Fetch file content with cache buster to avoid CDN staleness
      const fetchRes = await fetch(`${latestBlob.url}?t=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      });

      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({ error: "Failed to fetch session content" });
      }

      const data = await fetchRes.json();

      // Set no-cache headers on the response
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      return res.status(200).json(data);
    } catch (err: any) {
      console.error("Vercel QR GET error:", err);
      return res.status(500).json({ error: err.message || "Failed to get session" });
    }
  }

  // ── DELETE: Remove a QR session after it has been claimed ─────────────────
  if (req.method === "DELETE") {
    try {
      const id = req.query.id as string;
      if (!id) {
        return res.status(400).json({ error: "Missing session ID" });
      }

      const listResult = await list({
        prefix: `nexus-qr-${id}.json`,
        token,
      });

      const blobs = listResult.blobs || [];
      if (blobs.length > 0) {
        const urls = blobs.map((b) => b.url);
        await del(urls, { token });
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Vercel QR DELETE error:", err);
      return res.status(500).json({ error: err.message || "Failed to delete session" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
