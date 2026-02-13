/**
 * renders a single <li> from an entry object.
 * handles projects, archive entries, and events.
 *
 * Projects/Archive: { year?, title, url?, description, descriptionLinks }
 * Events:           { date, description, links }
 */

function renderDescription(entry) {
  const description = entry.description || '';
  const descriptionLinks = entry.descriptionLinks || [];
  const links = entry.links || [];

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

  // for entries with links (events):
  // append link elements after the description text
  // otherwise, return the plain description with no links
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
