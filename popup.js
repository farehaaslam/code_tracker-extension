document.addEventListener("DOMContentLoaded", async () => {
  const targetDisplay = document.getElementById("target-display");
  const subCountDisplay = document.getElementById("sub-count");
  const summary = document.getElementById("summary");
  const progressFg = document.getElementById("progress-fg");
  const progressText = document.querySelector(".progress-text");

  if (targetDisplay) targetDisplay.textContent = "Loading target...";
  if (subCountDisplay) subCountDisplay.textContent = "Loading submissions...";
  if (summary) summary.textContent = "Loading progress...";
  if (progressText) progressText.textContent = "0%";

  try {
    const targetResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_TARGET" }, resolve);
    });

    if (targetResponse.error) {
      if (targetDisplay)
        targetDisplay.textContent = `Error: ${targetResponse.error}`;
      throw new Error(targetResponse.error);
    }

    const target = targetResponse.target || 0;
    if (targetDisplay)
      targetDisplay.textContent = `Your target: ${target} problems/day`;
    console.log("Fetched target:", target);

    // Fetch today's submission count
    const countResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_TODAY_SUB_COUNT" }, resolve);
    });

    if (countResponse.error) {
      if (subCountDisplay)
        subCountDisplay.textContent = `Error: ${countResponse.error}`;
      throw new Error(countResponse.error);
    }

    const solved = countResponse.count || 0;
    if (subCountDisplay)
      subCountDisplay.textContent = `Today's Submissions: ${solved}`;
    console.log("Fetched today's submission count:", solved);

    const percent = target > 0 ? Math.min((solved / target) * 100, 100) : 0;
    const offset = 314 - (314 * percent) / 100;

    if (progressFg) {
      progressFg.style.strokeDashoffset = offset;

      if (percent >= 100) {
        progressFg.style.stroke = "green";
      } else if (percent >= 75) {
        progressFg.style.stroke = "limegreen";
      } else if (percent >= 50) {
        progressFg.style.stroke = "orange";
      } else {
        progressFg.style.stroke = "crimson";
      }

      progressFg.style.transition = "stroke 0.3s ease-in-out";
    }

    if (progressText) progressText.textContent = `${Math.floor(percent)}%`;
    if (progressText) {
      if (percent >= 100) {
        progressText.style.color = "green";
      } else if (percent >= 75) {
        progressText.style.color = "limegreen";
      } else if (percent >= 50) {
        progressText.style.color = "orange";
      } else {
        progressText.style.color = "crimson";
      }
    }
    if (summary) summary.textContent = `${solved} / ${target} problems solved`;
  } catch (err) {
    console.error("Failed to fetch data:", err);
    // Fallback UI updates
    if (targetDisplay) targetDisplay.textContent = "Failed to load target.";
    if (subCountDisplay)
      subCountDisplay.textContent = "Failed to load submissions.";
    if (summary) summary.textContent = "Failed to load progress.";
  }
});
