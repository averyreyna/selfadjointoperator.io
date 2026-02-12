function Section({ title, children }) {
  return (
    <section>
      <h2>{title}</h2>
      <hr />
      {children}
    </section>
  );
}

export default Section;
