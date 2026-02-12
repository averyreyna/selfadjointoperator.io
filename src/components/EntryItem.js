/**
 * Renders a single <li> from an entry object.
 * Handles projects, archive entries, and events.
 *
 * Projects/Archive: { year?, title, url?, description, descriptionLinks }
 * Events:           { date, description, links }
 */

function renderDescription(entry) {
  const description = entry.description || '';
  const descriptionLinks = entry.descriptionLinks || [];
  const links = entry.links || [];

  // For entries with descriptionLinks (projects, archive):
  // Find text matches in description and replace with <a> tags
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

  // For entries with links (events):
  // Append link elements after the description text
  if (links.length > 0) {
    const parts = [description];

    links.forEach((link, i) => {
      if (i > 0) {
        parts.push(', ');
      } else {
        parts.push(' ');
      }
      parts.push(
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
          {link.text}
        </a>
      );
    });

    return parts;
  }

  // Plain description with no links
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
      {entry.description && (
        <>{entry.title ? ' — ' : ''}{renderDescription(entry)}</>
      )}
    </li>
  );
}

export default EntryItem;
