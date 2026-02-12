import EntryItem from './EntryItem';
import WorkEntry from './WorkEntry';

function EntryList({ entries, type, className }) {
  const Component = type === 'work' ? WorkEntry : EntryItem;
  return (
    <article>
      <ul className={className || ''}>
        {entries.map((entry, i) => (
          <Component key={i} entry={entry} />
        ))}
      </ul>
    </article>
  );
}

export default EntryList;
