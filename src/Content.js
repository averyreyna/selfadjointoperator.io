import intro from './data/intro.json';
import projects from './data/projects.json';
import writing from './data/writing.json';
import research from './data/research.json';
import work from './data/work.json';
import interests from './data/interests.json';

import Section from './components/Section';
import EntryList from './components/EntryList';
import Footer from './components/Footer';
import ViewModeToggle from './components/ViewModeToggle';
import styles from './Content.module.css';

// walks the string in link order; each link.text replaces its first remaining occurrence only (not a global regex).
function renderTextWithLinks(text, links) {
  if (!links || links.length === 0) {
    return text;
  }

  const parts = [];
  let remaining = text;

  links.forEach((link, linkIndex) => {
    const idx = remaining.indexOf(link.text);
    if (idx !== -1) {
      if (idx > 0) {
        parts.push(remaining.substring(0, idx));
      }
      parts.push(
        <a
          key={`${link.url || link.text || 'link'}-${linkIndex}-${idx}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
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

function IntroArticle() {
  return (
    <article>
      <ul>
        {intro.bullets?.map((bullet, i) => {
          const sup = {
            Experiments: 'E',
            'Field Research': 'FR',
            'Internet Art': 'IA',
            Prototypes: 'P',
            'Work in Progress': 'WIP',
          }[bullet];
          return (
            <li key={i}>
              {bullet}
              {sup && <>{' '}<sup>{sup}</sup></>}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function Content({ viewMode = 'list', onChangeView = () => {}, layout = 'list' }) {
  if (layout === 'columns') {
    return (
      <main className={`${styles.columnMain} site-columns`}>
        <header className={styles.columnsHeader}>
          <h1 className={styles.columnsTitle}>
            <span>{intro.name}</span>
            <ViewModeToggle mode={viewMode} onChange={onChangeView} />
          </h1>
        </header>
        <div
          className={styles.columnsScroller}
          role="region"
          aria-label="Resume sections"
        >
          <div className={styles.columnsRow}>
            <div className={styles.introColumn}>
              <IntroArticle />
            </div>
            <div className={styles.column}>
              <Section title="Recent Projects">
                <EntryList entries={projects.slice(0, 3)} type="project" />
              </Section>
              <Section title="Research Experience">
                <EntryList entries={research} type="research" className={styles.tight} />
              </Section>
              <Section title="Work Experience">
                <EntryList entries={work} type="work" className={styles.tight} />
              </Section>
            </div>
            <div className={styles.column}>
              <Section title="Past Projects">
                <EntryList entries={projects.slice(3)} type="project" />
              </Section>
            </div>
            <div className={styles.column}>
              <Section title="Writing">
                <EntryList entries={writing} type="writing" />
              </Section>
              <Section title="Interests">
                <article>
                  <div>
                    <p>{renderTextWithLinks(interests.text, interests.links)}</p>
                  </div>
                </article>
              </Section>
              <Footer name={intro.name} footerLinks={intro.footerLinks} showInspiredBy={false} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.printPage} site-list`}>
      <div className={styles.printContent}>
        <header>
          <h1 className={styles.nameRow}>
            <span>{intro.name}</span>
            <ViewModeToggle mode={viewMode} onChange={onChangeView} />
          </h1>
        </header>

        <div>
          <IntroArticle />

          <Section title="Recent Projects">
            <EntryList entries={projects.slice(0, 3)} type="project" />
          </Section>

          <Section title="Research Experience">
            <EntryList entries={research} type="research" className={styles.tight} />
          </Section>

          <Section title="Work Experience">
            <EntryList entries={work} type="work" className={styles.tight} />
          </Section>

          <Section title="Past Projects">
            <EntryList entries={projects.slice(3)} type="project" />
          </Section>

          <Section title="Writing">
            <EntryList entries={writing} type="writing" />
          </Section>

          <Section title="Interests">
            <article>
              <div>
                <p>{renderTextWithLinks(interests.text, interests.links)}</p>
              </div>
            </article>
          </Section>

          <Footer name={intro.name} footerLinks={intro.footerLinks} />
        </div>
      </div>
    </main>
  );
}

export default Content;
