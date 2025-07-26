function detectLeetCodeSubmission() {
  const observer = new MutationObserver(() => {
    const result = document.querySelector('[data-e2e-locator="submission-result"]');
    console.log("Detected result element:", result);

    if (result && result.textContent.trim() !== '') {
      const status = result.textContent.trim();
      const url = window.location.pathname;  // e.g., "/problems/two-sum/"

      console.log("Content script: Sending submission to background.js");

      chrome.runtime.sendMessage({
        type: 'SUBMISSION',
        data: {
          platform: 'LeetCode',
          status,
          questionPath: url,
          timestamp: Date.now(),
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("SendMessage error:", chrome.runtime.lastError.message);
        } else {
          console.log("Message sent:", response);
        }
      });

      observer.disconnect(); // prevent spamming
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (window.location.hostname.includes('leetcode.com')) {
  detectLeetCodeSubmission();
}
