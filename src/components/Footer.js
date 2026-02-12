function Footer({ name, footerLinks }) {
  const year = new Date().getFullYear();
  return (
    <footer>
      <p>
        <img src={`${process.env.PUBLIC_URL}/images/dragon.png`} alt="" style={{ display: 'block', maxWidth: '100%', filter: 'invert(1)' }} />
      </p>
      <p>Happy to chat, reach out!</p>
      <ul>
        {footerLinks.map((link, i) => (
          <li key={i}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: '40px', fontSize: '0.7em', opacity: 0.8 }}>
        &copy; {year} <span className="name">{name}</span>
      </p>
      <p style={{ fontSize: '0.6em', opacity: 0.6 }}>
        Inspired by Sharon Zheng
      </p>
    </footer>
  );
}

export default Footer;
