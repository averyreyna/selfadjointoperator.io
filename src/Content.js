import intro from './data/intro.json';
import projects from './data/projects.json';
import research from './data/research.json';
import work from './data/work.json';
import education from './data/education.json';
import interests from './data/interests.json';

import Section from './components/Section';
import EntryList from './components/EntryList';
import styles from './Content.module.css';

/**
 * renders plain text with inline links by matching link text
 * within the string and replacing with <a> tags.
 */
function renderTextWithLinks(text, links) {
  if (!links || links.length === 0) {
    return text;
  }

  const parts = [];
  let remaining = text;

  links.forEach((link) => {
    const idx = remaining.indexOf(link.text);
    if (idx !== -1) {
      if (idx > 0) {
        parts.push(remaining.substring(0, idx));
      }
      parts.push(
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
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

function Content() {
  return (
    <main className={styles.printPage}>
      <div className={styles.printContent}>
        <header>
          <h1>{intro.name}</h1>
        </header>

        <div>
          <article>
            <ul>
              <li>{intro.tagline}</li>
              {intro.bullets?.map((bullet, i) => {
                const sup = { Experiments: 'E', 'Field Research': 'FR', Prototypes: 'P' }[bullet];
                return (
                  <li key={i}>
                    {bullet}
                    {sup && <>{' '}<sup>{sup}</sup></>}
                  </li>
                );
              })}
            </ul>
          </article>

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

          <Section title="Education">
            <EntryList entries={education} type="archive" />
          </Section>

          <Section title="Interests">
            <article>
              <div>
                <p>{renderTextWithLinks(interests.text, interests.links)}</p>
              </div>
            </article>
          </Section>
        </div>
      </div>
    </main>
  );
}

export default Content;
