chrome.runtime.onInstalled.addListener(() => {
  console.log('🟢 Background script installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_TOKEN") {
    chrome.storage.local.set({ authToken: message.token }, () => {
      console.log("🔐 Auth token saved to chrome.storage.local");
    });
    return;
  }
  if (message.type === 'SUBMISSION') {
    handleSubmission(message.data);
  }
});

async function handleSubmission(data) {
  try {
    const { authToken } = await new Promise((resolve) =>
      chrome.storage.local.get(['authToken'], resolve)
    );

    if (!authToken) {
      console.warn('⚠️ No auth token found. Ask user to sign in via web app.');
      console.warn("Please sign in to the CodeTracker web app to sync your submissions.");
      return;
    }

    const submission = {
      userId: null, // backend will use JWT to identify
      platform: data.platform,
      questionName: data.questionName,
      questionLink: data.questionLink,
      note: '',
      topic: '',
      diffculty: '',
      timestamp: data.timestamp
    };

    const response = await fetch('http://localhost:5000/api/submission/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(submission)
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Submission saved to backend:', result);
  } catch (err) {
    console.error('❌ Failed to send submission:', err.message);
    console.warn("Submission failed. Please check your connection or token.");
  }
}
