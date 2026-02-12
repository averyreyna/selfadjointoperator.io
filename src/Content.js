import intro from './data/intro.json';
import projects from './data/projects.json';
import work from './data/work.json';
import archive from './data/archive.json';
import events from './data/events.json';
import education from './data/education.json';
import thingsILike from './data/thingsILike.json';

import Section from './components/Section';
import EntryList from './components/EntryList';
import Footer from './components/Footer';
import styles from './Content.module.css';

/**
 * Renders plain text with inline links by matching link text
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
        {/* HEADER — full viewport height with name anchored to bottom */}
        <header>
          <h1>{intro.name}</h1>
        </header>

        <div>
          {/* INTRO */}
          <article>
            <ul>
              <li>{intro.tagline}</li>
              <li>{intro.email}</li>
              {intro.socialLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                </li>
              ))}
            </ul>
          </article>

          {/* SECTIONS */}
          <Section title="Project Shortlist">
            <EntryList entries={projects} type="project" />
          </Section>

          <Section title="Work Experience">
            <EntryList entries={work} type="work" className={styles.tight} />
          </Section>

          <Section title="Archive">
            <EntryList entries={archive} type="archive" />
          </Section>

          <Section title="In-Person Events">
            <EntryList entries={events} type="event" />
          </Section>

          <Section title="Education">
            <article>
              <div>
                <h3>{education.degree} — <br />{education.school}</h3>
              </div>
            </article>
          </Section>

          <Section title="Things I Like">
            <article>
              <div>
                <p>{renderTextWithLinks(thingsILike.text, thingsILike.links)}</p>
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
