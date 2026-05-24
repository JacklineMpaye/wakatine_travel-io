import { type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MessageCircle } from "lucide-react";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <a
        href="https://wa.me/256700000000"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp us"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-success text-white shadow-elegant flex items-center justify-center hover:scale-105 transition-transform"
        style={{ backgroundColor: "oklch(0.62 0.17 155)" }}
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}