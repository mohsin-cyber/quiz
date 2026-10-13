// "Download for Android" button on the landing page.
// The APK + version.json are uploaded to the WEBSITE ONLY (the deploy repo's
// /download/ folder) — never into public/, or the next app would contain it.
// It only appears on Android phones AND only after an APK has been put on
// the website (/download/version.json + the .apk file). Until then
// nothing shows, so visitors never see a broken download.
(function () {
  var box = document.getElementById("apk");
  if (!box) return;
  // never inside the installed app (Google Play: apps may only update through Play)
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return;
  var ua = navigator.userAgent || "";
  var android = /Android/i.test(ua);
  var preview = /(^|[?&])apk=1/.test(location.search); // ?apk=1 shows it on any device (for testing)
  if (!android && !preview) return;
  fetch("/download/version.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (v) {
      if (!v || !v.file || !/^[\w.-]+\.apk$/.test(v.file)) return;
      var link = document.getElementById("apk-link");
      link.href = "/download/" + v.file;
      link.setAttribute("download", v.file);
      var mb = v.size ? " · " + (v.size / 1048576).toFixed(1) + " MB" : "";
      document.getElementById("apk-meta").textContent = "Version " + (v.versionName || "") + mb + " · Android 7+";
      box.hidden = false;
    })
    .catch(function () {});
})();
