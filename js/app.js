// Main Application Entry Point for CineSkills (ES6 Modules)
import { currentState, saveStudentProgress, getDirectorRank, calculateArchetype } from './state.js';
import { renderSkillMatrix, toggleTierSection, cycleSkillLevel, openSkillDetail, setModalCompetencyLevel, handleNotesInput, closeModal } from './matrix.js';
import { renderProfileView, savePortfolioBio, updateShowreel, openAddProjectModal, closeAddProjectModal, handleAddProjectSubmit, deletePortfolioProject, exportData, importData, exportPDF } from './profile.js';
import { logProgressHistory } from './charts.js';
import { renderGearView, renderLicenseDashboard, downloadCertificate } from './gear.js';
import { renderQuestsView, renderInspirationView, getQuestBonusXp, startMicroQuiz, nextQuizStep, applyQuizRecommendation, claimQuestReward, ACHIEVEMENT_BADGES, renderAchievements } from './quests.js';
import { initSupabase, syncProgressToCloud, pullProgressFromCloud, openTeacherDashboardModal, configureCloudSyncPrompt } from './sync.js';

let targetX = 0, targetY = 0, curX = 0, curY = 0;
let deferredPrompt = null;

// Initialize Application State
export function getActiveStudentName() {
  return sessionStorage.getItem("cineskills_active_student_name") ||
         localStorage.getItem("cineskills_last_student_name") ||
         localStorage.getItem("cineskills_student_name") || "Student";
}

export function getActiveStudentId() {
  return sessionStorage.getItem("cineskills_active_student_id") ||
         localStorage.getItem("cineskills_last_student_id") ||
         localStorage.getItem("cineskills_student_id") || "";
}

export function setActiveStudentSession(id, name) {
  if (id) {
    sessionStorage.setItem("cineskills_active_student_id", id);
    localStorage.setItem("cineskills_last_student_id", id);
    localStorage.setItem("cineskills_student_id", id);
  }
  if (name) {
    sessionStorage.setItem("cineskills_active_student_name", name);
    localStorage.setItem("cineskills_last_student_name", name);
    localStorage.setItem("cineskills_student_name", name);
  }
}

function init() {
  // Initialize PWA Service Worker for 100% Offline Use
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          reg.update();
        })
        .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
    });
  }

  // Initialize optional Supabase Cloud Sync
  initSupabase();

  const savedTheme = localStorage.getItem("cineskills_theme") || "dark";
  selectTheme(savedTheme);

  const savedDyslexia = localStorage.getItem("cineskills_dyslexia_font");
  if (savedDyslexia === "true") {
    document.body.classList.add("dyslexia-font");
    const btnText = document.getElementById("dyslexia-btn-text");
    if (btnText) btnText.textContent = "Standard Font";
  }

  const activeStudentSession = getActiveStudentId();
  const activeStudentName = getActiveStudentName();

  if (activeStudentSession && activeStudentName && activeStudentName !== "Student") {
    currentState.selectedStudent = activeStudentSession;
    setActiveStudentSession(activeStudentSession, activeStudentName);

    if (activeStudentName.includes("Alan Smithee")) {
      triggerAlanSmitheeMode();
    } else {
      updateStudentHeader();
      loadStudentProgress(activeStudentSession);
      closeLoginOverlay();
    }
  } else {
    openLoginOverlay();
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentState.searchQuery = e.target.value.toLowerCase();
      renderSkillMatrix();
    });
  }

  const statusFilter = document.getElementById("status-filter");
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      currentState.filterStatus = e.target.value;
      renderSkillMatrix();
    });
  }

  const tierFilter = document.getElementById("tier-filter");
  if (tierFilter) {
    tierFilter.addEventListener("change", (e) => {
      currentState.filterTier = e.target.value;
      renderSkillMatrix();
    });
  }

  const closeModalBtn = document.getElementById("close-modal-btn");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  
  const detailModal = document.getElementById("detail-modal");
  if (detailModal) {
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) closeModal();
    });
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  document.addEventListener("click", (e) => {
    const container = document.querySelector(".settings-menu-container");
    const menu = document.getElementById("settings-dropdown");
    if (menu && container && !container.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

  document.addEventListener("mousemove", (e) => {
    const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    const ndcY = (e.clientY / window.innerHeight) * 2 - 1;
    targetX = ndcX * 65;
    targetY = ndcY * 65;
  });

  requestAnimationFrame(updateAuroraPosition);
  switchView('profile');
}

export function loadStudentProgress(studentId) {
  currentState.isInitialLoad = true;
  const db = window.CINESKILLS_DATABASE || (typeof CINESKILLS_DATABASE !== 'undefined' ? CINESKILLS_DATABASE : null);
  
  let saved = localStorage.getItem(`cineskills_progress_${studentId}`);
  if (!saved && studentId) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cineskills_progress_")) {
        const potentialData = localStorage.getItem(key);
        if (potentialData) {
          saved = potentialData;
          console.log("[Data Recovery] Found existing local student progress from key:", key);
          break;
        }
      }
    }
  }
  
  currentState.progress = {};
  
  if (db && db.categories) {
    db.categories.forEach(cat => {
      cat.skills.forEach(skill => {
        currentState.progress[skill.name] = { level: 0, notes: "" };
      });
    });
  }

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(skillName => {
        const val = parsed[skillName];
        if (typeof val === "object" && val !== null) {
          currentState.progress[skillName] = {
            level: val.level !== undefined ? val.level : (val.completed === true ? 2 : 0),
            notes: val.notes || ""
          };
        } else {
          currentState.progress[skillName] = {
            level: val === 2 ? 2 : 0,
            notes: ""
          };
        }
      });
    } catch (e) {
      console.error("Error loading progress data", e);
    }
  } else {
    saveStudentProgress();
  }
  
  updateDashboard();
  renderSkillMatrix();
  updateStudentHeader();
  
  const profileView = document.getElementById("profile-view");
  if (profileView && profileView.classList.contains("active")) {
    renderProfileView();
  }
  currentState.isInitialLoad = false;
}

export function updateDashboard() {
  let earnedXp = 0;
  let maxPossibleXp = 0;
  let completedCount = 0;
  let totalSkills = 0;
  
  const categoryStats = {};
  
  CINESKILLS_DATABASE.categories.forEach(cat => {
    categoryStats[cat.id] = { totalXp: 0, earnedXp: 0 };
    
    cat.skills.forEach(skill => {
      totalSkills++;
      categoryStats[cat.id].totalXp += skill.xp;
      maxPossibleXp += skill.xp;
      
      const skillState = currentState.progress[skill.name] || { level: 0, notes: "" };
      const level = skillState.level || 0;
      
      let earned = 0;
      if (level === 1) earned = skill.xp * 0.5;
      else if (level === 2) {
        earned = skill.xp;
        completedCount++;
      }
      
      earnedXp += earned;
      categoryStats[cat.id].earnedXp += earned;
    });
  });

  earnedXp += getQuestBonusXp();

  const studentName = sessionStorage.getItem("cineskills_active_student_name") || "Student";
  const displayEl = document.getElementById("stats-student-display");
  if (displayEl) displayEl.textContent = `${studentName}'s Progress`;

  const pct = maxPossibleXp > 0 ? Math.round((earnedXp / maxPossibleXp) * 100) : 0;
  
  const completedPercentEl = document.getElementById("completed-percent");
  const progressBarEl = document.getElementById("progress-bar");
  if (completedPercentEl) completedPercentEl.textContent = `${pct}% Complete`;
  if (progressBarEl) progressBarEl.style.width = `${pct}%`;

  logProgressHistory(pct);
  checkBackupMilestones(pct);

  const { current, next } = getDirectorRank(pct);
  const rankEl = document.getElementById("director-rank");
  if (rankEl) {
    rankEl.innerHTML = `${current.emoji} <strong>${current.title}</strong> <span class="director-name">(${current.director})</span>`;
  }

  const milestoneEl = document.getElementById("next-rank-milestone");
  if (milestoneEl) {
    if (next) {
      milestoneEl.textContent = `Next: ${next.title} (${next.threshold}%)`;
    } else {
      milestoneEl.textContent = `Max Rank Achieved!`;
    }
  }

  const archetype = calculateArchetype(categoryStats, pct);
  const archetypeEl = document.getElementById("archetype-role");
  if (archetypeEl) {
    archetypeEl.innerHTML = `${archetype.emoji} <strong>${archetype.title}</strong>`;
  }
  const archetypeDescEl = document.getElementById("archetype-desc");
  if (archetypeDescEl) {
    archetypeDescEl.textContent = archetype.desc;
  }

  const categoryBreakdown = document.getElementById("category-breakdown");
  if (categoryBreakdown) {
    categoryBreakdown.innerHTML = "";
    CINESKILLS_DATABASE.categories.forEach(cat => {
      const stats = categoryStats[cat.id];
      const catPct = stats.totalXp > 0 ? Math.round((stats.earnedXp / stats.totalXp) * 100) : 0;
      
      const barHtml = `
        <div class="category-stat-row">
          <div class="category-stat-info">
            <span>${cat.emoji} ${cat.name}</span>
            <span class="pct-text">${catPct}%</span>
          </div>
          <div class="progress-track-mini">
            <div class="progress-bar-mini" style="width: ${catPct}%"></div>
          </div>
        </div>
      `;
      categoryBreakdown.innerHTML += barHtml;
    });
  }

  const profileView = document.getElementById("profile-view");
  if (profileView && profileView.classList.contains("active")) {
    renderProfileView();
  }

  checkNewAchievements();
}

export function playAchievementSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const duration = 0.12; 
  
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine"; 
    osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + index * 0.08);
    osc.stop(ctx.currentTime + index * 0.08 + duration);
  });
}

function checkNewAchievements() {
  if (!currentState.selectedStudent) return;

  const categoryStats = {};
  CINESKILLS_DATABASE.categories.forEach(cat => {
    categoryStats[cat.id] = { totalXp: 0, earnedXp: 0 };
    cat.skills.forEach(skill => {
      categoryStats[cat.id].totalXp += skill.xp;
      const skillState = currentState.progress[skill.name] || { level: 0 };
      const level = skillState.level || 0;
      let earned = 0;
      if (level === 1) earned = skill.xp * 0.5;
      else if (level === 2) earned = skill.xp;
      categoryStats[cat.id].earnedXp += earned;
    });
  });

  const currentUnlocked = [];
  ACHIEVEMENT_BADGES.forEach(badge => {
    if (badge.check(categoryStats, currentState.progress).unlocked) {
      currentUnlocked.push(badge.id);
    }
  });

  const storageKey = `cineskills_unlocked_achievements_${currentState.selectedStudent}`;
  const savedUnlockedRaw = localStorage.getItem(storageKey);
  let previouslyUnlocked = [];
  
  if (savedUnlockedRaw) {
    try {
      previouslyUnlocked = JSON.parse(savedUnlockedRaw);
    } catch (e) {}
  }

  const newlyUnlocked = currentUnlocked.filter(id => !previouslyUnlocked.includes(id));

  if (newlyUnlocked.length > 0) {
    if (!currentState.isInitialLoad) {
      playAchievementSound();
      newlyUnlocked.forEach(id => {
        const badge = ACHIEVEMENT_BADGES.find(b => b.id === id);
        if (badge) showAchievementToast(badge);
      });
    }
    localStorage.setItem(storageKey, JSON.stringify(currentUnlocked));
  }
}

export function showAchievementToast(badge) {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "notification-toast";
  toast.innerHTML = `
    <div class="toast-icon">${badge.emoji}</div>
    <div class="toast-content">
      <div class="toast-title">Achievement Unlocked!</div>
      <div class="toast-desc"><strong>${badge.name}</strong> - ${badge.desc}</div>
    </div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add("fade-out"), 9500);
  setTimeout(() => toast.remove(), 10000);
}

function updateAuroraPosition() {
  if (document.body.classList.contains("disable-animations")) {
    requestAnimationFrame(updateAuroraPosition);
    return;
  }
  curX += (targetX - curX) * 0.04;
  curY += (targetY - curY) * 0.04;
  
  const lightblueBlob = document.querySelector(".blob-lightblue");
  const blueBlob = document.querySelector(".blob-blue");
  const pinkBlob = document.querySelector(".blob-pink");
  
  if (lightblueBlob) {
    lightblueBlob.style.setProperty("--tx", `${curX * 0.8}px`);
    lightblueBlob.style.setProperty("--ty", `${curY * 0.8}px`);
  }
  if (blueBlob) {
    blueBlob.style.setProperty("--tx", `${-curX * 0.6}px`);
    blueBlob.style.setProperty("--ty", `${-curY * 0.6}px`);
  }
  if (pinkBlob) {
    pinkBlob.style.setProperty("--tx", `${curX * 0.5}px`);
    pinkBlob.style.setProperty("--ty", `${-curY * 0.5}px`);
  }
  
  requestAnimationFrame(updateAuroraPosition);
}

export function openLoginOverlay() {
  const loginName = document.getElementById("login-name");
  const loginId = document.getElementById("login-id");
  if (loginName) loginName.value = "";
  if (loginId) loginId.value = "";
  
  const closeLoginBtn = document.getElementById("close-login-btn");
  if (closeLoginBtn) {
    closeLoginBtn.style.display = currentState.selectedStudent ? "block" : "none";
  }
  
  const loginOverlay = document.getElementById("login-overlay");
  if (loginOverlay) loginOverlay.classList.add("active");
}

export function closeLoginOverlay() {
  const loginOverlay = document.getElementById("login-overlay");
  if (loginOverlay) {
    loginOverlay.classList.remove("active");
  }
}

export function toggleSettingsMenu() {
  const menu = document.getElementById("settings-dropdown");
  if (menu) menu.classList.toggle("active");
}

export function toggleMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navDrawer = document.getElementById("nav-drawer");
  if (hamburgerBtn) hamburgerBtn.classList.toggle("active");
  if (navDrawer) navDrawer.classList.toggle("active");
}

export function closeMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navDrawer = document.getElementById("nav-drawer");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
  if (navDrawer) navDrawer.classList.remove("active");
}

export function selectTheme(themeName) {
  const validThemes = ["dark", "light", "retro"];
  const targetTheme = validThemes.includes(themeName) ? themeName : "dark";

  document.body.classList.remove("light-theme", "retro-theme");
  if (targetTheme === "light") {
    document.body.classList.add("light-theme");
  } else if (targetTheme === "retro") {
    document.body.classList.add("retro-theme");
  }

  localStorage.setItem("cineskills_theme", targetTheme);

  const themeBtns = document.querySelectorAll(".theme-btn-option");
  themeBtns.forEach(btn => {
    if (btn.getAttribute("data-theme") === targetTheme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const profileView = document.getElementById("profile-view");
  if (profileView && profileView.classList.contains("active")) {
    renderProfileView();
  }
}

export function toggleTheme() {
  const currentTheme = localStorage.getItem("cineskills_theme") || "dark";
  const themes = ["dark", "light", "retro"];
  const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
  selectTheme(themes[nextIndex]);
}

export function handleLogin(event) {
  if (event) {
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
  }

  const nameEl = document.getElementById("login-name");
  const idEl = document.getElementById("login-id");
  const nameInput = nameEl ? nameEl.value.trim() : "";
  const idInput = idEl ? idEl.value.trim() : "";

  if (!nameInput || !idInput) {
    alert("Please enter both your Student Name and Student ID.");
    return false;
  }

  try {
    if (nameInput.toLowerCase() === "alan smithee" || idInput.toLowerCase() === "alan smithee") {
      triggerAlanSmitheeMode();
      return false;
    }

    if (currentState.isAlanSmithee) {
      currentState.isAlanSmithee = false;
      document.body.classList.remove("smithee-mode");
    }

    const sanitizedId = idInput.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const sessionStudentId = sanitizedId || idInput;

    setActiveStudentSession(sessionStudentId, nameInput);
    currentState.selectedStudent = sessionStudentId;
    updateStudentHeader();

    // Instantly load student local progress
    loadStudentProgress(sessionStudentId);
  } catch (err) {
    console.error("[Login Error] Exception during local login setup:", err);
  } finally {
    // ALWAYS remove overlay active state
    closeLoginOverlay();
  }

  // Non-blocking background cloud restore
  pullProgressFromCloud(currentState.selectedStudent).then(cloudProgress => {
    if (cloudProgress) {
      currentState.progress = cloudProgress;
      saveStudentProgress();
      updateDashboard();
      renderSkillMatrix();
    }
  }).catch(err => {
    console.warn("[Login] Background cloud pull skipped:", err);
  });

  return false;
}

export function switchView(viewName) {
  closeMobileMenu();
  const matrixView = document.getElementById("matrix-view");
  const profileView = document.getElementById("profile-view");
  const gearView = document.getElementById("gear-view");
  const inspirationView = document.getElementById("inspiration-view");
  const questsView = document.getElementById("quests-view");
  const tabs = document.querySelectorAll(".nav-tab");
  
  if (matrixView) matrixView.classList.remove("active");
  if (profileView) profileView.classList.remove("active");
  if (gearView) gearView.classList.remove("active");
  if (inspirationView) inspirationView.classList.remove("active");
  if (questsView) questsView.classList.remove("active");
  
  tabs.forEach(tab => tab.classList.remove("active"));
  
  if (viewName === "profile") {
    if (profileView) profileView.classList.add("active");
    if (tabs[0]) tabs[0].classList.add("active");
    renderProfileView();
  } else if (viewName === "matrix") {
    if (matrixView) matrixView.classList.add("active");
    if (tabs[1]) tabs[1].classList.add("active");
  } else if (viewName === "gear") {
    if (gearView) gearView.classList.add("active");
    if (tabs[2]) tabs[2].classList.add("active");
    renderGearView();
  } else if (viewName === "inspiration") {
    if (inspirationView) inspirationView.classList.add("active");
    if (tabs[3]) tabs[3].classList.add("active");
    renderInspirationView();
  } else if (viewName === "quests") {
    if (questsView) questsView.classList.add("active");
    if (tabs[4]) tabs[4].classList.add("active");
    renderQuestsView();
  }
}

export function switchChart(chartType) {
  const radarCanvasWrapper = document.getElementById("radar-canvas-wrapper");
  const timelineCanvasWrapper = document.getElementById("timeline-canvas-wrapper");
  const chartRadarBtn = document.getElementById("chart-radar-btn");
  const chartTimelineBtn = document.getElementById("chart-timeline-btn");
  const chartsCardTitle = document.getElementById("charts-card-title");
  const chartsCardSubtitle = document.getElementById("charts-card-subtitle");

  if (chartType === 'radar') {
    if (radarCanvasWrapper) radarCanvasWrapper.style.display = "flex";
    if (timelineCanvasWrapper) timelineCanvasWrapper.style.display = "none";
    if (chartRadarBtn) chartRadarBtn.classList.add("active");
    if (chartTimelineBtn) chartTimelineBtn.classList.remove("active");
    if (chartsCardTitle) chartsCardTitle.textContent = "Competency Radar Chart";
    if (chartsCardSubtitle) chartsCardSubtitle.textContent = "Visual analysis of your skills across the 10 media categories.";
  } else {
    if (radarCanvasWrapper) radarCanvasWrapper.style.display = "none";
    if (timelineCanvasWrapper) timelineCanvasWrapper.style.display = "flex";
    if (chartRadarBtn) chartRadarBtn.classList.remove("active");
    if (chartTimelineBtn) chartTimelineBtn.classList.add("active");
    if (chartsCardTitle) chartsCardTitle.textContent = "Progression Timeline";
    if (chartsCardSubtitle) chartsCardSubtitle.textContent = "Track your learning velocity and completion rate over time.";
  }
}

export function switchAchievementsTab(tabType) {
  const milestonesListWrapper = document.getElementById("milestones-list-wrapper");
  const badgesListWrapper = document.getElementById("badges-list-wrapper");
  const achievementsMilestonesBtn = document.getElementById("achievements-milestones-btn");
  const achievementsBadgesBtn = document.getElementById("achievements-badges-btn");
  const achievementsCardTitle = document.getElementById("achievements-card-title");

  if (tabType === 'milestones') {
    if (milestonesListWrapper) milestonesListWrapper.style.display = "block";
    if (badgesListWrapper) badgesListWrapper.style.display = "none";
    if (achievementsMilestonesBtn) achievementsMilestonesBtn.classList.add("active");
    if (achievementsBadgesBtn) achievementsBadgesBtn.classList.remove("active");
    if (achievementsCardTitle) achievementsCardTitle.textContent = "Milestones";
  } else {
    if (milestonesListWrapper) milestonesListWrapper.style.display = "none";
    if (badgesListWrapper) badgesListWrapper.style.display = "block";
    if (achievementsMilestonesBtn) achievementsMilestonesBtn.classList.remove("active");
    if (achievementsBadgesBtn) achievementsBadgesBtn.classList.add("active");
    if (achievementsCardTitle) achievementsCardTitle.textContent = "Achievements";
  }
}

export function toggleDyslexiaFont() {
  const isDyslexia = document.body.classList.toggle("dyslexia-font");
  localStorage.setItem("cineskills_dyslexia_font", isDyslexia ? "true" : "false");
  const btnText = document.getElementById("dyslexia-btn-text");
  if (btnText) btnText.textContent = isDyslexia ? "Standard Font" : "Dyslexia Font";
}



export function setMatrixLayout(mode) {
  currentState.matrixLayout = mode;
  localStorage.setItem("cineskills_matrix_layout", mode);
  renderSkillMatrix();
}

export function checkBackupMilestones(pct) {
  if (!currentState.selectedStudent) return;
  const milestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const storageKey = `cineskills_notified_milestones_${currentState.selectedStudent}`;
  const savedMilestonesRaw = localStorage.getItem(storageKey);
  let notifiedMilestones = [];
  if (savedMilestonesRaw) {
    try { notifiedMilestones = JSON.parse(savedMilestonesRaw); } catch (e) {}
  }
  
  let updated = false;
  milestones.forEach(m => {
    if (pct >= m && !notifiedMilestones.includes(m)) {
      notifiedMilestones.push(m);
      updated = true;
      if (!currentState.isInitialLoad) showBackupRecommendationToast(m);
    }
  });
  if (updated) localStorage.setItem(storageKey, JSON.stringify(notifiedMilestones));
}

export function showBackupRecommendationToast(milestone) {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "notification-toast backup-toast";
  toast.style.borderColor = "var(--color-pending)";
  toast.innerHTML = `
    <div class="toast-icon">💾</div>
    <div class="toast-content">
      <div class="toast-title" style="color: var(--color-pending);">Milestone Reached! (${milestone}%)</div>
      <div class="toast-desc" style="margin-bottom: 4px;">You've mastered a major block of skills. Export a JSON backup to protect your progress.</div>
      <button type="button" class="btn-utility" style="margin-top: 8px; width: 100%; justify-content: center; background: rgba(245, 158, 11, 0.08); border-color: var(--color-pending); color: var(--color-pending);" onclick="exportData()">
        📥 Export JSON Backup
      </button>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("fade-out"), 9500);
  setTimeout(() => toast.remove(), 10000);
}

export function confirmResetProgress() {
  const dropdown = document.getElementById("settings-dropdown");
  if (dropdown) dropdown.classList.remove("active");
  const modal = document.getElementById("reset-confirm-modal");
  if (modal) modal.classList.add("active");
}

export function closeResetModal() {
  const modal = document.getElementById("reset-confirm-modal");
  if (modal) modal.classList.remove("active");
}

export function executeResetProgress() {
  if (!currentState.selectedStudent) return;
  const studentId = currentState.selectedStudent;
  localStorage.removeItem(`cineskills_progress_${studentId}`);
  localStorage.removeItem(`cineskills_history_${studentId}`);
  localStorage.removeItem(`cineskills_unlocked_achievements_${studentId}`);
  localStorage.removeItem(`cineskills_notified_milestones_${studentId}`);
  localStorage.removeItem(`cineskills_portfolio_bio_${studentId}`);
  localStorage.removeItem(`cineskills_portfolio_showreel_${studentId}`);
  localStorage.removeItem(`cineskills_portfolio_projects_${studentId}`);
  localStorage.removeItem(`cineskills_gear_bookings_${studentId}`);
  
  closeResetModal();
  loadStudentProgress(studentId);
  renderGearView();
  renderProfileView();
  renderInspirationView();
}

export function triggerAlanSmitheeMode() {
  currentState.isAlanSmithee = true;
  const loginOverlay = document.getElementById("login-overlay");
  if (loginOverlay) loginOverlay.classList.remove("active");
  
  new Audio("https://upload.wikimedia.org/wikipedia/commons/d/d7/Wilhelm_Scream.ogg").play().catch(() => {});
  
  const activeStudentDisplay = document.getElementById("active-student-display");
  if (activeStudentDisplay) activeStudentDisplay.innerHTML = "🎬 <strong>Alan Smithee</strong> (DISOWNED)";
  
  updateDashboard();
}

export function updateStudentHeader() {
  if (!currentState.selectedStudent) return;
  const studentId = currentState.selectedStudent;
  const activeStudentName = getActiveStudentName();
  const emoji = localStorage.getItem(`cineskills_emoji_${studentId}`) || "👤";
  
  const activeStudentDisplay = document.getElementById("active-student-display");
  if (activeStudentDisplay) activeStudentDisplay.textContent = `${emoji} ${activeStudentName}`;
}

export function toggleEmojiPicker(event) {
  event.stopPropagation();
  const popover = document.getElementById("emoji-picker-popover");
  if (popover) popover.classList.toggle("active");
}

export function selectProfileEmoji(emoji) {
  if (!currentState.selectedStudent) return;
  localStorage.setItem(`cineskills_emoji_${currentState.selectedStudent}`, emoji);
  const popover = document.getElementById("emoji-picker-popover");
  if (popover) popover.classList.remove("active");
  updateStudentHeader();
}

// Bind all functions to window for direct inline HTML handlers
window.switchView = switchView;
window.switchChart = switchChart;
window.switchAchievementsTab = switchAchievementsTab;
window.toggleSettingsMenu = toggleSettingsMenu;
window.toggleTheme = toggleTheme;
window.selectTheme = selectTheme;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.toggleDyslexiaFont = toggleDyslexiaFont;
window.openLoginOverlay = openLoginOverlay;
window.closeLoginOverlay = closeLoginOverlay;
window.handleLogin = handleLogin;
window.setMatrixLayout = setMatrixLayout;
window.toggleTierSection = toggleTierSection;
window.cycleSkillLevel = (e, catId, skillName) => cycleSkillLevel(e, catId, skillName, updateDashboard);
window.openSkillDetail = openSkillDetail;
window.setModalCompetencyLevel = (level) => setModalCompetencyLevel(level, updateDashboard);
window.handleNotesInput = handleNotesInput;
window.closeModal = closeModal;
window.exportPDF = exportPDF;
window.confirmResetProgress = confirmResetProgress;
window.closeResetModal = closeResetModal;
window.executeResetProgress = executeResetProgress;
window.savePortfolioBio = savePortfolioBio;
window.updateShowreel = updateShowreel;
window.openAddProjectModal = openAddProjectModal;
window.closeAddProjectModal = closeAddProjectModal;
window.handleAddProjectSubmit = handleAddProjectSubmit;
window.deletePortfolioProject = deletePortfolioProject;
window.downloadCertificate = downloadCertificate;
window.startMicroQuiz = () => {
  const skill = window.activeSkillRef || null;
  startMicroQuiz(skill);
};
window.nextQuizStep = () => nextQuizStep(updateDashboard);
window.applyQuizRecommendation = (level) => applyQuizRecommendation(level, updateDashboard);
window.claimQuestReward = (id) => claimQuestReward(id, updateDashboard);
window.toggleEmojiPicker = toggleEmojiPicker;
window.selectProfileEmoji = selectProfileEmoji;
window.openTeacherDashboardModal = openTeacherDashboardModal;
window.configureCloudSyncPrompt = configureCloudSyncPrompt;
window.syncProgressToCloud = syncProgressToCloud;

window.promptInstallPWA = function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      }
      deferredPrompt = null;
      const btn = document.getElementById('pwa-install-btn');
      if (btn) btn.style.display = 'none';
    });
  } else {
    alert("To install CineSkills on iOS, Android, or Windows:\n\n1. Tap your browser menu or share icon (⬆️)\n2. Select 'Add to Home Screen' or 'Install App'.");
  }
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = 'flex';
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
