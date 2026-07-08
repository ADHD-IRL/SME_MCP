export const metadata = {
  title: 'SME Library MCP',
  description: 'A hosted MCP server for creating, searching, and sharing Subject Matter Expert profiles',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', margin: 0 }}>{children}</body>
    </html>
  );
}
