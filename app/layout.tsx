import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GraphicRouter — ideas ready for Canva",
  description: "Plan editable infographics and presentations in ChatGPT. Inspect the composition, direct focused changes, and continue in Canva.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased" style={{ background: "#FAF9F6" }}>{children}</body></html>;
}
