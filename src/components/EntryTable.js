import { useState } from 'react';
import WipOverlay from './WipOverlay';
import styles from './EntryTable.module.css';

function parseYearSortKey(yearStr) {
  const m = String(yearStr || '').match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

function groupRowsByYear(entries, getYear) {
  const sorted = [...entries].sort(
    (a, b) => parseYearSortKey(getYear(b)) - parseYearSortKey(getYear(a))
  );
  const groups = [];
  let i = 0;
  while (i < sorted.length) {
    const y = getYear(sorted[i]);
    const items = [sorted[i]];
    let j = i + 1;
    while (j < sorted.length && getYear(sorted[j]) === y) {
      items.push(sorted[j]);
      j += 1;
    }
    groups.push({ year: y, items });
    i = j;
  }
  return groups;
}

function buildArchiveRows({ projects, research, work, writing }) {
  const rows = [
    ...projects.map((entry) => ({ kind: 'project', entry })),
    ...research.map((entry) => ({ kind: 'research', entry })),
    ...work.map((entry) => ({ kind: 'work', entry })),
    ...writing.map((entry) => ({ kind: 'writing', entry })),
  ];
  const kindOrder = { work: 0, research: 1, project: 2, writing: 3 };
  rows.sort((a, b) => {
    const ka = parseYearSortKey(a.entry.year);
    const kb = parseYearSortKey(b.entry.year);
    if (kb !== ka) return kb - ka;
    const oa = kindOrder[a.kind] ?? 9;
    const ob = kindOrder[b.kind] ?? 9;
    if (oa !== ob) return oa - ob;
    const labelA = a.entry.title || a.entry.company || '';
    const labelB = b.entry.title || b.entry.company || '';
    return labelA.localeCompare(labelB);
  });
  return rows;
}

function groupArchiveRowsByNumericYear(rows) {
  const groups = [];
  let i = 0;
  while (i < rows.length) {
    const sortKey = parseYearSortKey(rows[i].entry.year);
    const items = [rows[i]];
    let j = i + 1;
    while (j < rows.length && parseYearSortKey(rows[j].entry.year) === sortKey) {
      items.push(rows[j]);
      j += 1;
    }
    const firstY = items[0].entry.year;
    const uniform = items.every((r) => r.entry.year === firstY);
    const yearLabel = uniform ? firstY : String(sortKey);
    groups.push({ sortKey, yearLabel, items });
    i = j;
  }
  return groups;
}

/** Darkest on the first row of a year block (most recent in sort order), lighter on later rows. */
function archiveYearTextOpacity(rowIdx, rowCount) {
  if (rowCount <= 1) return 1;
  const minOpacity = 0.28;
  const maxOpacity = 1;
  const t = rowIdx / (rowCount - 1);
  return maxOpacity - (maxOpacity - minOpacity) * t;
}

function truncateContext(text, maxLen = 48) {
  const s = (text || '').trim();
  if (!s) return '—';
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

function ProjectTitleCell({ entry, rowKind, onWipOpen }) {
  const isWip = entry.category === 'WIP' || rowKind === 'writing';
  const btnStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  };

  return (
    <td className={styles.titleCell}>
      {isWip ? (
        <button type="button" onClick={onWipOpen} style={btnStyle}>
          {entry.title}
        </button>
      ) : entry.url ? (
        <a href={entry.url} target="_blank" rel="noopener noreferrer">
          {entry.title}
        </a>
      ) : (
        <span>{entry.title}</span>
      )}
      {entry.category && (
        <>
          {' '}
          <sup className={styles.catSup}>{entry.category}</sup>
        </>
      )}
    </td>
  );
}

function EntryTable({ entries, type, caption, archive }) {
  const [wipOpen, setWipOpen] = useState(false);

  if (archive) {
    const archiveRows = buildArchiveRows(archive);
    if (!archiveRows || archiveRows.length === 0) {
      return null;
    }
    const groups = groupArchiveRowsByNumericYear(archiveRows);
    return (
      <article>
        {wipOpen && <WipOverlay onClose={() => setWipOpen(false)} />}
        <div className={`${styles.tableWrap} ${styles.tableWrapArchive}`}>
          <table className={styles.table}>
            <caption className={styles.captionHidden}>{caption}</caption>
            <thead className={styles.srOnly}>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Entry</th>
                <th scope="col">Context</th>
              </tr>
            </thead>
            <tbody>
              {groups.flatMap((group, groupIdx) =>
                group.items.map((row, rowIdx) => {
                  const n = group.items.length;
                  return (
                  <tr key={`g${groupIdx}-r${rowIdx}-${row.kind}-${row.entry.company || row.entry.title || ''}`}>
                    <td className={styles.yearCell}>
                      <span
                        className={styles.yearCellText}
                        style={{
                          opacity: archiveYearTextOpacity(rowIdx, n),
                        }}
                      >
                        {group.yearLabel}
                      </span>
                    </td>
                    {row.kind === 'work' || row.kind === 'research' ? (
                      <>
                        <td className={styles.primaryCell}>{row.entry.company}</td>
                        <td className={styles.contextCell}>{row.entry.role}</td>
                      </>
                    ) : (
                      <>
                        <ProjectTitleCell
                          entry={row.entry}
                          rowKind={row.kind}
                          onWipOpen={() => setWipOpen(true)}
                        />
                        <td
                          className={styles.contextCell}
                          title={row.entry.description || undefined}
                        >
                          {truncateContext(row.entry.description, 120)}
                        </td>
                      </>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>
    );
  }

  if (!entries || entries.length === 0) {
    return null;
  }

  if (type === 'work' || type === 'research') {
    const groups = groupRowsByYear(entries, (e) => e.year);
    return (
      <article>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.captionHidden}>{caption}</caption>
            <thead className={styles.srOnly}>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Organization</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {groups.flatMap(({ year, items }) =>
                items.map((entry, rowIdx) => (
                  <tr key={`${year}-${entry.company}-${rowIdx}`}>
                    {rowIdx === 0 ? (
                      <td className={styles.yearCell} rowSpan={items.length}>
                        {year}
                      </td>
                    ) : null}
                    <td className={styles.primaryCell}>{entry.company}</td>
                    <td className={styles.contextCell}>{entry.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    );
  }

  const groups = groupRowsByYear(entries, (e) => e.year);

  return (
    <article>
      {wipOpen && <WipOverlay onClose={() => setWipOpen(false)} />}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.captionHidden}>{caption}</caption>
          <thead className={styles.srOnly}>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Title</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {groups.flatMap(({ year, items }) =>
              items.map((entry, rowIdx) => (
                <tr key={`${year}-${entry.title}-${rowIdx}`}>
                  {rowIdx === 0 ? (
                    <td className={styles.yearCell} rowSpan={items.length}>
                      {year}
                    </td>
                  ) : null}
                  <ProjectTitleCell
                    entry={entry}
                    rowKind={type}
                    onWipOpen={() => setWipOpen(true)}
                  />
                  <td
                    className={styles.contextCell}
                    title={entry.description || undefined}
                  >
                    {truncateContext(entry.description)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default EntryTable;
