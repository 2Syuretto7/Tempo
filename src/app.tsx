import { useState } from 'preact/hooks';
import { Icon, Wordmark, type IconName } from './components/ui';
import { dueReviews, useProgress } from './engine/progress';
import { CoursePage } from './pages/CoursePage';
import { HomePage } from './pages/HomePage';
import { JourneyPage } from './pages/JourneyPage';
import { LessonPage } from './pages/LessonPage';
import { MethodPage } from './pages/MethodPage';
import { NotFound } from './pages/NotFound';
import { ReviewPage } from './pages/ReviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { href, useRoute, type Route } from './router';
import { isDark, setTheme } from './theme';

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'journey':
      return <JourneyPage />;
    case 'course':
      return <CoursePage id={route.id} />;
    case 'lesson':
      return <LessonPage id={route.id} />;
    case 'review':
      return <ReviewPage />;
    case 'method':
      return <MethodPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <NotFound />;
  }
}

const NAV: { label: string; icon: IconName; to: string; names: Route['name'][] }[] = [
  { label: 'Today', icon: 'home', to: href.home, names: ['home'] },
  { label: 'Learn', icon: 'map', to: href.journey, names: ['journey', 'course', 'lesson'] },
  { label: 'Review', icon: 'refresh', to: href.review, names: ['review'] },
  { label: 'Method', icon: 'book', to: href.method, names: ['method'] },
];

export function App() {
  const route = useRoute();
  useProgress();
  const due = dueReviews().length;
  const [dark, setDark] = useState(isDark());
  const isActive = (names: Route['name'][]) => names.includes(route.name);
  const toggle = () => {
    setTheme(dark ? 'light' : 'dark');
    setDark(!dark);
  };
  return (
    <>
      <a class="skip" href="#main">
        Skip to content
      </a>
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href={href.home} aria-label="Tempo, home">
            <Wordmark />
          </a>
          <nav class="nav" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.label} class={isActive(n.names) ? 'is-active' : ''} href={n.to} aria-current={isActive(n.names) ? 'page' : undefined}>
                {n.label}
                {n.label === 'Review' && due > 0 && <span class="badge">{due}</span>}
              </a>
            ))}
          </nav>
          <div class="topbar-end">
            <a class={`icon-btn${isActive(['settings']) ? ' is-active' : ''}`} href={href.settings} aria-label="Settings" title="Settings">
              <Icon name="gear" />
            </a>
            <button class="icon-btn" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'} onClick={toggle}>
              <Icon name={dark ? 'sun' : 'moon'} />
            </button>
          </div>
        </div>
      </header>
      <main id="main" class={`main main-${route.name}`}>
        <div class="route" key={route.name + ('id' in route ? route.id : '')}>
          <Page route={route} />
        </div>
      </main>
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <Wordmark />
            <p>Chess from first principles. One well-understood idea at a time.</p>
          </div>
          <nav class="footer-links" aria-label="Footer">
            <div>
              <span class="footer-head">Learn</span>
              <a href={href.journey}>The journey</a>
              <a href={href.course('1.1')}>Course 1.1</a>
              <a href={href.review}>Review</a>
            </div>
            <div>
              <span class="footer-head">Tempo</span>
              <a href={href.method}>How Tempo teaches</a>
              <a href={href.settings}>Settings</a>
            </div>
          </nav>
        </div>
        <div class="footer-base">
          <span>Every board, piece and diagram is drawn in code for Tempo.</span>
          <span>Progress stays in your browser.</span>
        </div>
      </footer>
      <nav class="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.label} class={isActive(n.names) ? 'is-active' : ''} href={n.to} aria-current={isActive(n.names) ? 'page' : undefined}>
            <span class="tabbar-icon">
              <Icon name={n.icon} size={20} />
              {n.label === 'Review' && due > 0 && <span class="tabbar-dot" aria-label={`${due} due`} />}
            </span>
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
