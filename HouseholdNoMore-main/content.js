/**
 * NF Nightmare - Content Script - By DIIB666
 *
 * Runs on Netflix pages (excluding /watch/) and uses multiple strategies
 * to detect and remove the household verification modal.
 */

if (window.hasRunNetflixBypassContentScript) {
  // already injected
} else {
  window.hasRunNetflixBypassContentScript = true;

  // ── Precise household modal selectors only ───────────────────────
  const MODAL_SELECTORS = [
    '.nf-modal.interstitial-full-screen',
    '.nf-modal.uma-modal.two-section-uma',
    '[data-uia="modal-overlay"]',
    '.household-modal',
    '.verification-modal',
  ];

  const BACKGROUND_SELECTOR = '.nf-modal-background[data-uia="nf-modal-background"]';

  // ── Known Netflix household-related storage keys ─────────────────
  const STORAGE_KEYS_TO_CLEAR = [
    'nfvdid',
    'householdCheck',
    'householdVerified',
    'deviceCheck',
    'memberCheck',
    'NetflixHousehold',
    'nf_household_check',
  ];

  // ── Helpers ───────────────────────────────────────────────────────
  function isHouseholdModal(el) {
    if (!el || !el.matches) return false;
    for (const sel of MODAL_SELECTORS) {
      if (el.matches(sel)) return true;
    }
    if (el.matches(BACKGROUND_SELECTOR)) return true;
    return false;
  }

  function removeModals() {
    let removed = 0;
    for (const sel of MODAL_SELECTORS) {
      document.querySelectorAll(sel).forEach(el => {
        el.remove();
        removed++;
      });
    }
    const bg = document.querySelector(BACKGROUND_SELECTOR);
    if (bg) {
      bg.remove();
      removed++;
    }
    return removed;
  }

  function cleanStorage() {
    for (const key of STORAGE_KEYS_TO_CLEAR) {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (_) {}
    }
  }

  function cleanCookies() {
    const cookiesToClear = [
      'nf_household',
      'nf_household_check',
      'NetflixHouseholdCheck',
    ];
    for (const name of cookiesToClear) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.netflix.com`;
    }
  }

  // ── Initial cleanup ──────────────────────────────────────────────
  removeModals();
  cleanStorage();
  cleanCookies();

  // ── MutationObserver (reactive - only targets household modals) ──
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== 'childList') continue;
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches && isHouseholdModal(node)) {
          node.remove();
          const bg = document.querySelector(BACKGROUND_SELECTOR);
          if (bg) bg.remove();
          continue;
        }
        if (node.querySelectorAll) {
          const found = node.querySelectorAll(MODAL_SELECTORS.join(','));
          found.forEach(el => el.remove());
          if (found.length > 0) {
            const bg = document.querySelector(BACKGROUND_SELECTOR);
            if (bg) bg.remove();
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ── Periodic hunter (proactive – runs every 2s for 60s) ─────────
  let attempts = 0;
  const maxAttempts = 30;
  const hunter = setInterval(() => {
    attempts++;
    const found = removeModals();
    cleanStorage();
    if (attempts >= maxAttempts) {
      clearInterval(hunter);
    }
  }, 2000);
}
