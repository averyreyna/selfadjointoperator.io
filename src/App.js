import { useEffect } from 'react';
import Content from './Content';
import styles from './App.module.css';

/**
 * Measures center-content height vs center-fold height,
 * sets document.body.style.height to create the scroll range.
 */
function calcValues() {
  const centerContent = document.getElementById('center-content');
  const centerFold = document.getElementById('center-fold');

  if (!centerContent || !centerFold) return;

  const contentHeight = centerContent.offsetHeight;
  const foldHeight = centerFold.offsetHeight;
  const overflow = contentHeight - foldHeight;

  document.body.style.height = `${overflow + window.innerHeight}px`;
}

/**
 * On scroll, apply translateY(-scrollY) to all [data-fold-content] elements
 * via requestAnimationFrame for smooth performance.
 */
function handleScroll() {
  requestAnimationFrame(() => {
    const scrollY = window.scrollY;
    const elements = document.querySelectorAll('[data-fold-content]');
    elements.forEach((el) => {
      el.style.transform = `translateY(-${scrollY}px)`;
    });
  });
}

function App() {
  useEffect(() => {
    window.addEventListener('resize', calcValues);
    window.addEventListener('scroll', handleScroll);
    calcValues();

    return () => {
      window.removeEventListener('resize', calcValues);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={styles.all}>
      <div className={styles.wrapper3d}>
        <div className={`${styles.fold} ${styles.foldTop}`}>
          <div className={styles.foldAlign}>
            <div data-fold-content="true"><Content /></div>
          </div>
        </div>
        <div className={styles.fold} id="center-fold">
          <div className={styles.foldAlign}>
            <div data-fold-content="true" id="center-content"><Content /></div>
          </div>
        </div>
        <div className={`${styles.fold} ${styles.foldBottom}`}>
          <div className={styles.foldAlign}>
            <div data-fold-content="true"><Content /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
