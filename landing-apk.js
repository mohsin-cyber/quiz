// "Get the app" button on the landing page (phones only).
//  - Android + an APK on the website (/download/version.json): downloads it.
//    The APK + version.json are uploaded to the WEBSITE ONLY (deploy repo's
//    /download/ folder) — never into public/, or the next app would contain it.
//  - otherwise: installs the web app on the home screen (Chrome's install
//    prompt), or opens the 2-step instructions (iPhone: Share -> Add to Home Screen).
(function () {
  var box = document.getElementById("apk");
  if (!box) return;
  // never inside the installed app (Google Play: apps may only update through Play)
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return;
  if ((window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone) return;
  var ua = navigator.userAgent || "";
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var preview = /(^|[?&])apk=1/.test(location.search); // ?apk=1 shows it on any device (testing)
  if (!android && !ios && !preview) return;

  var btn = document.getElementById("apk-link");
  var label = document.getElementById("apk-label");
  var meta = document.getElementById("apk-meta");
  var help = document.getElementById("apk-help");
  var apk = null;
  var prompt = null;
  if (ios) {
    document.getElementById("apk-steps-android").hidden = true;
    document.getElementById("apk-steps-ios").hidden = false;
    label.textContent = "Add to Home Screen";
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    prompt = e;
  });
  box.hidden = false;

  if (android) {
    fetch("/download/version.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) {
        if (!v || !v.file || !/^[\w.-]+\.apk$/.test(v.file)) return;
        apk = v;
        label.textContent = "Download for Android";
        var mb = v.size ? " · " + (v.size / 1048576).toFixed(1) + " MB" : "";
        meta.textContent = "Version " + (v.versionName || "") + mb + " · Android 7+";
        var steps = document.getElementById("apk-steps-android");
        steps.innerHTML = "<li>Tap <b>Download for Android</b> and open the file when it finishes.</li>" +
          "<li>If Android asks, allow <b>Install unknown apps</b> for your browser (only this once).</li>" +
          "<li>Tap <b>Install</b>. If Google Play Protect warns, tap <b>Install anyway</b> (normal for apps outside the Play Store).</li>" +
          "<li>Says <b>package conflicts</b>? Uninstall the old Connects app first, then open the file again.</li>" +
          "<li>Open Connects and sign in.</li>";
      })
      .catch(function () {});
  }

  btn.addEventListener("click", function () {
    if (apk) {
      var a = document.createElement("a");
      a.href = "/download/" + apk.file;
      a.setAttribute("download", apk.file);
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    if (prompt) {
      var p = prompt;
      prompt = null;
      p.prompt();
      return;
    }
    help.open = true; // show the 2-step instructions
    help.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
