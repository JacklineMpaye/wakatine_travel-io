import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, MessageCircle, Briefcase } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Briefcase className="w-5 h-5" />
            </div>
            Wakatine
          </div>
          <p className="text-sm text-muted-foreground">
            Licensed Ugandan recruitment agency placing workers in the United Arab Emirates.
          </p>
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
            <li><Link to="/apply" className="hover:text-primary">Apply Now</Link></li>
            <li><Link to="/login" className="hover:text-primary">Applicant Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-primary" /> Plot 24, Kampala Road, Kampala</li>
            <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-primary" /> +256 700 000 000</li>
            <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 text-primary" /> info@wakatine.ug</li>
            <li><a href="https://wa.me/256700000000" target="_blank" rel="noreferrer" className="flex gap-2 hover:text-primary"><MessageCircle className="w-4 h-4 mt-0.5 text-primary" /> WhatsApp Us</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Wakatine Recruitment. All rights reserved.
      </div>
    </footer>
  );
}