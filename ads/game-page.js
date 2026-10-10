(() => {
  const frame = document.getElementById('arcade-game');
  frame.addEventListener('load', () => {
    // Arcade and tool links navigate the whole page, avoiding nested ads/game frames.
    frame.contentDocument.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (href.startsWith('#') || href.startsWith('javascript:')) return;
      const destination = new URL(href, frame.contentDocument.baseURI);
      if (destination.origin === location.origin && !link.target) link.target = '_top';
    }, true);
  });
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
