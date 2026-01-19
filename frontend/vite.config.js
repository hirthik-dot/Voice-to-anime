import { defineConfig } from "vite";

// Vite config for Sign Language MVP frontend
export default defineConfig({
  root: ".",
  server: {
    port: 5173,
    // Enable CORS for assets
    cors: true
  },
  // Configure asset handling for GLB files and textures
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // Optimize dependencies
  optimizeDeps: {
    include: ['three']
  }
});


