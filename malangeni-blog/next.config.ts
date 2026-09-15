import type { NextConfig } from "next";

/**
 * No API proxy.
 *
 * The browser now calls the backend directly at NEXT_PUBLIC_API_BASE_URL and
 * authenticates with a Firebase ID token, so requests must cross origins and
 * the backend's CORS config has to allow this app's origin
 * (http://localhost:3000 in development).
 *
 * The old `/api/*` rewrite is gone deliberately: it routed requests through the
 * Next server, which breaks when the app is served from WSL while the backend
 * runs on the Windows host.
 */
const nextConfig: NextConfig = {
  images: {
    // Avatars come from two places: the Google photo attached to the sign-in,
    // and custom uploads in Firebase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
    ],
  },
};

export default nextConfig;
