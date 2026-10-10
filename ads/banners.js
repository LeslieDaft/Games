/* Manual banners only: one request per slot, never refresh on a timer. */
(() => {
  'use strict';
  const requested = new WeakSet();
  function requestBanners() {
    // Queue in DOM order, as required by the AdSense push API.
    document.querySelectorAll('ins.daft-banner').forEach(slot => {
      if (requested.has(slot) || !slot.clientWidth || !slot.clientHeight) return;
      requested.add(slot);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
      catch (error) { console.warn('Banner could not be loaded.', error); }
    });
  }
  requestBanners();
  // Hidden narrow-screen slots are requested only if they later become visible.
  window.addEventListener('resize', requestBanners, {passive:true});
})();
