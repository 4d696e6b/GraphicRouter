import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GraphicRouter — direct your presentation",
  description: "Plan a five-slide story in ChatGPT, preview each composition, and hand off an editable PowerPoint to Canva.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased" style={{ background: "#FAF9F6" }}>{children}</body></html>;
}
