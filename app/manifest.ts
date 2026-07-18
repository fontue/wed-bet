import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Scommessa d’Amore",
    short_name: "La Scommessa",
    description: "Свадебные прогнозы, лимоны и только игровые лиры.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e3",
    theme_color: "#174b38",
    lang: "ru",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
