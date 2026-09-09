import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Training APP",
    short_name: "Training APP",
    description:
      "Dziennik siłowy: ciężar, powtórzenia, serie i progres względem poprzedniego dnia treningowego.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#161310",
    theme_color: "#161310",
    lang: "pl",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
