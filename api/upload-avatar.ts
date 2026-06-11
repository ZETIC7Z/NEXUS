import { put, del } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: false, // We handle the raw stream manually
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "DELETE") {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
      }
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Avatar delete error:", error);
      return res.status(500).json({ error: error.message || "Delete failed" });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Read the raw body as a Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    // Get content type from header
    const contentType = (req.headers["x-content-type"] as string) || "image/jpeg";
    const filename = (req.headers["x-filename"] as string) || `avatar-${Date.now()}.jpg`;

    // Validate it's an image
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ error: "Only image files are allowed" });
    }

    // Limit file size to 5MB
    if (body.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large. Maximum 5MB." });
    }

    // Upload to Vercel Blob
    const blob = await put(`avatars/${filename}`, body, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({ error: "Upload failed. Please try again." });
  }
}
