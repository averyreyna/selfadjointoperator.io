import styles from './ViewModeToggle.module.css';
import { List, Network } from 'lucide-react';

function ViewModeToggle({ mode, onChange }) {
  return (
    <span className={styles.toggle} role="group" aria-label="View mode">
      <button
        type="button"
        className={styles.iconButton}
        aria-label="List view"
        aria-pressed={mode === 'list'}
        onClick={() => onChange('list')}
      >
        <List size={13} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Graph view"
        aria-pressed={mode === 'graph'}
        onClick={() => onChange('graph')}
      >
        <Network size={13} strokeWidth={2} aria-hidden="true" />
      </button>
    </span>
  );
}

export default ViewModeToggle;
