import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GraphicRouter — project starter",
  description: "Shared project scaffold and tasks for GraphicRouter's two-builder hackathon prototype.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased" style={{ background: "#FAF9F6" }}>{children}</body></html>;
}
