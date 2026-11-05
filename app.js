// Interactive logic for AWS Amplify Demonstration

// 1. Tab Navigation
document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

    button.classList.add("active");
    const targetTab = button.getAttribute("data-tab");
    const content = document.getElementById(`tab-${targetTab}`);
    if (content) content.classList.add("active");
  });
});

// 2. SPA Route Simulator
function navigateTo(path) {
  const display = document.getElementById("active-path");
  if (display) {
    display.textContent = path;
  }
  window.history.pushState({}, "", `#${path}`);
}

// 3. Latency Ping Simulator
function runPingTest() {
  const resultBox = document.getElementById("latency-result");
  const btn = document.getElementById("btn-ping");
  if (!resultBox || !btn) return;

  btn.disabled = true;
  btn.textContent = "Measuring Edge Round-Trip...";
  resultBox.textContent = "Contacting nearest AWS CloudFront Edge PoP...";

  const startTime = performance.now();
  // Fetch current asset to measure true edge roundtrip
  fetch("style.css?cache_bust=" + Date.now(), { method: "HEAD" })
    .then(() => {
      const duration = Math.round(performance.now() - startTime);
      resultBox.innerHTML = `<strong>Edge Status: ONLINE</strong><br>Round-trip Latency: <span style="color: #3fb950;">${duration} ms</span><br>Served via: Amazon CloudFront Edge Point-of-Presence`;
    })
    .catch(() => {
      const simulatedDuration = Math.floor(Math.random() * 25) + 12;
      resultBox.innerHTML = `<strong>Edge Status: LOCAL_SIMULATION</strong><br>Estimated Latency: <span style="color: #58a6ff;">${simulatedDuration} ms</span>`;
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Execute Latency Ping";
    });
}

