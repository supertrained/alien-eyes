import { UrlForm } from '@/components/landing/url-form';
import Script from 'next/script';

const DIFFERENCES = [
  {
    title: 'Outside-in, not inside-out',
    body: 'Your builder agent knows the codebase. Alien Eyes only knows the live product, so it catches the friction your own context hides.'
  },
  {
    title: 'Celebration before damage',
    body: 'Results start with what is already working, then escalate the issues that actually deserve your time.'
  },
  {
    title: 'Clipboard-first output',
    body: 'The most important deliverable is the payload your coding agent can fix from immediately.'
  }
];

const FAQS = [
  {
    question: 'Why not just ask my coding agent?',
    answer:
      'Because your builder agent starts with repo context and implementation sympathy. Alien Eyes starts with none of that. It only sees the live product, which is exactly the perspective your users and autonomous agents bring.'
  },
  {
    question: 'What does the free quick check cover?',
    answer:
      'Quick Check runs deterministic crawl, extraction, scoring, and paste-ready rendering. Full Audit adds deeper judgment and narrative layers later.'
  },
  {
    question: 'Will I need to come back repeatedly to get value?',
    answer:
      'No. The first audit should already expose the highest-value outside-in fixes. Re-audits exist to verify shipped changes, not to hide the real signal behind a subscription loop.'
  }
];

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Alien Eyes',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  description: 'Outside-in web product audits for developers and coding agents.',
  offers: [
    { '@type': 'Offer', name: 'Quick Check', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Full Audit', price: '29', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Re-audit', price: '7', priceCurrency: 'USD' }
  ]
};

export default function HomePage() {
  return (
    <main id="main-content" className="shell">
      <Script
        id="alien-eyes-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-panel hero-copy">
            <span className="eyebrow">Alien Eyes • Web-first quick check</span>
            <h1>See what you cannot see.</h1>
            <p>
              Alien Eyes audits the product your users and agents actually touch. No internal context. No
              forgiveness. Just the outside perspective on friction, trust, discoverability, and machine
              usability.
            </p>
            <UrlForm />
          </div>
          <div className="hero-panel hero-side">
            <div className="scan-card">
              <strong>Validated engine</strong>
              <p className="muted">
                URL → crawl → extract → detect → synthesize → paste-ready output now runs end to end.
              </p>
            </div>
            <div className="stats-grid">
              <div className="stat">
                <strong>74</strong>
                <span className="muted">passing tests</span>
              </div>
              <div className="stat">
                <strong>10/12</strong>
                <span className="muted">synthetic dogfood recall floor</span>
              </div>
              <div className="stat">
                <strong>$0</strong>
                <span className="muted">quick-check model cost</span>
              </div>
            </div>
            <ul className="check-list">
              <li>Outside-in crawl from a clean browser profile</li>
              <li>Human-native and agent-native scoring on every audit</li>
              <li>Clipboard-first output for the fix loop</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cards-grid">
          {DIFFERENCES.map((item) => (
            <article key={item.title} className="card">
              <h2 className="section-title">{item.title}</h2>
              <p className="muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cards-grid">
          <article className="card">
            <h2 className="section-title">How it works</h2>
            <p className="muted">1. Point Alien Eyes at a live URL.</p>
            <p className="muted">2. Watch the engine crawl, extract, and score from the outside.</p>
            <p className="muted">3. Copy the findings straight into your coding agent.</p>
          </article>
          <article className="card">
            <h2 className="section-title">Why not just ask Claude Code?</h2>
            <p className="muted">
              Because your builder agent starts inside the repo. Alien Eyes starts inside the user experience.
              Those are different vantage points, and you need both.
            </p>
          </article>
          <article className="card">
            <h2 className="section-title">What you get</h2>
            <p className="muted">
              Celebration-first results, severity-ranked findings, causal links where they matter, and one
              button to copy the payload your builder can act on.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="cards-grid">
          <article className="card">
            <h2 className="section-title">Brand thesis</h2>
            <p className="muted">
              You cannot see your own product clearly once you have built it. Alien Eyes exists to restore that
              missing perspective with no internal context and no forgiveness.
            </p>
          </article>
          <article className="card">
            <h2 className="section-title">Vs Claude Code</h2>
            <p className="muted">
              Claude Code is inside-out and implementation-native. Alien Eyes is outside-in and experience-native.
              You want both, but they are not substitutes for each other.
            </p>
          </article>
          <article className="card">
            <h2 className="section-title">Vs testing tools</h2>
            <p className="muted">
              Traditional testing tools validate correctness. Alien Eyes validates how the product feels, reads,
              indexes, loads, and presents itself when nobody is holding its hand.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="cards-grid">
          <article className="card">
            <h2 className="section-title">Pricing</h2>
            <p className="muted">Quick Check: free</p>
            <p className="muted">Full Audit: $29</p>
            <p className="muted">Re-audit verification: $7</p>
            <p className="muted">Watch: deferred until hosted monitoring ships</p>
          </article>
          <article className="card">
            <h2 className="section-title">For developers</h2>
            <p className="muted">
              Alien Eyes examines your product the way your users experience it: from the outside, with no
              context, no forgiveness, and no blind spots.
            </p>
          </article>
          <article className="card">
            <h2 className="section-title">For agents</h2>
            <p className="muted">
              Autonomous external quality primitive. Point at a live target. Get structured findings back in a
              format another agent can fix from immediately.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="panel" style={{ padding: '1.5rem' }}>
          <h2 className="section-title">FAQ</h2>
          <div className="faq-list">
            {FAQS.map((item) => (
              <article key={item.question} className="card">
                <h3>{item.question}</h3>
                <p className="muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        Alien Eyes is the outside perspective on what you build.
      </footer>
    </main>
  );
}
