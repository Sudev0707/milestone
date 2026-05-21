import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Fix Cloudflare vite-plugin red line: TS typing/import fallback
import cloudflarePlugin from "@cloudflare/vite-plugin";
const cloudflare =
  cloudflarePlugin as unknown as (opts: { entry: string }) => unknown;

export default defineConfig({
  plugins: [cloudflare({ entry: "server" }) as any, react(), tsconfigPaths(), tailwindcss()],
});


