import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WebAssembly Postgres that must load from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
