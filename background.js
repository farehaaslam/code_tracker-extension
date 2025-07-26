chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SUBMISSION') {
    const newSubmission = msg.data;

    chrome.storage.local.get(['submissions'], (res) => {
      const submissions = res.submissions || [];

      const alreadySubmitted = submissions.some(sub =>
        sub.platform === 'LeetCode' && sub.questionPath === newSubmission.questionPath
      );

      if (!alreadySubmitted) {
        submissions.push(newSubmission);
        chrome.storage.local.set({ submissions }, () => {
          console.log("✅ New unique submission saved:", newSubmission);
        });
      } else {
        console.log("⚠️ Duplicate submission ignored:", newSubmission.questionPath);
      }

      sendResponse({ status: alreadySubmitted ? 'duplicate' : 'saved' });
    });

    return true;
  }
});
