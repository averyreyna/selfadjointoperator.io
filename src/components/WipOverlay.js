import { createPortal } from 'react-dom';
import styles from './WipOverlay.module.css';

function WipOverlay({ onClose }) {
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <p className={styles.title}>WIP</p>
        <p className={styles.body}>
          This is a work in progress. Contact me directly for more details.
        </p>
        <button className={styles.back} onClick={onClose}>
          &larr; Back
        </button>
      </div>
    </div>,
    document.body
  );
}

export default WipOverlay;
