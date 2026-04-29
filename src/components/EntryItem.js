import { useState } from 'react';
import WipOverlay from './WipOverlay';
import UnavailableOverlay from './UnavailableOverlay';

function renderDescription(entry) {
  const description = entry.description || '';
  const descriptionLinks = entry.descriptionLinks || [];

  // same substring walk as intro interests: ordered links, first match per link in what’s left of the string.
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

function EntryItem({ entry, type }) {
  const yearOrDate = entry.year || entry.date;
  const [wipOpen, setWipOpen] = useState(false);
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  // writing list uses the same wip-style overlay as project rows tagged WIP (no external url yet).
  const isWip = entry.category === 'WIP' || type === 'writing';
  const isUnavailable = entry.category === 'IW';

  return (
    <li>
      {wipOpen && <WipOverlay onClose={() => setWipOpen(false)} />}
      {unavailableOpen && <UnavailableOverlay onClose={() => setUnavailableOpen(false)} />}
      {yearOrDate && <sup>{yearOrDate}</sup>}
      {isWip ? (
        <button
          onClick={() => setWipOpen(true)}
          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          {entry.title}
        </button>
      ) : isUnavailable ? (
        <button
          onClick={() => setUnavailableOpen(true)}
          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          {entry.title}
        </button>
      ) : entry.url ? (
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
