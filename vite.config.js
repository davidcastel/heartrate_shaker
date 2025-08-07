import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl"; // 1. Import the plugin

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		basicSsl(), // 2. Add the plugin to your plugins array
	],
	server: {
		https: true, // 3. Enable HTTPS in the dev server configuration
	},
	base: "/heartrate_shaker/",
});
