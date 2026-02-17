/**
 * renders a single <li> from an entry object.
 * handles projects and archive entries.
 *
 * Projects/Archive: { year?, title, url?, description, descriptionLinks }
 */

function renderDescription(entry) {
  const description = entry.description || '';
  const descriptionLinks = entry.descriptionLinks || [];

  // for entries with descriptionLinks (projects, archive):
  // find text matches in description and replace with <a> tags
  if (descriptionLinks.length > 0) {
    const parts = [];
    let remaining = description;

    descriptionLinks.forEach((link) => {
      const idx = remaining.indexOf(link.text);
      if (idx !== -1) {
        if (idx > 0) {
          parts.push(remaining.substring(0, idx));
        }
        parts.push(
          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
            {link.text}
          </a>
        );
        remaining = remaining.substring(idx + link.text.length);
      }
    });

    if (remaining) {
      parts.push(remaining);
    }

    return parts;
  }

  return description;
}

function EntryItem({ entry }) {
  const yearOrDate = entry.year || entry.date;

  return (
    <li>
      {yearOrDate && <sup>{yearOrDate}</sup>}
      {entry.url ? (
        <a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.title}</a>
      ) : (
        entry.title && <span>{entry.title}</span>
      )}
      {entry.category && <>{' '}<sup>{entry.category}</sup></>}
      {entry.description && (
        <>{entry.title ? ' — ' : ''}{renderDescription(entry)}</>
      )}
    </li>
  );
}

export default EntryItem;
