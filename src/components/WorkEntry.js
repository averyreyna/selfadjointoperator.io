function WorkEntry({ entry }) {
  return (
    <li>
      <sup>{entry.year}</sup>
      {entry.company}, {entry.location} — <i>{entry.role}</i>
    </li>
  );
}

export default WorkEntry;
