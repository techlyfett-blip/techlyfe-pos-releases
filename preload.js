// Minimal preload. The POS is a normal web app, so there's nothing privileged
// to expose yet. Kept for context isolation and future native hooks (e.g. a
// direct ESC/POS printer bridge) without enabling node integration in the page.
window.addEventListener("DOMContentLoaded", () => {
  document.title = "Tech Lyfe TT POS";
});
