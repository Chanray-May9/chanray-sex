import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins:[react()], base:process.env.SITE_BASE_PATH || "/Ruirui-whispers-20261010/", build:{outDir:"dist/client"} });
