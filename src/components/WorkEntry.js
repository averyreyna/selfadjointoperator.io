function WorkEntry({ entry }) {
  return (
    <li>
      <sup>{entry.year}</sup>
      {entry.company} — <i>{entry.role}</i>
    </li>
  );
}

export default WorkEntry;
