import { createPortal } from 'react-dom';
import styles from './UnavailableOverlay.module.css';

function UnavailableOverlay({ onClose }) {
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <p className={styles.title}>Unavailable</p>
        <p className={styles.body}>
          This content is not available yet. Contact me directly for more details.
        </p>
        <button className={styles.back} onClick={onClose}>
          &larr; Back
        </button>
      </div>
    </div>,
    document.body
  );
}

export default UnavailableOverlay;
