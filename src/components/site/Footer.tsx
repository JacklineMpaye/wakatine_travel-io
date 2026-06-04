import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, MessageCircle, Plane, Facebook, Instagram, Music2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-elegant" style={{ background: "var(--gradient-primary)" }}>
              <Plane className="w-5 h-5 text-gold" />
            </div>
            <div className="leading-tight">
              <div>Waka<span className="text-gold">tine</span></div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Tours & Travel Co. Ltd</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Licensed Ugandan recruitment and travel agency placing workers in the United Arab Emirates.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"><Facebook className="w-4 h-4" /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="https://wa.me/256789431312" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"><MessageCircle className="w-4 h-4" /></a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"><Music2 className="w-4 h-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/jobs" className="hover:text-primary">UAE Jobs</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary">How It Works</Link></li>
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
            <li><Link to="/signup" className="hover:text-primary">Apply Now</Link></li>
            <li><Link to="/login" className="hover:text-primary">Applicant Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-gold" /> Iganga, behind Stanbic Bank</li>
            <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-gold" /> +256 789 431 312</li>
            <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-gold" /> +256 740 052 907</li>
            <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 text-gold" /> info@wakatine.ug</li>
            <li><a href="https://wa.me/256789431312" target="_blank" rel="noreferrer" className="flex gap-2 hover:text-primary"><MessageCircle className="w-4 h-4 mt-0.5 text-gold" /> WhatsApp Us</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Wakatine Tours & Travel Company Limited. All rights reserved.
      </div>
    </footer>
  );
}