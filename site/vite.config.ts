import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

/**
 * Dev-only fallback so `/fr/` serves the SPA shell (locale resolution
 * happens client-side from the pathname). In production the prerender
 * script emits a real `dist/fr/index.html`, so this never runs there.
 */
function localeFallback(): Plugin {
  return {
    name: "locale-fallback",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/fr" || req.url === "/fr/") req.url = "/";
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localeFallback()],
  // The asciinema recording lives in the repo's demo kit (../demo) — the
  // site imports it as an asset so there is a single source of truth.
  assetsInclude: ["**/*.cast"],
  server: {
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
