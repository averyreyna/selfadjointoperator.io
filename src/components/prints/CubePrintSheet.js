import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

import intro from '../../data/intro.json';
import projects from '../../data/projects.json';
import writing from '../../data/writing.json';
import research from '../../data/research.json';
import work from '../../data/work.json';
import interests from '../../data/interests.json';
import WorkEntry from '../WorkEntry';

import styles from './CubePrintSheet.module.css';

/*
 * print layouts for the physical self adjoint operator artifact (folded cube / qr faces).
 * work in progress — not final production art; kept in-repo for cutting, folding, and assembly reference.
 */

const BULLET_SUP = {
  Experiments: 'E',
  'Feature Discussion': 'FD',
  'Field Research': 'FR',
  'General Exploration': 'GE',
  'Industry Work': 'IW',
  'Internet Art': 'IA',
  Prototypes: 'P',
  'Work in Progress': 'WIP',
};

const CATEGORY_SUP = {
  E: 'E',
  FD: 'FD',
  FR: 'FR',
  GE: 'GE',
  IA: 'IA',
  IW: 'IW',
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
  const n = Math.min(10, pool.length);
  return pool.slice(0, n).map((p) => ({
    title: p.title,
    sup: CATEGORY_SUP[p.category] || p.category || '',
  }));
}

export default function CubePrintSheet() {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [projectSpotlightItems, setProjectSpotlightItems] = useState(() =>
    pickRandomProjectsForPrint()
  );

  const websiteUrl = useMemo(() => {
    const personal = linkByLabel(intro.footerLinks, 'Personal Website');
    return normalizeUrl(personal?.url) || 'https://www.selfadjointoperator.io';
  }, []);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(websiteUrl, {
      margin: 1,
      width: 280,
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
    const refreshSpotlight = () => setProjectSpotlightItems(pickRandomProjectsForPrint());
    window.addEventListener('beforeprint', refreshSpotlight);
    return () => window.removeEventListener('beforeprint', refreshSpotlight);
  }, []);

  const writingLines = useMemo(() => writing.slice(0, 5).map((w) => w.title), []);

  const workEntries = useMemo(() => PRINT_WORK_AND_RESEARCH, []);

  const writingCommaList = useMemo(() => writingLines.join(', '), [writingLines]);

  const interestsText = interests.text || '';

  return (
    <div className={styles.sheet} aria-hidden="true">
      <div className={styles.sheetInner}>
        <div className={styles.netWrap}>
          <div className={styles.net}>
            <div className={`${styles.tab} ${styles.tabT}`} aria-hidden="true" />
            <div className={`${styles.face} ${styles.faceTop}`}>
              <div className={styles.faceInner}>
                <h3>Projects</h3>
                <p className={styles.faceBody}>
                  {projectSpotlightItems.map((item, i) => (
                    <span key={`${item.title}-${i}`}>
                      {i > 0 ? ', ' : ''}
                      {item.title}
                      {item.sup ? <sup className={styles.projectCatSup}>{item.sup}</sup> : null}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className={`${styles.tab} ${styles.tabL}`} aria-hidden="true" />
            <div className={`${styles.face} ${styles.faceLeft}`}>
              <div className={styles.faceInner}>
                <div className={styles.qrWrap}>
                  {qrDataUrl ? (
                    <img className={styles.qr} src={qrDataUrl} alt="" />
                  ) : (
                    <span className={styles.meta} />
                  )}
                </div>
              </div>
            </div>
            <div className={`${styles.face} ${styles.faceCenter}`}>
              <div className={styles.faceInner}>
                <p className={styles.centerName}>{intro.name}</p>
                <p className={styles.centerTag}>{intro.tagline}</p>
                <ul className={styles.centerBullets}>
                  {intro.bullets?.map((bullet, i) => {
                    const sup = BULLET_SUP[bullet];
                    return (
                      <li key={i}>
                        {bullet}
                        {sup ? (
                          <>
                            {' '}
                            <sup>{sup}</sup>
                          </>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className={`${styles.face} ${styles.faceRight}`}>
              <div className={styles.faceInner}>
                <h3>Writing</h3>
                <p className={styles.faceBody}>{writingCommaList}</p>
              </div>
            </div>
            <div className={`${styles.tab} ${styles.tabR}`} aria-hidden="true" />
            <div className={`${styles.face} ${styles.faceBottom}`}>
              <div className={styles.faceInner}>
                <h3>Work</h3>
                <ul className={styles.faceBodyList}>
                  {workEntries.map((entry, i) => (
                    <WorkEntry key={`work-${i}-${entry.company}`} entry={entry} />
                  ))}
                </ul>
              </div>
            </div>
            <div className={`${styles.face} ${styles.faceSixth}`}>
              <div className={styles.faceInner}>
                <h3>Interests</h3>
                <p className={styles.faceBody}>{interestsText}</p>
              </div>
            </div>
            <div className={`${styles.tab} ${styles.tabB}`} aria-hidden="true" />
          </div>
        </div>

        <aside className={styles.instructions}>
          <h2>How to fold</h2>
          <ol>
            <li>Cut along the outer edges of the cross and tabs.</li>
            <li>Fold along every dashed line so colored faces meet on the outside.</li>
            <li>Tuck or tape the white tabs on the inside to hold edges together.</li>
            <li>Close the cube; scan the QR on the left face for the site.</li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
