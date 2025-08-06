chrome.runtime.onInstalled.addListener(() => {
  console.log("Background script installed");
});
const BASE_URL = "https://codetracker-api.onrender.com/api";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_TOKEN") {
    chrome.storage.local.set(
      {
        authToken: message.token, 
        refreshToken: message.refreshToken, 
      },
      () => {
        console.log(" Tokens saved to chrome.storage.local");
      }
    );
    return;
  }
  if (message.type === "SUBMISSION") {
    handleSubmission(message.data);
    return; // Not async, but can be if needed
  }
  if (message.type === "GET_TARGET") {
    (async () => {
      try {
        let { authToken, refreshToken } = await chrome.storage.local.get([
          "authToken",
          "refreshToken",
        ]);
        if (!authToken || isTokenExpired(authToken)) {
          if (!refreshToken)
            throw new Error("No refresh token available. Please sign in.");
          const refreshRes = await fetch(
            `${BASE_URL}/user/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            }
          );
          if (!refreshRes.ok) throw new Error("Token refresh failed");
          const { accessToken: newToken, refreshToken: newRefresh } =
            await refreshRes.json();
          authToken = newToken;
          await chrome.storage.local.set({
            authToken: newToken,
            refreshToken: newRefresh,
          });
          console.log("Token refreshed successfully");
        }
        const response = await fetch(
          `${BASE_URL}/user/gettarget`,
          {
            // Local gettarget endpoint
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok)
          throw new Error(`Failed to fetch target: ${response.status}`);

        const data = await response.json();
        console.log(data);
        sendResponse({ target: data.target || data }); 
      } catch (err) {
        console.error("Failed to fetch target:", err.message);
        sendResponse({ error: err.message });
      }
    })();
    return true; 
  }

  if (message.type === "GET_TODAY_SUB_COUNT") {
    (async () => {
      try {
        let { authToken, refreshToken } = await chrome.storage.local.get([
          "authToken",
          "refreshToken",
        ]);

        if (!authToken || isTokenExpired(authToken)) {
          if (!refreshToken)
            throw new Error("No refresh token available. Please sign in.");
          const refreshRes = await fetch(
            `${BASE_URL}/user/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            }
          );
          if (!refreshRes.ok) throw new Error("Token refresh failed");
          const { accessToken: newToken, refreshToken: newRefresh } =
            await refreshRes.json();
          authToken = newToken;
          await chrome.storage.local.set({
            authToken: newToken,
            refreshToken: newRefresh,
          });
          console.log("Token refreshed successfully");
        }
        const response = await fetch(
          `${BASE_URL}/submission/todaysubmission`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok)
          throw new Error(
            `Failed to fetch submission count: ${response.status}`
          );

        const data = await response.json();
        console.log(data);
        sendResponse({ count: data.count || 0 }); 
      } catch (err) {
        console.error("Failed to fetch submission count:", err.message);
        sendResponse({ error: err.message });
      }
    })();
    return true; 
  }
});

async function handleSubmission(data) {
  try {
    let { authToken, refreshToken } = await chrome.storage.local.get([
      "authToken",
      "refreshToken",
    ]);

    if (!authToken || isTokenExpired(authToken)) {
      if (!refreshToken) {
        console.warn(
          " No refresh token found. Ask user to sign in via web app."
        );
        return;
      }
      const refreshRes = await fetch(`${BASE_URL}/user/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!refreshRes.ok) throw new Error("Token refresh failed");
      const { accessToken: newToken, refreshToken: newRefresh } =
        await refreshRes.json();
      authToken = newToken;
      await chrome.storage.local.set({
        authToken: newToken,
        refreshToken: newRefresh,
      });
      console.log("Token refreshed successfully");
    }

    const submission = {
      userId: null, 
      platform: data.platform,
      questionName: data.questionName,
      questionLink: data.questionLink,
      note: "",
      topic: "",
      difficulty: "", 
      timestamp: data.timestamp,
    };

    const response = await fetch(
      `${BASE_URL}/submission/create`,
      {
        // Local submission endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(submission),
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Submission saved to backend:", result);
  } catch (err) {
    console.error("Failed to send submission:", err.message);
    console.warn("Submission failed. Please check your connection or token.");
  
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; 
  }
}
