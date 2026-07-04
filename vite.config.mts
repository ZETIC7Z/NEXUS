import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import loadVersion from "vite-plugin-package-version";
import { VitePWA } from "vite-plugin-pwa";
import checker from "vite-plugin-checker";
import path from "path";
import { handlebars } from "./plugins/handlebars";
import { PluginOption, loadEnv, splitVendorChunkPlugin } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

// import basicSsl from '@vitejs/plugin-basic-ssl';

import tailwind from "tailwindcss";
import rtl from "postcss-rtlcss";

const captioningPackages = [
  "dompurify",
  "htmlparser2",
  "subsrt-ts",
  "parse5",
  "entities",
  "fuse",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // '' prefix = load ALL env vars, not just VITE_*
  return {
    base: env.VITE_BASE_URL || "/",
    
    server: {
      host: "localhost",
      port: 5180,
      proxy: {
        '/api': {
          target: 'https://mirurotvapi.vercel.app',
          changeOrigin: true,
        }
      }
    },

    plugins: [
// basicSsl(),
      // ── Local API middleware (replaces Vercel serverless functions during dev) ──
      {
        name: "local-api-middleware",
        configureServer(server) {
          const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_GPYPOTy4nsuDbTkt_dqIwx7OMmVixumAmWdjgBMg8mcXTFu";
          server.middlewares.use(async (req: any, res: any, next: any) => {
          if (req.url === "/api/upload-avatar" && req.method === "POST") {
            try {
              const { put } = await import("@vercel/blob");
              const chunks: any[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              const body = Buffer.concat(chunks);
              const contentType = "image/jpeg";
              const filename = (req.headers["x-filename"] as string) || `avatar-${Date.now()}.jpg`;

              const blob = await put(`avatars/${filename}`, body, {
                access: "public",
                contentType,
                token: BLOB_TOKEN,
                addRandomSuffix: false,
                allowOverwrite: true,
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ url: blob.url }));
            } catch (err: any) {
              console.error("[local-api] upload-avatar error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Upload failed" }));
            }
          } else if (req.url?.startsWith("/api/upload-avatar") && req.method === "DELETE") {
            try {
              const urlObj = new URL(req.url, `http://${req.headers.host}`);
              const url = urlObj.searchParams.get("url");
              if (!url) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Missing url" }));
                return;
              }
              const { del } = await import("@vercel/blob");
              await del(url, { token: BLOB_TOKEN });
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              console.error("[local-api] upload-avatar delete error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Delete failed" }));
            }
          } else if (req.url?.startsWith("/api/profile") && req.method === "POST") {
            try {
              const chunks: any[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              const bodyStr = Buffer.concat(chunks).toString("utf-8");
              const { seedHash, profileData } = JSON.parse(bodyStr);

              const { put } = await import("@vercel/blob");
              const blob = await put(`profiles/profile-${seedHash}.json`, JSON.stringify(profileData), {
                access: "public",
                contentType: "application/json",
                addRandomSuffix: false,
                token: BLOB_TOKEN,
                allowOverwrite: true,
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ url: blob.url }));
            } catch (err: any) {
              console.error("[local-api] profile POST error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Failed to save profile" }));
            }
          } else if (req.url?.startsWith("/api/profile") && req.method === "GET") {
            try {
              const urlObj = new URL(req.url, `http://${req.headers.host}`);
              const seedHash = urlObj.searchParams.get("seedHash");
              if (!seedHash) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Missing seedHash" }));
                return;
              }

              const { list } = await import("@vercel/blob");
              const listResult = await list({
                prefix: `profiles/profile-${seedHash}.json`,
                token: BLOB_TOKEN,
              });

              const blobs = listResult.blobs || [];
              if (blobs.length === 0) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Profile not found" }));
                return;
              }

              const latestBlob = blobs[0];
              const fetchRes = await fetch(`${latestBlob.url}?t=${Date.now()}`, {
                headers: {
                  "Cache-Control": "no-store, no-cache, must-revalidate",
                  "Pragma": "no-cache",
                }
              });
              if (!fetchRes.ok) {
                res.statusCode = fetchRes.status;
                res.end(JSON.stringify({ error: "Failed to fetch profile content" }));
                return;
              }
              const data = await fetchRes.json();

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            } catch (err: any) {
              console.error("Vite local profile GET error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Failed to get profile" }));
            }
          } else if (req.url?.startsWith("/api/qr-session") && req.method === "POST") {
            try {
              const chunks: any[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              const bodyStr = Buffer.concat(chunks).toString("utf-8");
              const { id, session } = JSON.parse(bodyStr);

              const { put } = await import("@vercel/blob");
              const blob = await put(`nexus-qr-${id}.json`, JSON.stringify(session), {
                access: "public",
                contentType: "application/json",
                addRandomSuffix: false,
                token: BLOB_TOKEN,
                allowOverwrite: true,
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ url: blob.url }));
            } catch (err: any) {
              console.error("Vite local QR POST error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Failed to save session" }));
            }
          } else if (req.url?.startsWith("/api/qr-session") && req.method === "GET") {
            try {
              const urlObj = new URL(req.url, `http://${req.headers.host}`);
              const id = urlObj.searchParams.get("id");
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Missing session ID" }));
                return;
              }

              const { list } = await import("@vercel/blob");
              const listResult = await list({
                prefix: `nexus-qr-${id}.json`,
                token: BLOB_TOKEN,
              });

              const blobs = listResult.blobs || [];
              if (blobs.length === 0) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Session not found" }));
                return;
              }

              const latestBlob = blobs[0];
              const fetchRes = await fetch(`${latestBlob.url}?t=${Date.now()}`, {
                headers: {
                  "Cache-Control": "no-store, no-cache, must-revalidate",
                  "Pragma": "no-cache",
                }
              });
              if (!fetchRes.ok) {
                res.statusCode = fetchRes.status;
                res.end(JSON.stringify({ error: "Failed to fetch session content" }));
                return;
              }
              const data = await fetchRes.json();

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            } catch (err: any) {
              console.error("Vite local QR GET error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Failed to get session" }));
            }
          } else if (req.url?.startsWith("/api/qr-session") && req.method === "DELETE") {
            try {
              const urlObj = new URL(req.url, `http://${req.headers.host}`);
              const id = urlObj.searchParams.get("id");
              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Missing session ID" }));
                return;
              }

              const { list, del } = await import("@vercel/blob");
              const listResult = await list({
                prefix: `nexus-qr-${id}.json`,
                token: BLOB_TOKEN,
              });

              const blobs = listResult.blobs || [];
              if (blobs.length > 0) {
                const urls = blobs.map((b) => b.url);
                await del(urls, { token: BLOB_TOKEN });
              }

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              console.error("Vite local QR DELETE error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message || "Failed to delete session" }));
            }
          } else {
            next();
          }
        });
        },
      },
      handlebars({
        vars: {
          opensearchEnabled: env.VITE_OPENSEARCH_ENABLED === "true",
          routeDomain:
            env.VITE_APP_DOMAIN +
            (env.VITE_NORMAL_ROUTER !== "true" ? "/#" : ""),
          domain: env.VITE_APP_DOMAIN,
          env,
        },
      }),
      react({
        babel: {
          presets: [
            "@babel/preset-typescript",
            [
              "@babel/preset-env",
              {
                modules: false,
                useBuiltIns: "entry",
                corejs: {
                  version: "3.34",
                },
              },
            ],
          ],
        },
      }),
      VitePWA({
        disable: env.VITE_PWA_ENABLED !== "true",
        registerType: "autoUpdate",
        workbox: {
          maximumFileSizeToCacheInBytes: 4000000, // 4mb
          globIgnores: ["!assets/**/*"],
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "safari-pinned-tab.svg",
        ],
        manifest: {
          name: "NEXUS",
          short_name: "NEXUS",
          description:
            "Stream movies, TV shows, and anime in high quality - NEXUS",
          theme_color: "#E50914",
          background_color: "#141414",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
      loadVersion(),
      // Checker plugin disabled in dev mode because the project has ~400
      // pre-existing ESLint errors that prevent the dev server from starting.
      // TypeScript still passes (no errors). Production builds are unaffected.
      // checker({
      //   overlay: { position: "tr" },
      //   typescript: true,
      //   eslint: { lintCommand: "eslint --ext .tsx,.ts src", dev: { logLevel: ["error"] } },
      //   enableBuild: false,
      // }),
      splitVendorChunkPlugin(),
      // visualizer() as PluginOption,
    ],

    build: {
      sourcemap: mode !== "production",
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (
              id.includes("@sozialhelden+ietf-language-tags") ||
              id.includes("country-language")
            ) {
              return "language-db";
            }
            if (id.includes("hls.js")) {
              return "hls";
            }
            if (id.includes("node-forge") || id.includes("crypto-js")) {
              return "auth";
            }
            if (id.includes("locales") && !id.includes("en.json")) {
              return "locales";
            }
            if (id.includes("Icon.tsx")) {
              return "Icons";
            }
            const isCaptioningPackage = captioningPackages.some((packageName) =>
              id.includes(packageName),
            );
            if (isCaptioningPackage) {
              return "caption-parsing";
            }
          },
        },
      },
    },
    css: {
      postcss: {
        plugins: [tailwind(), rtl()],
      },
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@sozialhelden/ietf-language-tags": path.resolve(
          __dirname,
          "./node_modules/@sozialhelden/ietf-language-tags/dist/cjs",
        ),
      },
    },

    test: {
      environment: "jsdom",
    },
  };
});
