import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }: { mode: string }) => {
    // Load env file from the root directory (../) regardless of prefix
    // @ts-ignore: process might not be typed
    const env = loadEnv(mode, process.cwd() + "/..", "");

    return {
        plugins: [react()],
        server: {
            port: parseInt(env.FRONTEND_PORT || "5173", 10),
            proxy: {
                "/api": {
                    target: `http://localhost:${env.BACKEND_PORT || "8080"}`,
                    changeOrigin: true,
                },
            },
        },
    };
});
