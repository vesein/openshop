import { serve } from "bun";
import admin from "./front-admin/admin.html";

const server = serve({
  routes: {
    // SPA fallback
    "/*": admin,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
