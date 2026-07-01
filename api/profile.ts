import { put, list } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_GPYPOTy4nsuDbTkt_dqIwx7OMmVixumAmWdjgBMg8mcXTFu";

  if (req.method === "POST") {
    try {
      const { seedHash, profileData } = req.body;
      if (!seedHash || !profileData) {
        return res.status(400).json({ error: "Missing seedHash or profileData" });
      }

      const blob = await put(`profiles/profile-${seedHash}.json`, JSON.stringify(profileData), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        token,
        allowOverwrite: true,
      });

      return res.status(200).json({ url: blob.url });
    } catch (err: any) {
      console.error("Vercel profile POST error:", err);
      return res.status(500).json({ error: err.message || "Failed to save profile" });
    }
  }

  if (req.method === "GET") {
    try {
      const seedHash = req.query.seedHash as string;
      if (!seedHash) {
        return res.status(400).json({ error: "Missing seedHash" });
      }

      const listResult = await list({
        prefix: `profiles/profile-${seedHash}.json`,
        token,
      });

      const blobs = listResult.blobs || [];
      if (blobs.length === 0) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const latestBlob = blobs[0];

      // Fetch file content with cache buster
      const fetchRes = await fetch(`${latestBlob.url}?t=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      });

      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({ error: "Failed to fetch profile content" });
      }

      const data = await fetchRes.json();
      return res.status(200).json(data);
    } catch (err: any) {
      console.error("Vercel profile GET error:", err);
      return res.status(500).json({ error: err.message || "Failed to get profile" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
