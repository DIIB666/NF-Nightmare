// NF Nightmare - Background Script - By DIIB666

const GRAPHQL_URLS = [
  "*://web.prod.cloud.netflix.com/graphql*",
  "*://*.netflix.com/graphql*",
  "*://*.netflix.net/graphql*",
];
const WATCH_PATH = '/watch/';
const CONTENT_SCRIPT_FILE = 'content.js';
const SKIP_INTRO_FILE = 'skip-intro.js';
const STORAGE_KEY = 'extensionEnabled';
const SKIP_KEY = 'autoSkipIntro';

// ── Browser Compatibility ──────────────────────────────────────────
const isFirefox = !chrome.declarativeNetRequest;
const tabsToBlockOnFirefox = new Set();

let isExtensionEnabled = true;

// ── Extension State & Cleanup ──────────────────────────────────────

async function updateEnabledState() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    isExtensionEnabled = data[STORAGE_KEY] !== false;

    if (!isExtensionEnabled) {
      removeAllRules();
    } else {
      checkAllTabs();
    }
  } catch (error) {
    console.error("[State] Error reading enabled state:", error);
    isExtensionEnabled = true;
  }
}

async function removeAllRules() {
  if (isFirefox) {
    tabsToBlockOnFirefox.clear();
    return;
  }
  try {
    const currentRules = await chrome.declarativeNetRequest.getSessionRules();
    const ruleIdsToRemove = currentRules.map(rule => rule.id);
    if (ruleIdsToRemove.length > 0) {
      await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: ruleIdsToRemove });
    }
  } catch (error) {
    console.error("[Cleanup] Error removing all rules:", error);
  }
}

// ── Dynamic rule manipulation  [Chrome MV3] ───────────────────────

async function addBlockRuleForTab(tabId) {
  if (!isExtensionEnabled) return;
  if (isFirefox) {
    if (!tabsToBlockOnFirefox.has(tabId)) {
      tabsToBlockOnFirefox.add(tabId);
    }
    return;
  }
  try {
    const ruleId = tabId;
    const currentRules = await chrome.declarativeNetRequest.getSessionRules();
    const ruleExistsForTab = currentRules.some(rule => rule.id === ruleId);

    if (!ruleExistsForTab) {
      // Block rules (one per GraphQL URL pattern)
      const blockRules = GRAPHQL_URLS.map((url, idx) => ({
        id: ruleId + idx * 1000,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: url.replace(/\*/g, ''),
          resourceTypes: ['xmlhttprequest'],
          tabIds: [tabId],
        },
      }));

      // Header modification rule (spoof household headers)
      const headerRuleId = ruleId + 50000;
      const headerRule = {
        id: headerRuleId,
        priority: 2,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'X-Netflix-Household', operation: 'set', value: 'true' },
            { header: 'X-Netflix-Device-Check', operation: 'set', value: 'bypass' },
            { header: 'X-Netflix-Home-Check', operation: 'set', value: 'verified' },
          ],
        },
        condition: {
          urlFilter: 'web.prod.cloud.netflix.com',
          resourceTypes: ['xmlhttprequest'],
          tabIds: [tabId],
        },
      };

      const rulesToAdd = [...blockRules, headerRule];

      await chrome.declarativeNetRequest.updateSessionRules({
        addRules: rulesToAdd,
        removeRuleIds: [],
      });
    }
  } catch (error) {
    console.error(`[Network Rule] ADD Error for tab ${tabId}:`, error.message);
  }
}

async function removeBlockRuleForTab(tabId) {
  if (isFirefox) {
    if (tabsToBlockOnFirefox.has(tabId)) {
      tabsToBlockOnFirefox.delete(tabId);
    }
    return;
  }
  try {
    const baseId = tabId;
    const idsToRemove = [];
    for (let i = 0; i < GRAPHQL_URLS.length; i++) {
      idsToRemove.push(baseId + i * 1000);
    }
    idsToRemove.push(baseId + 50000); // header rule
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: idsToRemove });
  } catch (error) {
    console.warn(`[Network Rule] Could not remove rules for tab ${tabId}.`);
  }
}

// ── Injecting Content Scripts ─────────────────────────────────────

async function injectContentScript(tabId) {
  if (!isExtensionEnabled) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [CONTENT_SCRIPT_FILE],
    });
  } catch (error) {
    if (
      error.message.includes('already been injected') ||
      error.message.includes('Invalid tab ID') ||
      error.message.includes('Cannot access contents')
    ) {
      // Expected, ignore
    } else {
      console.error(`[Content Script] INJECT Error for tab ${tabId}:`, error.message);
    }
  }
}

async function injectSkipIntro(tabId) {
  try {
    const data = await chrome.storage.local.get(SKIP_KEY);
    if (data[SKIP_KEY] !== true) return;
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [SKIP_INTRO_FILE],
    });
  } catch (error) {
    if (
      error.message.includes('already been injected') ||
      error.message.includes('Invalid tab ID') ||
      error.message.includes('Cannot access contents')
    ) {
    } else {
      console.error(`[Skip Intro] INJECT Error for tab ${tabId}:`, error.message);
    }
  }
}

// ── Browser Event Listeners & Logic ────────────────────────────────

async function removeSpecificBlockRuleForTab(tabId) {
  if (isFirefox) {
    if (tabsToBlockOnFirefox.has(tabId)) {
      tabsToBlockOnFirefox.delete(tabId);
    }
    return;
  }
  try {
    const baseId = tabId;
    const idsToRemove = [];
    for (let i = 0; i < GRAPHQL_URLS.length; i++) {
      idsToRemove.push(baseId + i * 1000);
    }
    idsToRemove.push(baseId + 50000);
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: idsToRemove });
  } catch (error) {
    console.warn(`[Network Rule] Could not remove rule for tab ${tabId}.`);
  }
}

function handleTabState(tabId, url) {
  if (!isExtensionEnabled) {
    removeSpecificBlockRuleForTab(tabId);
    return;
  }

  if (!url || !url.includes('netflix.com')) {
    removeSpecificBlockRuleForTab(tabId);
    return;
  }

  if (url.includes(WATCH_PATH)) {
    addBlockRuleForTab(tabId);
    injectSkipIntro(tabId);
  } else {
    if (!isFirefox) {
      removeSpecificBlockRuleForTab(tabId);
    }
    injectContentScript(tabId);
  }
}

// ── Navigation listeners ──────────────────────────────────────────

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (!isExtensionEnabled) return;
  if (details.frameId === 0 && details.url?.includes('netflix.com')) {
    if (details.url.includes(WATCH_PATH)) {
      addBlockRuleForTab(details.tabId);
    }
  }
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0 && details.url?.includes('netflix.com')) {
    handleTabState(details.tabId, details.url);
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0 && details.url?.includes('netflix.com')) {
    handleTabState(details.tabId, details.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabState(activeInfo.tabId, tab?.url);
  } catch (error) {
    if (
      !error.message.includes('No tab with id:') &&
      !error.message.includes('Invalid tab ID')
    ) {
      console.error(`[onActivated] Error getting tab info: ${error.message}`);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  removeBlockRuleForTab(tabId);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes[STORAGE_KEY]) {
    updateEnabledState();
  }
});

// ── Extension Initialization ───────────────────────────────────────

async function checkAllTabs() {
  if (!isExtensionEnabled) return;
  try {
    const tabs = await chrome.tabs.query({ url: '*://*.netflix.com/*' });
    tabs.forEach(tab => handleTabState(tab.id, tab.url));
  } catch (error) {
    console.error('[checkAllTabs] Error checking tabs:', error);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await updateEnabledState();
});

chrome.runtime.onStartup.addListener(async () => {
  await removeAllRules();
  await updateEnabledState();
});

updateEnabledState();

// ── Firefox-specific webRequest Listener ──────────────────────────

if (isFirefox) {
  // Block requests
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (tabsToBlockOnFirefox.has(details.tabId)) {
        return { cancel: true };
      }
      return { cancel: false };
    },
    { urls: GRAPHQL_URLS, types: ['xmlhttprequest'] },
    ['blocking'],
  );

  // Spoof request headers
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      if (tabsToBlockOnFirefox.has(details.tabId)) {
        details.requestHeaders.push(
          { name: 'X-Netflix-Household', value: 'true' },
          { name: 'X-Netflix-Device-Check', value: 'bypass' },
          { name: 'X-Netflix-Home-Check', value: 'verified' },
        );
      }
      return { requestHeaders: details.requestHeaders };
    },
    { urls: GRAPHQL_URLS, types: ['xmlhttprequest'] },
    ['blocking', 'requestHeaders'],
  );
}
