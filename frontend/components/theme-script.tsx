// Applied before paint to avoid a flash of the wrong theme.
export function ThemeScript() {
  const code = `
(function () {
  try {
    var stored = localStorage.getItem('legally-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
