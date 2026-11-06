import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'home' }
  | { name: 'journey' }
  | { name: 'course'; id: string }
  | { name: 'lesson'; id: string }
  | { name: 'review' }
  | { name: 'method' }
  | { name: 'settings' }
  | { name: 'missing' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0];
  const [head, arg] = path.split('/');
  switch (head) {
    case '':
      return { name: 'home' };
    case 'journey':
      return { name: 'journey' };
    case 'course':
      return arg ? { name: 'course', id: arg } : { name: 'journey' };
    case 'lesson':
      return arg ? { name: 'lesson', id: arg } : { name: 'journey' };
    case 'review':
      return { name: 'review' };
    case 'method':
      return { name: 'method' };
    case 'settings':
      return { name: 'settings' };
    default:
      return { name: 'missing' };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = {
  home: '#/',
  journey: '#/journey',
  course: (id: string) => `#/course/${id}`,
  lesson: (id: string) => `#/lesson/${id}`,
  review: '#/review',
  method: '#/method',
  settings: '#/settings',
};
