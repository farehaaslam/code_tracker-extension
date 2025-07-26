const PROGRESS_GOAL = 5;

chrome.storage.local.get(['submissions'], (res) => {
  const submissions = res.submissions || [];

  // Get only today's submissions
  const today = new Date().toDateString();
  const uniqueToday = new Set();

  submissions.forEach(sub => {
    const date = new Date(sub.timestamp).toDateString();
    if (date === today) {
      uniqueToday.add(sub.questionPath);
    }
  });

  const solved = uniqueToday.size;
  const percent = Math.min((solved / PROGRESS_GOAL) * 100, 100);
  const offset = 314 - (314 * percent / 100);

  // Update SVG circle
  document.querySelector('.fg').style.strokeDashoffset = offset;
  document.querySelector('.progress-text').textContent = `${Math.floor(percent)}%`;

  // Update summary text
  document.getElementById('summary').textContent = `${solved} / ${PROGRESS_GOAL} problems solved`;
});

