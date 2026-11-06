import { useState } from 'preact/hooks';
import { Icon, Logo } from './components/ui';
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

export function App() {
  const route = useRoute();
  useProgress();
  const due = dueReviews().length;
  const [dark, setDark] = useState(isDark());
  const active = (names: Route['name'][]) => (names.includes(route.name) ? 'is-active' : '');
  return (
    <>
      <a class="skip" href="#main">
        Skip to content
      </a>
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href={href.home} aria-label="Tempo, home">
            <Logo />
            <span class="brand-name">Tempo</span>
          </a>
          <nav class="nav" aria-label="Main">
            <a class={active(['journey', 'course', 'lesson'])} href={href.journey}>
              Learn
            </a>
            <a class={active(['review'])} href={href.review}>
              Review{due > 0 && <span class="badge">{due}</span>}
            </a>
            <a class={active(['method'])} href={href.method}>
              Method
            </a>
            <a class={active(['settings'])} href={href.settings}>
              Settings
            </a>
          </nav>
          <button
            class="icon-btn"
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => {
              setTheme(dark ? 'light' : 'dark');
              setDark(!dark);
            }}
          >
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>
      <main id="main">
        <Page route={route} />
      </main>
      <footer class="footer">
        <div class="footer-inner">
          <span>
            <strong>Tempo</strong> · Learn chess from first principles, slowly and steadily.
          </span>
          <span class="muted">Every board, piece and diagram on this site is drawn in code for Tempo.</span>
        </div>
      </footer>
    </>
  );
}
