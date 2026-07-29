export const metadata = {
  title: 'SME Library MCP',
  description: 'A hosted MCP server for creating, searching, and sharing Subject Matter Expert profiles',
};

export default function RootLayout({ children }) {
  return (
    // The app shell (login, dashboard) is styled for light mode with dark text
    // on light surfaces. Pin the color scheme so a dark-theme browser doesn't
    // render dark-on-dark. The marketing route group paints its own
    // theme-aware backgrounds on top of this.
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', margin: 0, background: '#ffffff', color: '#0f172a' }}>{children}</body>
    </html>
  );
}
