// Applies theme BEFORE React mounts to prevent a flash of unstyled content
// (FOUC). Reads localStorage key 'theme'. Defaults to 'dark' (the app's
// natural theme). Kept as a static file (not an inline <script>) so the CSP
// script-src directive can stay 'self' without an 'unsafe-inline' escape hatch.
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored ? stored === 'dark' : true;
    document.documentElement.classList.toggle('dark', isDark);
    if (!stored) localStorage.setItem('theme', 'dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
