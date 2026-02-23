function Footer({ name, footerLinks }) {
  const year = new Date().getFullYear();

  return (
    <footer>
      <p>Have an idea? Reach out!</p>
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
      <p className="copyright">© {year} {name.toUpperCase()}</p>
      <p className="copyright">
        INSPIRED BY{' '}
        <a href="https://sharonzheng.com/" target="_blank" rel="noopener noreferrer">
          SHARON ZHENG
        </a>
      </p>
      <p>LAST UPDATED: 2026-02</p>
    </footer>
  );
}

export default Footer;
