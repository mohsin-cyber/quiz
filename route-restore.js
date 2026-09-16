(function () {
  var params = new URLSearchParams(window.location.search);
  var restored = params.get("__route");
  if (restored) window.history.replaceState({}, "", restored);
})();
