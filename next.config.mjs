/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for container targets (GCP Cloud Run,
  // AWS ECS/App Runner, Azure Container Apps). Ignored by Vercel.
  output: "standalone",
  // Data marts are imported as JSON at build time; no remote images needed.
  // The OpenAlex drill-down API is proxied through our own route handlers,
  // so no external image/host allow-list is required.
  experimental: {
    // Keeps server bundles lean by not tracing the (committed) raw data dir.
  },
};

export default nextConfig;
