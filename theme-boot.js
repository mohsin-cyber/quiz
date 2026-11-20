// Runs before the app so the first paint already has the right theme.
// Same rules as src/services/theme.js: light unless the student chose otherwise.
(function () {
  var theme = "light";
  try {
    var pref = localStorage.getItem("connects-theme");
    if (pref === "dark") theme = "dark";
    else if (pref === "system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
  } catch (e) {}
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  if (theme === "dark") {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#0b1026");
  }
})();
