(() => {
  const frame = document.getElementById('arcade-game');
  const fullscreen = document.getElementById('fullscreen-game');
  function focusGame() { frame.scrollIntoView({block:'start'}); frame.contentWindow.focus(); }
  document.getElementById('focus-game').addEventListener('click', focusGame);
  fullscreen.addEventListener('click', async () => {
    try { await frame.requestFullscreen(); frame.contentWindow.focus(); }
    catch { focusGame(); }
  });
  if (!document.fullscreenEnabled) fullscreen.hidden = true;
  // Game assets and storage stay on their original origin and in their original directory.
  if (location.search || location.hash) {
    frame.src = frame.getAttribute('src') + location.search + location.hash;
  }
})();
