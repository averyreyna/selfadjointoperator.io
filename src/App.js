import { useEffect, useMemo, useState } from 'react';
import Content from './Content';
import EntryGraphView from './views/EntryGraphView';
import { buildEntryGraph } from './utils/buildEntryGraph';
import styles from './App.module.css';

function calcValues() {
  const centerContent = document.getElementById('center-content');
  const centerFold = document.getElementById('center-fold');

  if (!centerContent || !centerFold) return;

  const contentHeight = centerContent.scrollHeight;
  const foldHeight = centerFold.clientHeight;
  const overflow = Math.max(0, contentHeight - foldHeight);
  document.body.style.height = `${overflow + window.innerHeight}px`;
  document.body.style.width = '100vw';
}

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
  const [viewMode, setViewMode] = useState('list');
  const graphData = useMemo(() => buildEntryGraph(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'graph' || view === 'list' || view === 'columns') {
      setViewMode(view);
    }
  }, []);

  const handleChangeView = (nextMode) => {
    setViewMode(nextMode);
    const url = new URL(window.location.href);
    url.searchParams.set('view', nextMode);
    window.history.replaceState({}, '', url);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (viewMode !== 'list') {
      document.body.style.height = '';
      document.body.style.width = '';
      return;
    }

    const onResize = () => calcValues();
    const onScroll = () => handleScroll();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll);

    calcValues();
    handleScroll();
    const rafId = window.requestAnimationFrame(() => {
      calcValues();
      handleScroll();
    });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [viewMode]);

  if (viewMode === 'graph') {
    return (
      <div className={styles.graphShell}>
        <EntryGraphView
          nodes={graphData.nodes}
          edges={graphData.edges}
          introName={graphData.introName}
          mode={viewMode}
          onChangeMode={handleChangeView}
        />
      </div>
    );
  }

  if (viewMode === 'columns') {
    return (
      <div className={styles.columnShell}>
        <Content
          viewMode={viewMode}
          onChangeView={handleChangeView}
          layout="columns"
        />
      </div>
    );
  }

  const foldContent = (
    <Content viewMode={viewMode} onChangeView={handleChangeView} />
  );

  return (
    <div className={styles.all}>
      <div className={styles.wrapper3d}>
        <div className={`${styles.fold} ${styles.foldTop}`}>
          <div className={styles.foldAlign}>
            <div data-fold-content="true">{foldContent}</div>
          </div>
        </div>
        <div className={styles.fold} id="center-fold">
          <div className={styles.foldAlign}>
            <div data-fold-content="true" id="center-content">{foldContent}</div>
          </div>
        </div>
        <div className={`${styles.fold} ${styles.foldBottom}`}>
          <div className={styles.foldAlign}>
            <div data-fold-content="true">{foldContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
