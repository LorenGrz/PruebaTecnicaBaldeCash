import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta un servidor Node autocontenido en .next/standalone: la imagen
  // Docker final no necesita node_modules completo, solo ese output.
  output: "standalone",
};

export default nextConfig;
