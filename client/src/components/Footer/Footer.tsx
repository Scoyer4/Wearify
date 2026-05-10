import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <span className="footer-logo">Wearify</span>
          <p className="footer-tagline">Lo que llevas dice quién eres.</p>
          <div className="footer-socials">
            <a href="#" className="footer-social" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="#" className="footer-social" aria-label="TikTok">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-1.02-.09z"/>
              </svg>
            </a>
            <a href="#" className="footer-social" aria-label="X / Twitter">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="footer-social" aria-label="Pinterest">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <a href="#" className="footer-link">Política de privacidad</a>
            <a href="#" className="footer-link">Términos de uso</a>
            <a href="#" className="footer-link">Política de cookies</a>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Soporte</h4>
            <a href="#" className="footer-link">Centro de ayuda</a>
            <a href="#" className="footer-link">Contacto</a>
            <a href="#" className="footer-link">Cómo funciona</a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p className="footer-copy">© {new Date().getFullYear()} Wearify. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
