// Function to check debug mode and update the icon
function updateIcon(tabId, url) {
    if (url && url.includes(".bubbleapps.io")) {
      const currentUrl = new URL(url);
      if (currentUrl.searchParams.has("debug_mode")) {
        // Debug mode is enabled
        chrome.action.setIcon({ path: "enabled-debug.png", tabId: tabId });
      } else {
        // Debug mode is disabled
        chrome.action.setIcon({ path: "disabled-debug.png", tabId: tabId });
      }
    } else {
      // Not a Bubble URL, set the default disabled icon
      chrome.action.setIcon({ path: "disabled-debug.png", tabId: tabId });
    }
  }
  
  // Function to force reload with debug mode
  function forceDebugMode(tabId, url) {
    const currentUrl = new URL(url);
  
    // Add debug_mode=true to the URL
    if (!currentUrl.searchParams.has("debug_mode")) {
      currentUrl.searchParams.append("debug_mode", "true");
    }
  
    // Force reload the page with the updated URL
    chrome.tabs.update(tabId, { url: currentUrl.href }, () => {
      // After reloading, verify if debug_mode was applied
      setTimeout(() => {
        chrome.tabs.get(tabId, (updatedTab) => {
          if (updatedTab.url && !updatedTab.url.includes("debug_mode")) {
            notifyFailure(); // Notify user if debug mode fails
          }
        });
      }, 2000); // Wait for potential redirect
    });
  }
  
  // Function to notify the user about failure
  function notifyFailure() {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "disabled-debug.png",
      title: "Debug Mode Failed",
      message:
        "Debug mode did not load. Make sure to open this page via the Preview option in the Bubble editor.",
      priority: 2,
    });
  
    alert(
      "Debug mode did not load. Make sure to open this page via the Preview option in the Bubble editor."
    );
  }
  
  // Function to toggle debug mode
  function toggleDebugMode(tab) {
    if (tab.url && tab.url.includes(".bubbleapps.io")) {
      const currentUrl = new URL(tab.url);
  
      if (currentUrl.searchParams.has("debug_mode")) {
        // Debug mode is enabled, so disable it
        currentUrl.searchParams.delete("debug_mode");
        chrome.action.setIcon({ path: "disabled-debug.png", tabId: tab.id });
        chrome.tabs.update(tab.id, { url: currentUrl.href });
      } else {
        // Debug mode is disabled, so enable it
        forceDebugMode(tab.id, tab.url); // Force enable debug mode
      }
    }
  }
  
  // Listener for when the extension button is clicked
  chrome.action.onClicked.addListener((tab) => {
    toggleDebugMode(tab);
  });
  
  // Listener for tab updates or navigation changes
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      updateIcon(tabId, tab.url);
    }
  });
  
  // Listener for when the user switches tabs
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateIcon(activeInfo.tabId, tab.url);
  });
  
  // Listener for window focus changes
  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
      const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
      if (tab) updateIcon(tab.id, tab.url);
    }
  });
  