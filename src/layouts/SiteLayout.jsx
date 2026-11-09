import { Link, NavLink, Outlet } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "../components/ui";

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand"><span className="brand-mark"><BookOpen size={19} /></span><span>Study<span className="brand-accent">Student</span></span></Link>
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={`site-nav ${menuOpen ? "site-nav-open" : ""}`}>
          <NavLink to="/library" onClick={() => setMenuOpen(false)}>Explore notes</NavLink>
          <a href="/#features" onClick={() => setMenuOpen(false)}>Features</a>
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
          {user ? <Link to="/app" className="button button-primary nav-cta">My workspace</Link> : <Link to="/login" className="button button-primary nav-cta">Sign in <span aria-hidden="true">→</span></Link>}
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">
        <Link to="/" className="brand"><span className="brand-mark"><BookOpen size={17} /></span><span>Study<span className="brand-accent">Student</span></span></Link>
        <p>Better notes. Better learning. Together.</p>
        <span>© {new Date().getFullYear()} StudyStudent</span>
      </footer>
    </div>
  );
}
