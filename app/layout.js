export const metadata = {
  title: 'SME Library MCP',
  description: 'A free, open-source MCP server for creating, searching, and sharing Subject Matter Expert profiles',
};

// App-shell theme (login, dashboard). Adaptive light/dark via CSS variables so
// the whole authed UI matches the marketing site. The dashboard pages reference
// these --app-* variables from their inline styles. The marketing route group
// paints its own theme-aware surfaces on top and uses its own (.mk) variables.
const APP_CSS = `
:root {
  --app-bg:#ffffff; --app-card:#ffffff; --app-soft:#f8fafc; --app-line:#e2e8f0;
  --app-ink:#0f172a; --app-muted:#475569; --app-faint:#64748b;
  --app-accent:#4f46e5; --app-accent-ink:#4338ca;
  --app-danger:#b42318; --app-danger-bg:#fdecea; --app-danger-border:#f5c6cb;
  --app-ok:#1a7f37; --app-ok-bg:#eef6ec;
  --app-warn:#b26a00; --app-warn-bg:#fff4e5; --app-warn-border:#f0c987;
  --app-sel-bg:#eef2ff; --app-sel-border:#c7d2fe;
}
@media (prefers-color-scheme: dark) {
  :root {
    --app-bg:#0b1120; --app-card:#111a2e; --app-soft:#131f38; --app-line:#26344b;
    --app-ink:#e5e7eb; --app-muted:#93a4bd; --app-faint:#7688a0;
    --app-accent:#818cf8; --app-accent-ink:#a5b4fc;
    --app-danger:#f87171; --app-danger-bg:#3a1616; --app-danger-border:#7f1d1d;
    --app-ok:#4ade80; --app-ok-bg:#14271b;
    --app-warn:#e0b355; --app-warn-bg:#2a2113; --app-warn-border:#7c5e1e;
    --app-sel-bg:#1b2540; --app-sel-border:#33436b;
  }
}
body { background: var(--app-bg); color: var(--app-ink); }
/* Form controls without an explicit inline background pick up the theme. */
input, textarea, select { background: var(--app-card); color: var(--app-ink); }
input::placeholder, textarea::placeholder { color: var(--app-faint); }
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: 'light dark' }}>
      <head><style dangerouslySetInnerHTML={{ __html: APP_CSS }} /></head>
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', margin: 0 }}>{children}</body>
    </html>
  );
}
