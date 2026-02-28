// vite.config.mts
import { defineConfig } from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/vitest@1.6.1_@types+node@20.19.23_jsdom@23.2.0_terser@5.44.1/node_modules/vitest/dist/config.js";
import react from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@20.19.23_terser@5.44.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import loadVersion from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/vite-plugin-package-version@1.1.0_vite@5.4.21_@types+node@20.19.23_terser@5.44.1_/node_modules/vite-plugin-package-version/dist/index.mjs";
import { VitePWA } from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/vite-plugin-pwa@0.17.5_vite@5.4.21_@types+node@20.19.23_terser@5.44.1__workbox-build@7.3.0_@t_o2oedzppqpd2rfre6wa63gjcwm/node_modules/vite-plugin-pwa/dist/index.js";
import checker from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/vite-plugin-checker@0.6.4_eslint@8.57.1_optionator@0.9.4_typescript@5.9.3_vite@5.4.21_@types+_fxvotyfvv5bltg5tzjdrdxbvpy/node_modules/vite-plugin-checker/dist/esm/main.js";
import path2 from "path";
import million from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/million@2.6.4/node_modules/million/dist/packages/compiler.mjs";

// plugins/handlebars.ts
import { globSync } from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/glob@10.4.5/node_modules/glob/dist/esm/index.js";
import { viteStaticCopy } from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/vite-plugin-static-copy@3.1.4_vite@5.4.21_@types+node@20.19.23_terser@5.44.1_/node_modules/vite-plugin-static-copy/dist/index.js";
import Handlebars from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/handlebars@4.7.8/node_modules/handlebars/lib/index.js";
import path from "path";
var handlebars = (options = {}) => {
  const files = globSync("src/assets/**/**.hbs");
  function render(content) {
    const template = Handlebars.compile(content);
    return template(options?.vars ?? {});
  }
  return [
    {
      name: "hbs-templating",
      enforce: "pre",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          return render(html);
        }
      }
    },
    viteStaticCopy({
      silent: true,
      targets: files.map((file) => ({
        src: file,
        dest: "",
        rename: path.basename(file).slice(0, -4),
        // remove .hbs file extension
        transform: {
          encoding: "utf8",
          handler(content) {
            return render(content);
          }
        }
      }))
    })
  ];
};

// vite.config.mts
import { loadEnv, splitVendorChunkPlugin } from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.23_terser@5.44.1/node_modules/vite/dist/node/index.js";
import { visualizer } from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/rollup-plugin-visualizer@5.14.0_rollup@4.43.0/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import tailwind from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/tailwindcss@3.4.18_yaml@2.8.0/node_modules/tailwindcss/lib/index.js";
import rtl from "file:///C:/Users/ZETICUZ/Downloads/nexus%20updated%20repo/node_modules/.pnpm/postcss-rtlcss@4.0.9_postcss@8.5.6/node_modules/postcss-rtlcss/esm/index.js";
var __vite_injected_original_dirname = "C:\\Users\\ZETICUZ\\Downloads\\nexus updated repo";
var captioningPackages = [
  "dompurify",
  "htmlparser2",
  "subsrt-ts",
  "parse5",
  "entities",
  "fuse"
];
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: env.VITE_BASE_URL || "/",
    plugins: [
      million.vite({ auto: true, mute: true }),
      handlebars({
        vars: {
          opensearchEnabled: env.VITE_OPENSEARCH_ENABLED === "true",
          routeDomain: env.VITE_APP_DOMAIN + (env.VITE_NORMAL_ROUTER !== "true" ? "/#" : ""),
          domain: env.VITE_APP_DOMAIN,
          env
        }
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
                  version: "3.34"
                }
              }
            ]
          ]
        }
      }),
      VitePWA({
        disable: env.VITE_PWA_ENABLED !== "true",
        registerType: "autoUpdate",
        workbox: {
          maximumFileSizeToCacheInBytes: 4e6,
          // 4mb
          globIgnores: ["!assets/**/*"]
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "safari-pinned-tab.svg"
        ],
        manifest: {
          name: "NEXUS",
          short_name: "NEXUS",
          description: "Stream movies, TV shows, and anime in high quality - NEXUS",
          theme_color: "#E50914",
          background_color: "#141414",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable"
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        }
      }),
      loadVersion(),
      checker({
        overlay: {
          position: "tr"
        },
        typescript: true,
        // check typescript build errors in dev server
        eslint: {
          // check lint errors in dev server only
          lintCommand: "eslint --ext .tsx,.ts src",
          dev: {
            logLevel: ["error"]
          }
        },
        enableBuild: false
        // disable checking during build to prevent warnings from blocking
      }),
      splitVendorChunkPlugin(),
      visualizer()
    ],
    build: {
      sourcemap: mode !== "production",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("@sozialhelden+ietf-language-tags") || id.includes("country-language")) {
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
            if (id.includes("react-dom")) {
              return "react-dom";
            }
            if (id.includes("Icon.tsx")) {
              return "Icons";
            }
            const isCaptioningPackage = captioningPackages.some(
              (packageName) => id.includes(packageName)
            );
            if (isCaptioningPackage) {
              return "caption-parsing";
            }
          }
        }
      }
    },
    css: {
      postcss: {
        plugins: [tailwind(), rtl()]
      }
    },
    resolve: {
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname, "./src"),
        "@sozialhelden/ietf-language-tags": path2.resolve(
          __vite_injected_original_dirname,
          "./node_modules/@sozialhelden/ietf-language-tags/dist/cjs"
        )
      }
    },
    test: {
      environment: "jsdom"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInBsdWdpbnMvaGFuZGxlYmFycy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFpFVElDVVpcXFxcRG93bmxvYWRzXFxcXG5leHVzIHVwZGF0ZWQgcmVwb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcWkVUSUNVWlxcXFxEb3dubG9hZHNcXFxcbmV4dXMgdXBkYXRlZCByZXBvXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvWkVUSUNVWi9Eb3dubG9hZHMvbmV4dXMlMjB1cGRhdGVkJTIwcmVwby92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZXN0L2NvbmZpZ1wiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGxvYWRWZXJzaW9uIGZyb20gXCJ2aXRlLXBsdWdpbi1wYWNrYWdlLXZlcnNpb25cIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5pbXBvcnQgY2hlY2tlciBmcm9tIFwidml0ZS1wbHVnaW4tY2hlY2tlclwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBtaWxsaW9uIGZyb20gXCJtaWxsaW9uL2NvbXBpbGVyXCI7XG5pbXBvcnQgeyBoYW5kbGViYXJzIH0gZnJvbSBcIi4vcGx1Z2lucy9oYW5kbGViYXJzXCI7XG5pbXBvcnQgeyBQbHVnaW5PcHRpb24sIGxvYWRFbnYsIHNwbGl0VmVuZG9yQ2h1bmtQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcblxuaW1wb3J0IHRhaWx3aW5kIGZyb20gXCJ0YWlsd2luZGNzc1wiO1xuaW1wb3J0IHJ0bCBmcm9tIFwicG9zdGNzcy1ydGxjc3NcIjtcblxuY29uc3QgY2FwdGlvbmluZ1BhY2thZ2VzID0gW1xuICBcImRvbXB1cmlmeVwiLFxuICBcImh0bWxwYXJzZXIyXCIsXG4gIFwic3Vic3J0LXRzXCIsXG4gIFwicGFyc2U1XCIsXG4gIFwiZW50aXRpZXNcIixcbiAgXCJmdXNlXCIsXG5dO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSk7XG4gIHJldHVybiB7XG4gICAgYmFzZTogZW52LlZJVEVfQkFTRV9VUkwgfHwgXCIvXCIsXG4gICAgcGx1Z2luczogW1xuICAgICAgbWlsbGlvbi52aXRlKHsgYXV0bzogdHJ1ZSwgbXV0ZTogdHJ1ZSB9KSxcbiAgICAgIGhhbmRsZWJhcnMoe1xuICAgICAgICB2YXJzOiB7XG4gICAgICAgICAgb3BlbnNlYXJjaEVuYWJsZWQ6IGVudi5WSVRFX09QRU5TRUFSQ0hfRU5BQkxFRCA9PT0gXCJ0cnVlXCIsXG4gICAgICAgICAgcm91dGVEb21haW46XG4gICAgICAgICAgICBlbnYuVklURV9BUFBfRE9NQUlOICtcbiAgICAgICAgICAgIChlbnYuVklURV9OT1JNQUxfUk9VVEVSICE9PSBcInRydWVcIiA/IFwiLyNcIiA6IFwiXCIpLFxuICAgICAgICAgIGRvbWFpbjogZW52LlZJVEVfQVBQX0RPTUFJTixcbiAgICAgICAgICBlbnYsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIHJlYWN0KHtcbiAgICAgICAgYmFiZWw6IHtcbiAgICAgICAgICBwcmVzZXRzOiBbXG4gICAgICAgICAgICBcIkBiYWJlbC9wcmVzZXQtdHlwZXNjcmlwdFwiLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICBcIkBiYWJlbC9wcmVzZXQtZW52XCIsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB1c2VCdWlsdEluczogXCJlbnRyeVwiLFxuICAgICAgICAgICAgICAgIGNvcmVqczoge1xuICAgICAgICAgICAgICAgICAgdmVyc2lvbjogXCIzLjM0XCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIGRpc2FibGU6IGVudi5WSVRFX1BXQV9FTkFCTEVEICE9PSBcInRydWVcIixcbiAgICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcbiAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA0MDAwMDAwLCAvLyA0bWJcbiAgICAgICAgICBnbG9iSWdub3JlczogW1wiIWFzc2V0cy8qKi8qXCJdLFxuICAgICAgICB9LFxuICAgICAgICBpbmNsdWRlQXNzZXRzOiBbXG4gICAgICAgICAgXCJmYXZpY29uLmljb1wiLFxuICAgICAgICAgIFwiYXBwbGUtdG91Y2gtaWNvbi5wbmdcIixcbiAgICAgICAgICBcInNhZmFyaS1waW5uZWQtdGFiLnN2Z1wiLFxuICAgICAgICBdLFxuICAgICAgICBtYW5pZmVzdDoge1xuICAgICAgICAgIG5hbWU6IFwiTkVYVVNcIixcbiAgICAgICAgICBzaG9ydF9uYW1lOiBcIk5FWFVTXCIsXG4gICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICBcIlN0cmVhbSBtb3ZpZXMsIFRWIHNob3dzLCBhbmQgYW5pbWUgaW4gaGlnaCBxdWFsaXR5IC0gTkVYVVNcIixcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjRTUwOTE0XCIsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjMTQxNDE0XCIsXG4gICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgc3RhcnRfdXJsOiBcIi9cIixcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiYW5kcm9pZC1jaHJvbWUtMTkyeDE5Mi5wbmdcIixcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgICBwdXJwb3NlOiBcImFueVwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcImFuZHJvaWQtY2hyb21lLTUxMng1MTIucG5nXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgICAgcHVycG9zZTogXCJhbnlcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogXCJhbmRyb2lkLWNocm9tZS0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogXCJhbmRyb2lkLWNocm9tZS01MTJ4NTEyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgbG9hZFZlcnNpb24oKSxcbiAgICAgIGNoZWNrZXIoe1xuICAgICAgICBvdmVybGF5OiB7XG4gICAgICAgICAgcG9zaXRpb246IFwidHJcIixcbiAgICAgICAgfSxcbiAgICAgICAgdHlwZXNjcmlwdDogdHJ1ZSwgLy8gY2hlY2sgdHlwZXNjcmlwdCBidWlsZCBlcnJvcnMgaW4gZGV2IHNlcnZlclxuICAgICAgICBlc2xpbnQ6IHtcbiAgICAgICAgICAvLyBjaGVjayBsaW50IGVycm9ycyBpbiBkZXYgc2VydmVyIG9ubHlcbiAgICAgICAgICBsaW50Q29tbWFuZDogXCJlc2xpbnQgLS1leHQgLnRzeCwudHMgc3JjXCIsXG4gICAgICAgICAgZGV2OiB7XG4gICAgICAgICAgICBsb2dMZXZlbDogW1wiZXJyb3JcIl0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgZW5hYmxlQnVpbGQ6IGZhbHNlLCAvLyBkaXNhYmxlIGNoZWNraW5nIGR1cmluZyBidWlsZCB0byBwcmV2ZW50IHdhcm5pbmdzIGZyb20gYmxvY2tpbmdcbiAgICAgIH0pLFxuICAgICAgc3BsaXRWZW5kb3JDaHVua1BsdWdpbigpLFxuICAgICAgdmlzdWFsaXplcigpIGFzIFBsdWdpbk9wdGlvbixcbiAgICBdLFxuXG4gICAgYnVpbGQ6IHtcbiAgICAgIHNvdXJjZW1hcDogbW9kZSAhPT0gXCJwcm9kdWN0aW9uXCIsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rcyhpZDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiQHNvemlhbGhlbGRlbitpZXRmLWxhbmd1YWdlLXRhZ3NcIikgfHxcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCJjb3VudHJ5LWxhbmd1YWdlXCIpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwibGFuZ3VhZ2UtZGJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImhscy5qc1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCJobHNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIm5vZGUtZm9yZ2VcIikgfHwgaWQuaW5jbHVkZXMoXCJjcnlwdG8tanNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiYXV0aFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibG9jYWxlc1wiKSAmJiAhaWQuaW5jbHVkZXMoXCJlbi5qc29uXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBcImxvY2FsZXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlYWN0LWRvbVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCJyZWFjdC1kb21cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIkljb24udHN4XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBcIkljb25zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpc0NhcHRpb25pbmdQYWNrYWdlID0gY2FwdGlvbmluZ1BhY2thZ2VzLnNvbWUoKHBhY2thZ2VOYW1lKSA9PlxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcyhwYWNrYWdlTmFtZSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKGlzQ2FwdGlvbmluZ1BhY2thZ2UpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiY2FwdGlvbi1wYXJzaW5nXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjc3M6IHtcbiAgICAgIHBvc3Rjc3M6IHtcbiAgICAgICAgcGx1Z2luczogW3RhaWx3aW5kKCksIHJ0bCgpXSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICBcIkBzb3ppYWxoZWxkZW4vaWV0Zi1sYW5ndWFnZS10YWdzXCI6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICAgXCIuL25vZGVfbW9kdWxlcy9Ac296aWFsaGVsZGVuL2lldGYtbGFuZ3VhZ2UtdGFncy9kaXN0L2Nqc1wiLFxuICAgICAgICApLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgdGVzdDoge1xuICAgICAgZW52aXJvbm1lbnQ6IFwianNkb21cIixcbiAgICB9LFxuICB9O1xufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFpFVElDVVpcXFxcRG93bmxvYWRzXFxcXG5leHVzIHVwZGF0ZWQgcmVwb1xcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxaRVRJQ1VaXFxcXERvd25sb2Fkc1xcXFxuZXh1cyB1cGRhdGVkIHJlcG9cXFxccGx1Z2luc1xcXFxoYW5kbGViYXJzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9aRVRJQ1VaL0Rvd25sb2Fkcy9uZXh1cyUyMHVwZGF0ZWQlMjByZXBvL3BsdWdpbnMvaGFuZGxlYmFycy50c1wiO2ltcG9ydCB7IGdsb2JTeW5jIH0gZnJvbSBcImdsb2JcIjtcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSBcInZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5XCI7XG5pbXBvcnQgeyBQbHVnaW5PcHRpb24gfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IEhhbmRsZWJhcnMgZnJvbSBcImhhbmRsZWJhcnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGViYXJzID0gKFxuICBvcHRpb25zOiB7IHZhcnM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+IH0gPSB7fSxcbik6IFBsdWdpbk9wdGlvbltdID0+IHtcbiAgY29uc3QgZmlsZXMgPSBnbG9iU3luYyhcInNyYy9hc3NldHMvKiovKiouaGJzXCIpO1xuXG4gIGZ1bmN0aW9uIHJlbmRlcihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKGNvbnRlbnQpO1xuICAgIHJldHVybiB0ZW1wbGF0ZShvcHRpb25zPy52YXJzID8/IHt9KTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAge1xuICAgICAgbmFtZTogXCJoYnMtdGVtcGxhdGluZ1wiLFxuICAgICAgZW5mb3JjZTogXCJwcmVcIixcbiAgICAgIHRyYW5zZm9ybUluZGV4SHRtbDoge1xuICAgICAgICBvcmRlcjogXCJwcmVcIixcbiAgICAgICAgaGFuZGxlcihodG1sKSB7XG4gICAgICAgICAgcmV0dXJuIHJlbmRlcihodG1sKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB2aXRlU3RhdGljQ29weSh7XG4gICAgICBzaWxlbnQ6IHRydWUsXG4gICAgICB0YXJnZXRzOiBmaWxlcy5tYXAoKGZpbGUpID0+ICh7XG4gICAgICAgIHNyYzogZmlsZSxcbiAgICAgICAgZGVzdDogXCJcIixcbiAgICAgICAgcmVuYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGUpLnNsaWNlKDAsIC00KSwgLy8gcmVtb3ZlIC5oYnMgZmlsZSBleHRlbnNpb25cbiAgICAgICAgdHJhbnNmb3JtOiB7XG4gICAgICAgICAgZW5jb2Rpbmc6IFwidXRmOFwiLFxuICAgICAgICAgIGhhbmRsZXIoY29udGVudDogc3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVuZGVyKGNvbnRlbnQpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KSksXG4gICAgfSksXG4gIF07XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5VSxTQUFTLG9CQUFvQjtBQUN0VyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sYUFBYTtBQUNwQixPQUFPQSxXQUFVO0FBQ2pCLE9BQU8sYUFBYTs7O0FDTjJVLFNBQVMsZ0JBQWdCO0FBQ3hYLFNBQVMsc0JBQXNCO0FBRS9CLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sVUFBVTtBQUVWLElBQU0sYUFBYSxDQUN4QixVQUEwQyxDQUFDLE1BQ3hCO0FBQ25CLFFBQU0sUUFBUSxTQUFTLHNCQUFzQjtBQUU3QyxXQUFTLE9BQU8sU0FBeUI7QUFDdkMsVUFBTSxXQUFXLFdBQVcsUUFBUSxPQUFPO0FBQzNDLFdBQU8sU0FBUyxTQUFTLFFBQVEsQ0FBQyxDQUFDO0FBQUEsRUFDckM7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1Qsb0JBQW9CO0FBQUEsUUFDbEIsT0FBTztBQUFBLFFBQ1AsUUFBUSxNQUFNO0FBQ1osaUJBQU8sT0FBTyxJQUFJO0FBQUEsUUFDcEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLE1BQ1IsU0FBUyxNQUFNLElBQUksQ0FBQyxVQUFVO0FBQUEsUUFDNUIsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLFFBQ04sUUFBUSxLQUFLLFNBQVMsSUFBSSxFQUFFLE1BQU0sR0FBRyxFQUFFO0FBQUE7QUFBQSxRQUN2QyxXQUFXO0FBQUEsVUFDVCxVQUFVO0FBQUEsVUFDVixRQUFRLFNBQWlCO0FBQ3ZCLG1CQUFPLE9BQU8sT0FBTztBQUFBLFVBQ3ZCO0FBQUEsUUFDRjtBQUFBLE1BQ0YsRUFBRTtBQUFBLElBQ0osQ0FBQztBQUFBLEVBQ0g7QUFDRjs7O0FEbENBLFNBQXVCLFNBQVMsOEJBQThCO0FBQzlELFNBQVMsa0JBQWtCO0FBRTNCLE9BQU8sY0FBYztBQUNyQixPQUFPLFNBQVM7QUFaaEIsSUFBTSxtQ0FBbUM7QUFjekMsSUFBTSxxQkFBcUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBQ3ZDLFNBQU87QUFBQSxJQUNMLE1BQU0sSUFBSSxpQkFBaUI7QUFBQSxJQUMzQixTQUFTO0FBQUEsTUFDUCxRQUFRLEtBQUssRUFBRSxNQUFNLE1BQU0sTUFBTSxLQUFLLENBQUM7QUFBQSxNQUN2QyxXQUFXO0FBQUEsUUFDVCxNQUFNO0FBQUEsVUFDSixtQkFBbUIsSUFBSSw0QkFBNEI7QUFBQSxVQUNuRCxhQUNFLElBQUksbUJBQ0gsSUFBSSx1QkFBdUIsU0FBUyxPQUFPO0FBQUEsVUFDOUMsUUFBUSxJQUFJO0FBQUEsVUFDWjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELE1BQU07QUFBQSxRQUNKLE9BQU87QUFBQSxVQUNMLFNBQVM7QUFBQSxZQUNQO0FBQUEsWUFDQTtBQUFBLGNBQ0U7QUFBQSxjQUNBO0FBQUEsZ0JBQ0UsU0FBUztBQUFBLGdCQUNULGFBQWE7QUFBQSxnQkFDYixRQUFRO0FBQUEsa0JBQ04sU0FBUztBQUFBLGdCQUNYO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsUUFBUTtBQUFBLFFBQ04sU0FBUyxJQUFJLHFCQUFxQjtBQUFBLFFBQ2xDLGNBQWM7QUFBQSxRQUNkLFNBQVM7QUFBQSxVQUNQLCtCQUErQjtBQUFBO0FBQUEsVUFDL0IsYUFBYSxDQUFDLGNBQWM7QUFBQSxRQUM5QjtBQUFBLFFBQ0EsZUFBZTtBQUFBLFVBQ2I7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxRQUNBLFVBQVU7QUFBQSxVQUNSLE1BQU07QUFBQSxVQUNOLFlBQVk7QUFBQSxVQUNaLGFBQ0U7QUFBQSxVQUNGLGFBQWE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULFdBQVc7QUFBQSxVQUNYLE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsY0FDTixTQUFTO0FBQUEsWUFDWDtBQUFBLFlBQ0E7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxjQUNOLFNBQVM7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLGNBQ04sU0FBUztBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsY0FDTixTQUFTO0FBQUEsWUFDWDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxZQUFZO0FBQUEsTUFDWixRQUFRO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUCxVQUFVO0FBQUEsUUFDWjtBQUFBLFFBQ0EsWUFBWTtBQUFBO0FBQUEsUUFDWixRQUFRO0FBQUE7QUFBQSxVQUVOLGFBQWE7QUFBQSxVQUNiLEtBQUs7QUFBQSxZQUNILFVBQVUsQ0FBQyxPQUFPO0FBQUEsVUFDcEI7QUFBQSxRQUNGO0FBQUEsUUFDQSxhQUFhO0FBQUE7QUFBQSxNQUNmLENBQUM7QUFBQSxNQUNELHVCQUF1QjtBQUFBLE1BQ3ZCLFdBQVc7QUFBQSxJQUNiO0FBQUEsSUFFQSxPQUFPO0FBQUEsTUFDTCxXQUFXLFNBQVM7QUFBQSxNQUNwQixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixhQUFhLElBQVk7QUFDdkIsZ0JBQ0UsR0FBRyxTQUFTLGtDQUFrQyxLQUM5QyxHQUFHLFNBQVMsa0JBQWtCLEdBQzlCO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLFFBQVEsR0FBRztBQUN6QixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsWUFBWSxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDekQscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLFNBQVMsS0FBSyxDQUFDLEdBQUcsU0FBUyxTQUFTLEdBQUc7QUFDckQscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLFdBQVcsR0FBRztBQUM1QixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsVUFBVSxHQUFHO0FBQzNCLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGtCQUFNLHNCQUFzQixtQkFBbUI7QUFBQSxjQUFLLENBQUMsZ0JBQ25ELEdBQUcsU0FBUyxXQUFXO0FBQUEsWUFDekI7QUFDQSxnQkFBSSxxQkFBcUI7QUFDdkIscUJBQU87QUFBQSxZQUNUO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLFFBQ1AsU0FBUyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFBQSxNQUM3QjtBQUFBLElBQ0Y7QUFBQSxJQUVBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUtDLE1BQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsUUFDcEMsb0NBQW9DQSxNQUFLO0FBQUEsVUFDdkM7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxNQUFNO0FBQUEsTUFDSixhQUFhO0FBQUEsSUFDZjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgInBhdGgiXQp9Cg==
