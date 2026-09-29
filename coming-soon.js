/* Connects University — Coming Soon page logic
 * Uses the SAME Supabase project as the real app, so accounts created here
 * will work in the new web/iOS/Android app later.
 * The publishable key is safe in the browser (RLS protects the data).
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://npftdlprbrowztsdqxll.supabase.co";
  var SUPABASE_KEY = "sb_publishable_trZLqCjQ_ArGFX7y8a6XHQ_xcd19XsD";
  var SITE = window.location.origin; // where Google / email links return to

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  $("#year").textContent = new Date().getFullYear();

  // ---------- small UI helpers ----------
  function show(view) {
    $$(".view").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== view; });
    say("");
  }
  function say(text, kind) {
    var m = $("#msg");
    m.textContent = text || "";
    m.className = "msg" + (kind ? " " + kind : "");
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || "Please wait…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }
  // Turn Supabase's technical errors into plain English
  function friendly(err) {
    var t = (err && err.message ? err.message : String(err || "")).toLowerCase();
    if (t.indexOf("invalid login") > -1) return "Email or password is incorrect.";
    if (t.indexOf("already registered") > -1 || t.indexOf("already been registered") > -1) return "This email already has an account. Try Sign in.";
    if (t.indexOf("email not confirmed") > -1) return "Please confirm your email first. Check your inbox (and spam).";
    if (t.indexOf("password") > -1 && t.indexOf("least") > -1) return "Password must be at least 8 characters.";
    if (t.indexOf("rate limit") > -1 || t.indexOf("too many") > -1) return "Too many tries. Please wait a minute and try again.";
    if (t.indexOf("failed to fetch") > -1 || t.indexOf("network") > -1) return "Can't reach the server. Check your internet.";
    return (err && err.message) || "Something went wrong. Please try again.";
  }

  // ---------- wait for the library ----------
  if (!window.supabase || !window.supabase.createClient) {
    show("signed-out");
    say("Sign-in is temporarily unavailable. Please try again later.", "error");
    return;
  }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // ---------- email form mode (Create account / Sign in) ----------
  var mode = "signup";
  var seg = $(".seg");
  function setMode(next) {
    mode = next;
    seg.setAttribute("data-mode", next);
    $$(".seg-btn").forEach(function (b) {
      var on = b.getAttribute("data-mode") === next;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$("[data-only]").forEach(function (el) { el.hidden = el.getAttribute("data-only") !== next; });
    $("#submit-btn").textContent = next === "signup" ? "Create account" : "Sign in";
    $('#email-form [name="password"]').setAttribute("autocomplete", next === "signup" ? "new-password" : "current-password");
    say("");
  }
  $$(".seg-btn").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
  });
  setMode("signup");

  // ---------- Google ----------
  $("#google-btn").addEventListener("click", async function () {
    var btn = this;
    busy(btn, true, "Opening Google…");
    var res = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: SITE } });
    if (res.error) { busy(btn, false); say(friendly(res.error), "error"); }
    // on success the browser leaves this page for Google
  });

  // ---------- Email sign up / sign in ----------
  $("#email-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = e.target;
    var name = f.name.value.trim();
    var email = f.email.value.trim();
    var password = f.password.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return say("Please enter a valid email.", "error");
    if (password.length < 8) return say("Password must be at least 8 characters.", "error");
    if (mode === "signup" && name.length < 2) return say("Please enter your full name.", "error");

    var btn = $("#submit-btn");
    busy(btn, true);
    var res;
    if (mode === "signup") {
      res = await sb.auth.signUp({
        email: email, password: password,
        options: { emailRedirectTo: SITE, data: { full_name: name } }
      });
      busy(btn, false);
      if (res.error) return say(friendly(res.error), "error");
      // Supabase hides "already registered" for privacy: identities is empty in that case
      if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
        return say("This email already has an account. Try Sign in.", "error");
      }
      if (!res.data.session) {
        f.reset();
        return say("Almost done! We sent a confirmation link to " + email + ". Open it to activate your account.", "ok");
      }
    } else {
      res = await sb.auth.signInWithPassword({ email: email, password: password });
      busy(btn, false);
      if (res.error) return say(friendly(res.error), "error");
    }
    // signed-in state is handled by onAuthStateChange below
  });

  // ---------- Forgot password ----------
  $("#forgot-btn").addEventListener("click", async function () {
    var email = $('#email-form [name="email"]').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return say("Type your email above first, then tap Forgot password.", "error");
    var btn = this;
    busy(btn, true, "Sending…");
    var res = await sb.auth.resetPasswordForEmail(email, { redirectTo: SITE });
    busy(btn, false);
    if (res.error) return say(friendly(res.error), "error");
    say("If that email has an account, a reset link is on its way.", "ok");
  });

  $("#reset-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var pw = e.target.password.value;
    if (pw.length < 8) return say("Password must be at least 8 characters.", "error");
    var btn = e.target.querySelector("button");
    busy(btn, true);
    var res = await sb.auth.updateUser({ password: pw });
    busy(btn, false);
    if (res.error) return say(friendly(res.error), "error");
    var s = await sb.auth.getSession();
    renderSignedIn(s.data.session && s.data.session.user);
    say("Password updated.", "ok");
  });

  // ---------- Sign out ----------
  $("#signout-btn").addEventListener("click", async function () {
    await sb.auth.signOut();
    show("signed-out");
  });

  // ---------- Signed-in view ----------
  async function renderSignedIn(user) {
    if (!user) return show("signed-out");
    var meta = user.user_metadata || {};
    var name = meta.full_name || meta.name || "";
    var avatar = meta.avatar_url || meta.picture || "";

    // Prefer the name/photo from the profiles table if the user already has one
    try {
      var p = await sb.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle();
      if (p.data) { name = p.data.full_name || name; avatar = p.data.avatar_url || avatar; }
    } catch (_) { /* profile not required for this page */ }

    var first = (name || user.email || "friend").split(/[\s@]/)[0];
    $("#first-name").textContent = first;
    $("#user-email").textContent = user.email || "you";
    var av = $("#avatar");
    if (avatar && /^https:\/\//.test(avatar)) {
      av.style.backgroundImage = 'url("' + avatar.replace(/"/g, "") + '")';
      av.textContent = "";
    } else {
      av.style.backgroundImage = "";
      av.textContent = first.charAt(0).toUpperCase();
    }
    show("signed-in");
  }

  // ---------- React to login / logout / password-recovery ----------
  sb.auth.onAuthStateChange(function (event, session) {
    // Supabase recommends not awaiting inside this callback
    setTimeout(function () {
      if (event === "PASSWORD_RECOVERY") return show("reset");
      if (session && session.user) renderSignedIn(session.user);
      else if (event === "SIGNED_OUT") show("signed-out");
    }, 0);
  });

  // First paint
  sb.auth.getSession().then(function (r) {
    var hash = window.location.hash || "";
    if (hash.indexOf("type=recovery") > -1) return; // handled by PASSWORD_RECOVERY
    var params = new URLSearchParams(window.location.search + "&" + hash.replace(/^#/, ""));
    if (params.get("error_description")) {
      show("signed-out");
      say(params.get("error_description").replace(/\+/g, " "), "error");
      return;
    }
    if (r.data.session) renderSignedIn(r.data.session.user);
    else show("signed-out");
  });
})();
