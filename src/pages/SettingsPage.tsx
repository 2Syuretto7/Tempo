import { useState } from 'preact/hooks';
import { exportProgress, importProgress, resetProgress } from '../engine/progress';
import { getTheme, setTheme, type Theme } from '../theme';

export function SettingsPage() {
  const [theme, setThemeState] = useState<Theme>(getTheme());
  const [msg, setMsg] = useState<string | null>(null);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tempo-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const ok = importProgress(await file.text());
    setMsg(ok ? 'Progress restored from your backup.' : 'That file is not a Tempo backup.');
  };

  return (
    <div class="page narrow">
      <p class="eyebrow">Settings</p>
      <h1>Settings</h1>

      <section class="settings-section">
        <h2>Appearance</h2>
        <div class="segmented" role="radiogroup" aria-label="Theme">
          {(['system', 'light', 'dark'] as Theme[]).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={theme === t}
              class={theme === t ? 'is-on' : ''}
              onClick={() => {
                setTheme(t);
                setThemeState(t);
              }}
            >
              {t === 'system' ? 'Match my device' : t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>

      <section class="settings-section">
        <h2>Your progress</h2>
        <p>Progress is saved only in this browser. Nothing is sent anywhere. Download a backup now and then, especially before clearing your browser data.</p>
        <div class="row gap">
          <button class="btn btn-primary" onClick={download}>
            Download a backup
          </button>
          <label class="btn btn-quiet">
            Restore from a backup
            <input type="file" accept="application/json,.json" onChange={upload} hidden />
          </label>
        </div>
        {msg && <p class="feedback feedback-info">{msg}</p>}
      </section>

      <section class="settings-section">
        <h2>Start over</h2>
        <p>This erases every lesson, score and review in this browser.</p>
        <button
          class="btn btn-danger"
          onClick={() => {
            if (confirm('Erase all your Tempo progress in this browser? This cannot be undone.')) {
              resetProgress();
              setMsg('All progress erased.');
            }
          }}
        >
          Erase all progress
        </button>
      </section>

      <section class="settings-section">
        <h2>Live AI tutor</h2>
        <p class="muted">
          Coming in a later phase: an optional chat with the Kibitzer about any position, using your own AI key kept only in this browser. It will follow the same rule as today's Kibitzer: hints and questions, never the move.
        </p>
      </section>
    </div>
  );
}
