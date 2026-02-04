import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GreyExim",
    short_name: "GreyExim",
    description: "Premium digital scarves for global export",
    start_url: "/",
    display: "standalone",
    background_color: "#0f141c",
    theme_color: "#0f141c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
