import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  const links = [
    { to: '/contact', label: 'Contact Us' },
    { to: '/request', label: 'Request Us' },
    { to: '/dmca', label: 'DMCA' },
    { to: '/about', label: 'About Us' },
    { to: '/sitemap', label: 'Sitemap' },
  ];

  return (
    <footer className="ct-footer">
      <div className="ct-footer-inner">
        <Link to="/" className="ct-footer-logo" aria-label="CineTrack home">
          <span className="ct-footer-logo-icon">🎬</span>
          <span>
            Cine<span>Track</span>
          </span>
        </Link>

        <p className="ct-footer-copy">
          Copyright © {year}. Created by <span>♥</span> CineTrack Team <span>♥</span>
        </p>

        <nav className="ct-footer-links" aria-label="Footer navigation">
          {links.map((link, index) => (
            <span key={link.to} className="ct-footer-link-wrap">
              <Link to={link.to}>{link.label}</Link>
              {index < links.length - 1 && <b>|</b>}
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
