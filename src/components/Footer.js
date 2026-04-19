import { SITE_LAST_UPDATED } from '../siteMeta';

function Footer({ name, footerLinks, showInspiredBy = true }) {
  const year = new Date().getFullYear();

  return (
    <footer>
      <p>Have an idea? Reach out!</p>
      <br />
      {footerLinks?.length > 0 && (
        <ul>
          {footerLinks.map((link, i) => (
            <li key={i}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <br />
      <p className="copyright">© {year} {name.toUpperCase()}</p>
      {showInspiredBy && (
        <p className="copyright">
          INSPIRED BY:{' '}
          <a href="https://sharonzheng.com/" target="_blank" rel="noopener noreferrer">
            SHARON ZHENG
          </a>
        </p>
      )}
      <p className="copyright">LAST UPDATED: {SITE_LAST_UPDATED}</p>
    </footer>
  );
}

export default Footer;
