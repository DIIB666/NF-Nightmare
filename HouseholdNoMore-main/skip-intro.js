/**
 * Auto Skip Intro/Recap/Credits - By DIIB666
 * Watches for Netflix skip buttons and clicks them automatically.
 */

if (!window.hasRunNetflixSkipScript) {
  window.hasRunNetflixSkipScript = true;

  const SKIP_SELECTORS = [
    'button[data-uia="player-skip-intro"]',
    'button[data-uia="player-skip-recap"]',
    'button[data-uia="player-skip-credits"]',
    'button[data-uia="next-episode-seamless-button"]',
    'button[data-uia="next-episode-button"]',
    '.skip-credits a',
    '.button--skip-intro',
    '.button--next-episode',
    '[data-uia="skip-button"]',
    '.btn--skip-intro',
    '.video-title-card--skip-intro',
  ];

  function clickSkipButtons() {
    for (const sel of SKIP_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) {
        btn.click();
      }
    }
  }

  clickSkipButtons();

  const observer = new MutationObserver(() => {
    clickSkipButtons();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(clickSkipButtons, 1000);
}
