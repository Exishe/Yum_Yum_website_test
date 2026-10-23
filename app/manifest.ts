import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YUM-YUM Donuts",
    short_name: "YUM-YUM",
    description: "Donuts, coffee and gifts in Yerevan since 1997.",
    start_url: "/hy",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#000000",
    icons: [
      { src: "/images/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/images/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
