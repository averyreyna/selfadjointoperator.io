function WorkEntry({ entry }) {
  return (
    <li>
      <sup>{entry.year}</sup>
      {entry.company} — {entry.role}
    </li>
  );
}

export default WorkEntry;
