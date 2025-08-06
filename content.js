// ✅ Receive JWT token from web app and store it
console.log("🟢 content.js injected and running on:", window.location.href);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
console.log("🔁 Received window message in content.js:", event.data);
  if (event.data.type === "AUTH_TOKEN") {
  
     chrome.runtime.sendMessage({
      type: "AUTH_TOKEN",
      token: event.data.token,
    });
  }
});

// ✅ Extract question details from current LeetCode page
function getLeetCodeQuestionDetails() {
  const path = window.location.pathname; // "/problems/two-sum/"
  const slug = path.split('/')[2];       // "two-sum"
  const name = document.title.replace(" - LeetCode", "").trim(); // "Two Sum"
  const link = `https://leetcode.com${path}`;

  return {
    questionName: name,
    questionLink: link,
    questionPath: slug
  };
}

// ✅ Detect submission result and send to background.js
function detectLeetCodeSubmission() {
  const observer = new MutationObserver(() => {
    const resultElement = document.querySelector('[data-e2e-locator="submission-result"]');

    if (resultElement && resultElement.textContent.trim()) {
      const { questionName, questionLink, questionPath } = getLeetCodeQuestionDetails();
      const status = resultElement.textContent.trim();

      chrome.runtime.sendMessage({
        type: 'SUBMISSION',
        data: {
          platform: 'LeetCode',
          questionName,
          questionLink,
          questionPath, // useful for de-duplication
          status,
          timestamp: Date.now()
        }
      });

      observer.disconnect(); // ✅ Prevent duplicate sends
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ✅ Trigger only on LeetCode problem page
if (window.location.hostname.includes('leetcode.com')) {
  detectLeetCodeSubmission();
}
