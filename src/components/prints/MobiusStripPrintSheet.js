import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

import intro from '../../data/intro.json';
import projects from '../../data/projects.json';
import writing from '../../data/writing.json';
import research from '../../data/research.json';
import work from '../../data/work.json';
import interests from '../../data/interests.json';
import WorkEntry from '../WorkEntry';

import styles from './MobiusStripPrintSheet.module.css';

/*
 * print layout for the physical self adjoint operator artifact (möbius strip résumé).
 * work in progress — not final production art; kept in-repo for cutting and assembly reference.
 */

const CATEGORY_SUP = {
  E: 'E',
  FD: 'FD',
  FR: 'FR',
  GE: 'GE',
  IA: 'IA',
  P: 'P',
  WIP: 'WIP',
};

const PRINT_WORK_AND_RESEARCH = [
  work.find((w) => w.company === 'Self Adjoint Operator'),
  work.find((w) => w.company === 'Capital One'),
  research.find((r) => r.company === 'University of Kentucky'),
  research.find((r) => r.company === 'UC San Diego'),
].filter(Boolean);

function linkByLabel(links, label) {
  return links?.find((l) => l.label === label);
}

function normalizeUrl(href) {
  if (!href || typeof href !== 'string') return '';
  if (/^https?:\/\//i.test(href) || href.startsWith('mailto:')) return href;
  return `https://${href}`;
}

function shuffleInPlace(array) {
  const a = array;
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomProjectsForPrint() {
  const pool = shuffleInPlace([...projects]);
  const n = Math.min(5, pool.length);
  return pool.slice(0, n).map((p) => ({
    title: p.title,
    sup: CATEGORY_SUP[p.category] || p.category || '',
  }));
}

export default function MobiusStripPrintSheet() {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [projectItems, setProjectItems] = useState(() => pickRandomProjectsForPrint());

  const websiteUrl = useMemo(() => {
    const personal = linkByLabel(intro.footerLinks, 'Personal Website');
    return normalizeUrl(personal?.url) || 'https://www.selfadjointoperator.io';
  }, []);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(websiteUrl, {
      margin: 1,
      width: 200,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [websiteUrl]);

  useEffect(() => {
    const refresh = () => setProjectItems(pickRandomProjectsForPrint());
    window.addEventListener('beforeprint', refresh);
    return () => window.removeEventListener('beforeprint', refresh);
  }, []);

  const writingLines = useMemo(() => writing.slice(0, 4).map((w) => w.title), []);
  const interestsText = interests.text || '';

  return (
    <div className={styles.sheet} aria-hidden="true">
      <div className={styles.sheetInner}>
        <div className={styles.stripWrap}>
          <div className={styles.strip}>
            <div className={styles.segment}>
              <div className={styles.segmentInner}>
                <p className={styles.name}>{intro.name}</p>
                <p className={styles.tagline}>{intro.tagline}</p>
                {qrDataUrl ? (
                  <div className={styles.qrWrap}>
                    <img className={styles.qr} src={qrDataUrl} alt="" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.segment}>
              <div className={styles.segmentInner}>
                <h3 className={styles.segHead}>Projects</h3>
                <p className={styles.segBody}>
                  {projectItems.map((item, i) => (
                    <span key={`${item.title}-${i}`}>
                      {i > 0 ? ', ' : ''}
                      {item.title}
                      {item.sup ? <sup className={styles.catSup}>{item.sup}</sup> : null}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className={styles.segment}>
              <div className={styles.segmentInner}>
                <h3 className={styles.segHead}>Work</h3>
                <ul className={styles.workList}>
                  {PRINT_WORK_AND_RESEARCH.map((entry, i) => (
                    <WorkEntry key={`work-${i}-${entry.company}`} entry={entry} />
                  ))}
                </ul>
              </div>
            </div>

            <div className={`${styles.segment} ${styles.segmentLast}`}>
              <div className={styles.segmentInner}>
                <h3 className={styles.segHead}>Writing</h3>
                <p className={styles.segBody}>{writingLines.join(', ')}</p>
                <p className={`${styles.segBody} ${styles.interestsText}`}>{interestsText}</p>
              </div>
            </div>
          </div>

          <div className={styles.twistAnnotation} aria-hidden="true">
            <span className={styles.twistLabel}>&#x21BA; twist 180°</span>
          </div>
        </div>

        <aside className={styles.instructions}>
          <h2>How to fold</h2>
          <ol>
            <li>Cut along the outer solid border of the strip.</li>
            <li>Give one short end a 180° half-twist so the edge markings align.</li>
            <li>Tape the ends together, matching the borders.</li>
            <li>Trace your finger along the strip — you'll return to where you started without lifting it.</li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
