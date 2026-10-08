// Landing page helper (runs before the page draws).
// Sends people straight into the app when:
//   * a sign-in / password-reset / email-confirmation link brought them here
//     (Supabase always sends people back to https://connects.university/), or
//   * they are already signed in on this device.
// Add ?home=1 to the address to see the landing page anyway.
(function () {
  var search = window.location.search || "";
  var hash = window.location.hash || "";
  var appKeys = /(^|[?&#])(code|error|error_code|error_description|token_hash|type|access_token|refresh_token|reset-password|campus-email|account-deleted|profile|__route)=/;
  var signedIn = false;
  try {
    signedIn = Boolean(window.localStorage.getItem("connects-university-auth-v1"));
  } catch (e) {
    signedIn = false;
  }
  var stay = /(^|[?&])home=1/.test(search);
  if (!stay && (appKeys.test(search) || appKeys.test(hash) || signedIn)) {
    window.location.replace("/app/" + search + hash);
  }
})();
