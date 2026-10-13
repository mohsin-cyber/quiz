// Runs before the app so the first paint already has the right theme.
// Same rules as src/services/theme.js.
(function () {
  var theme = "dark";
  try {
    var pref = localStorage.getItem("connects-theme") || "dark";
    theme = pref === "system" ? (window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : pref === "light" ? "light" : "dark";
  } catch (e) {}
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  if (theme === "light") {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#f4f6fb");
  }
})();
