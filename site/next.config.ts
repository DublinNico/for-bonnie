import type { NextConfig } from "next";

const securityHeaders = [
  // Browsers must trust the declared file type instead of guessing (no running a file as a script)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // When a visitor follows a link away, only pass on the site's domain, not the full address
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No other website may show this site inside a frame (protects against clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // The site never needs the camera, microphone or location
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
