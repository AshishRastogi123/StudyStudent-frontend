import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendOrigin = env.VITE_BACKEND_ORIGIN || "http://localhost:3000";

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const path = id.replace(/\\/g, "/");
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(path)) return "react-vendor";
            if (/\/node_modules\/(react-router-dom|@remix-run\/router)\//.test(path)) return "router-vendor";
            if (/\/node_modules\/(@reduxjs\/toolkit|react-redux|redux|immer|reselect)\//.test(path)) return "state-vendor";
            if (/\/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(path)) return "motion-vendor";
            if (/\/node_modules\/@radix-ui\//.test(path)) return "radix-vendor";
            if (/\/node_modules\/zod\//.test(path)) return "zod-vendor";
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: backendOrigin,
          changeOrigin: true,
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
          },
        },
      },
    },
  };
});
