import { serve } from "bun";
import admin from "./front-admin/admin.html";
import { demo } from "./backend-admin/index";

const server = serve({
  routes: {
    "/api/users/:id": demo,
    // SPA fallback
    "/*": admin,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
