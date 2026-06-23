// NF Nightmare - Popup Script - By DIIB666
document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const skipIntroSwitch = document.getElementById('skipIntroSwitch');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    const BYPASS_KEY = 'extensionEnabled';
    const SKIP_KEY = 'autoSkipIntro';

    function updateUI(isEnabled) {
        statusIndicator.classList.toggle('status-active', isEnabled);
        statusIndicator.classList.toggle('status-inactive', !isEnabled);
        statusText.textContent = `Extension is ${isEnabled ? 'active' : 'disabled'}`;
        toggleSwitch.checked = isEnabled;
    }

    function updateSkipUI(enabled) {
        skipIntroSwitch.checked = enabled;
    }

    async function initialize() {
        try {
            const data = await chrome.storage.local.get([BYPASS_KEY, SKIP_KEY]);
            updateUI(data[BYPASS_KEY] !== false);
            updateSkipUI(data[SKIP_KEY] === true);
        } catch (error) {
            console.error("Error initializing popup:", error);
            updateUI(true);
        }
    }

    toggleSwitch.addEventListener('change', async () => {
        const newState = toggleSwitch.checked;
        updateUI(newState);
        try {
            await chrome.storage.local.set({ [BYPASS_KEY]: newState });
        } catch (_) {
            updateUI(!newState);
        }
    });

    skipIntroSwitch.addEventListener('change', async () => {
        const newState = skipIntroSwitch.checked;
        updateSkipUI(newState);
        try {
            await chrome.storage.local.set({ [SKIP_KEY]: newState });
        } catch (_) {
            updateSkipUI(!newState);
        }
    });

    initialize();
});
