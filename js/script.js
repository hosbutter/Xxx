const sidebarLeftContainer = document.getElementById("sidebarLeftContainer");
const sidebarRightContainer = document.getElementById("sidebarRightContainer");
const pageOverlay = document.getElementById("pageOverlay");
const sidebarLeftToggleBtn = document.getElementById("sidebarLeftToggleBtn");
const sidebarRightToggleBtn = document.getElementById("sidebarRightToggleBtn");
const topNavBar = document.getElementById("topNavBar");
const mainContent = document.getElementById("mainContent");
const sidebarRightTreeLinks = document.querySelectorAll(".sidebarRightTreeLinks");
const sidebarRightCurrentPath = document.getElementById("sidebarRightCurrentPath");
const topLoadingBarContainer = document.getElementById("topLoadingBarContainer");
const topLoadingBar = document.getElementById("topLoadingBar");

let currentIdx = 0;
let autoSlideTimer = null;

const terminalState = { neon: false, ghost: false, invert: false };

function closeAll() {
  [sidebarLeftContainer, sidebarRightContainer, pageOverlay].forEach((el) => el && el.classList.remove("active"));
  [sidebarLeftToggleBtn, sidebarRightToggleBtn].forEach((el) => el && el.classList.remove("activeBtn"));
}

sidebarLeftToggleBtn.onclick = () => {
  const isOpen = sidebarLeftContainer.classList.contains("active");
  closeAll();
  if (!isOpen) {
    sidebarLeftContainer.classList.add("active");
    pageOverlay.classList.add("active");
  }
};

sidebarRightToggleBtn.onclick = () => {
  const isOpen = sidebarRightContainer.classList.contains("active");
  closeAll();
  if (!isOpen) {
    sidebarRightContainer.classList.add("active");
    pageOverlay.classList.add("active");
  }
};

pageOverlay.onclick = closeAll;

function rotate(step) {
  const rail = document.getElementById("rotationRail");
  const cards = document.querySelectorAll(".rotationCards");
  if (!rail || cards.length === 0) return;
  cards[currentIdx].classList.remove("active");
  currentIdx = (currentIdx + step + cards.length) % cards.length;
  cards[currentIdx].classList.add("active");
  rail.style.transform = `translateX(${currentIdx * -300}px)`;
}

function initAutoRotation() {
  if (autoSlideTimer) clearInterval(autoSlideTimer);
  const rail = document.getElementById("rotationRail");
  if (!rail) return;
  autoSlideTimer = setInterval(() => rotate(1), 5000);
  const windowEl = document.getElementById("rotationWindow") || document.querySelector(".rotationWindow");
  if (windowEl) {
    windowEl.onmouseenter = () => clearInterval(autoSlideTimer);
    windowEl.onmouseleave = () => initAutoRotation();
  }
}

async function initSessionActivity() {
  const grid = document.getElementById("sessionActivityGrid");
  if (!grid) return;
  try {
    const response = await fetch("./commits.json");
    if (!response.ok) throw new Error("JSON not found");
    const data = await response.json();
    let total = 0, peak = 0, daysPlayed = 0;
    grid.innerHTML = "";
    for (let i = 0; i < 364; i++) {
      const square = document.createElement("div");
      square.classList.add("square");
      const day = data[i];
      const hrs = day ? parseFloat(day.hours) : 0;
      total += hrs;
      if (hrs > peak) peak = hrs;
      if (hrs > 0) daysPlayed++;
      if (hrs === 0) square.classList.add("level0");
      else if (hrs <= 2) square.classList.add("level1");
      else if (hrs <= 5) square.classList.add("level2");
      else if (hrs <= 8) square.classList.add("level3");
      else square.classList.add("level4");
      if (day) square.title = `${day.date}: ${hrs}h`;
      grid.appendChild(square);
    }
    const totalEl = document.getElementById("totalHours");
    const peakEl = document.getElementById("peakHours");
    const avgEl = document.getElementById("avgHours");
    if (totalEl) totalEl.textContent = `${total.toFixed(1)}h`;
    if (peakEl) peakEl.textContent = `${peak.toFixed(1)}h`;
    if (avgEl) avgEl.textContent = `${(total / (daysPlayed || 1)).toFixed(1)}h`;
  } catch (err) {
    console.warn("Could not load stats data", err);
  }
}

function initLibraryFilters() {
  const table = document.getElementById("libraryTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const sortBtns = document.querySelectorAll(".sortBtn");
  const sortTable = (type, btn) => {
    sortBtns.forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    const sortedRows = rows.sort((a, b) => {
      const valA = parseFloat(a.getAttribute(`data-${type}`)) || 0;
      const valB = parseFloat(b.getAttribute(`data-${type}`)) || 0;
      return valB - valA;
    });
    sortedRows.forEach((row) => tbody.appendChild(row));
  };
  sortBtns.forEach((btn) => { btn.onclick = () => sortTable(btn.getAttribute("data-sort"), btn); });
  const defaultSortBtn = document.querySelector('.sortBtn[data-sort="time"]');
  if (defaultSortBtn) sortTable("time", defaultSortBtn);
}

function initInternalTabs() {
  const tabs = document.querySelectorAll(".topNavTabBtns");
  const contents = document.querySelectorAll(".pageTabContents");
  const pageName = window.location.hash.substring(1) || "ishini";
  const storageKey = `activeTab_${pageName}`;
  const savedTabId = localStorage.getItem(storageKey);
  if (savedTabId) {
    const targetTab = document.querySelector(`[data-target="${savedTabId}"]`);
    const targetContent = document.getElementById(savedTabId);
    if (targetTab && targetContent) {
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));
      targetTab.classList.add("active");
      targetContent.classList.add("active");
      if (sidebarRightCurrentPath) sidebarRightCurrentPath.textContent = `/root/${pageName}/${savedTabId}`;
    }
  }
  tabs.forEach((tab) => {
    tab.onclick = () => {
      const target = tab.getAttribute("data-target");
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(target)?.classList.add("active");
      localStorage.setItem(storageKey, target);
      if (sidebarRightCurrentPath) sidebarRightCurrentPath.textContent = `/root/${pageName}/${target}`;
      initAutoRotation();
      initSessionActivity();
      initLibraryFilters();
    };
  });
}

function initTerminal() {
  const input = document.getElementById("sidebarRightTerminalInput");
  const output = document.getElementById("sidebarRightTerminalOutput");
  if (!input || !output) return;
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.toLowerCase().trim();
      if (!cmd) return;
      const line = document.createElement("div");
      line.innerHTML = `<span style="color:var(--accent)">></span> ${cmd}`;
      output.appendChild(line);
      executeCommand(cmd, output);
      input.value = "";
      output.scrollTop = output.scrollHeight;
    }
  };
}

function executeCommand(cmd, output) {
  const resp = document.createElement("div");
  resp.style.color = "#00f5ff";
  resp.style.fontSize = "0.7rem";
  resp.style.marginBottom = "8px";
  switch (cmd) {
    case "help":
      resp.textContent = "Available: neon, ghost, invert, shake, clear, reset";
      break;
    case "neon":
      terminalState.neon = !terminalState.neon;
      document.querySelectorAll(".favoritesCards, .wishlistCards, .statsCards, .mediaItems").forEach((c) => {
        c.style.boxShadow = terminalState.neon ? "0 0 20px #ff3399" : "";
        c.style.borderColor = terminalState.neon ? "#ff3399" : "";
      });
      resp.textContent = terminalState.neon ? "Neon Overdrive: ON" : "Neon Overdrive: OFF";
      break;
    case "ghost":
      terminalState.ghost = !terminalState.ghost;
      document.body.style.opacity = terminalState.ghost ? "0.5" : "1";
      resp.textContent = terminalState.ghost ? "Stealth Mode: ON" : "Stealth Mode: OFF";
      break;
    case "invert":
      terminalState.invert = !terminalState.invert;
      document.documentElement.style.filter = terminalState.invert ? "invert(1)" : "invert(0)";
      resp.textContent = terminalState.invert ? "Colors: INVERTED" : "Colors: NORMAL";
      break;
    case "shake":
      document.body.style.animation = "none";
      setTimeout(() => { document.body.style.animation = "shake 0.5s ease"; }, 10);
      resp.textContent = "Impact triggered.";
      break;
    case "clear":
      output.innerHTML = "";
      return;
    case "reset":
      terminalState.neon = false; terminalState.ghost = false; terminalState.invert = false;
      document.body.style.opacity = "1"; document.documentElement.style.filter = "none"; document.body.style.animation = "none";
      document.querySelectorAll(".favoritesCards, .wishlistCards, .statsCards, .mediaItems").forEach((c) => { c.style.boxShadow = ""; c.style.borderColor = ""; });
      resp.textContent = "System restored to default. (｡•̀ᴗ-)✧";
      break;
    default:
      resp.style.color = "#ff4444";
      resp.textContent = `Unknown command: ${cmd}`;
  }
  output.appendChild(resp);
}

async function loadPage(pageName, linkElement) {
  try {
    topLoadingBarContainer.style.display = "block";
    topLoadingBar.style.width = "40%";
    const response = await fetch(`pages/${pageName}.html`);
    if (!response.ok) throw new Error();
    const rawHTML = await response.text();
    const doc = new DOMParser().parseFromString(rawHTML, "text/html");
    if (sidebarLeftContainer) sidebarLeftContainer.innerHTML = doc.getElementById("fragmentNewLeft")?.innerHTML || "";
    if (topNavBar) topNavBar.innerHTML = doc.getElementById("fragmentNewNav")?.innerHTML || "";
    if (mainContent) mainContent.innerHTML = doc.getElementById("fragmentNewContent")?.innerHTML || "";
    window.location.hash = pageName;
    initPageSpecificScripts();
    currentIdx = 0;
    topLoadingBar.style.width = "100%";
    setTimeout(() => { topLoadingBarContainer.style.display = "none"; topLoadingBar.style.width = "0%"; }, 400);
    sidebarRightTreeLinks.forEach((l) => l.classList.remove("active"));
    const activeLink = linkElement || document.querySelector(`[data-section="${pageName}"]`);
    if (activeLink) activeLink.classList.add("active");
    if (sidebarRightCurrentPath) sidebarRightCurrentPath.textContent = `/root/${pageName}`;
    if (window.innerWidth <= 850) closeAll();
  } catch (err) {
    topLoadingBarContainer.style.display = "none";
    if (mainContent) mainContent.innerHTML = `<h2>Error</h2><p>Page could not be loaded.</p>`;
  }
}

sidebarRightTreeLinks.forEach((link) => {
  link.onclick = (e) => {
    e.preventDefault();
    loadPage(link.getAttribute("data-section"), link);
  };
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.substring(1);
  if (hash) loadPage(hash, null);
});

window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.substring(1);
  loadPage(hash || "ishini", null);
});

function initPageSpecificScripts() {
  initInternalTabs();
  initAutoRotation();
  initSessionActivity();
  initLibraryFilters();
  initTerminal();
}
