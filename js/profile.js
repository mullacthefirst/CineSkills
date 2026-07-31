// Student Profile view controller, portfolio projects, export/import JSON and PDF
import { currentState, TIER_NAMES, FILM_RANKS, getDirectorRank, calculateArchetype } from './state.js';
import { drawRadarChart, drawTimelineChart } from './charts.js';
import { renderAchievements, getQuestBonusXp } from './quests.js';

export function savePortfolioBio() {
  const studentId = currentState.selectedStudent || "callum_oco26000271";
  const bioKey = `cineskills_portfolio_bio_${studentId}`;
  const portfolioBio = document.getElementById("portfolio-bio");
  if (portfolioBio) {
    const bioVal = portfolioBio.value;
    localStorage.setItem(bioKey, bioVal);
  }
}

export function updateShowreel() {
  const studentId = currentState.selectedStudent || "callum_oco26000271";
  const showreelKey = `cineskills_portfolio_showreel_${studentId}`;
  const showreelUrlInput = document.getElementById("showreel-url");
  if (showreelUrlInput) {
    const urlVal = showreelUrlInput.value.trim();
    localStorage.setItem(showreelKey, urlVal);
    renderShowreelPlayer(urlVal);
  }
}

export function renderShowreelPlayer(url) {
  const container = document.getElementById("showreel-player-container");
  if (!container) return;
  
  if (!url) {
    container.innerHTML = `
      <div class="showreel-placeholder">
        <div class="showreel-placeholder-icon">🎬</div>
        <p>No showreel linked yet. Enter a YouTube or Vimeo link above to showcase your reel.</p>
      </div>
    `;
    return;
  }
  
  let embedUrl = "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else {
      const parts = url.split("v=");
      if (parts[1]) videoId = parts[1].split("&")[0];
    }
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes("vimeo.com")) {
    const parts = url.split("vimeo.com/");
    let videoId = parts[1];
    if (videoId) {
      videoId = videoId.split("?")[0].split("#")[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
  }
  
  if (embedUrl) {
    container.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border-radius: 12px; aspect-ratio: 16/9;"></iframe>`;
  } else {
    container.innerHTML = `
      <div class="showreel-placeholder" style="color: var(--color-locked);">
        <div class="showreel-placeholder-icon">⚠️</div>
        <p>Invalid video URL. Please paste a standard YouTube or Vimeo link.</p>
      </div>
    `;
  }
}

export function renderProjectsList() {
  const studentId = currentState.selectedStudent || "callum_oco26000271";
  const key = `cineskills_portfolio_projects_${studentId}`;
  const projects = JSON.parse(localStorage.getItem(key) || "[]");
  
  const projCountEl = document.getElementById("dossier-projects-count");
  if (projCountEl) {
    projCountEl.textContent = projects.length;
  }
  
  const list = document.getElementById("portfolio-projects-list");
  if (!list) return;
  list.innerHTML = "";
  
  if (projects.length === 0) {
    list.innerHTML = `
      <div class="showreel-placeholder">
        <div class="showreel-placeholder-icon">📂</div>
        <p>Your production portfolio is empty. Click "+ Add Project" to document your work.</p>
      </div>
    `;
    return;
  }
  
  projects.forEach(proj => {
    const skillsHtml = proj.skills.map(skillName => {
      const isMastered = currentState.progress[skillName] && currentState.progress[skillName].level === 2;
      return `<span class="project-skill-badge ${isMastered ? 'verified' : 'unverified'}">
        ${isMastered ? '✓' : '⧗'} ${skillName}
      </span>`;
    }).join("");
    
    const linkHtml = proj.url ? `<a href="${proj.url}" target="_blank" class="project-link-badge">🔗 View Project</a>` : "";
    
    const itemHtml = `
      <div class="portfolio-project-item">
        <div class="project-item-header">
          <div class="project-title-row">
            <span style="font-size: 1.25rem;">🎬</span>
            <h4 style="font-size: 1.05rem; font-weight: 600;">${proj.title}</h4>
          </div>
          <button class="project-delete-btn" onclick="deletePortfolioProject('${proj.id}')" title="Delete project">&times;</button>
        </div>
        <p class="project-desc">${proj.description}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          ${linkHtml}
          <span style="font-size: 0.7rem; color: var(--text-muted);">Added: ${new Date(proj.createdAt).toLocaleDateString()}</span>
        </div>
        
        <div class="project-skills-tagged">
          <span class="project-skills-title">Demonstrated Skills</span>
          <div class="project-skills-flex">
            ${skillsHtml}
          </div>
        </div>
      </div>
    `;
    list.innerHTML += itemHtml;
  });
}

export function deletePortfolioProject(projId) {
  if (!confirm("Are you sure you want to delete this project?")) return;
  
  const studentId = currentState.selectedStudent || "callum_oco26000271";
  const key = `cineskills_portfolio_projects_${studentId}`;
  let projects = JSON.parse(localStorage.getItem(key) || "[]");
  projects = projects.filter(p => p.id !== projId);
  localStorage.setItem(key, JSON.stringify(projects));
  
  renderProfileView();
}

export function openAddProjectModal() {
  const selectGrid = document.getElementById("project-skills-select");
  if (selectGrid) {
    selectGrid.innerHTML = "";
    window.CINESKILLS_DATABASE.categories.forEach(cat => {
      cat.skills.forEach(skill => {
        const id = `chk-skill-${skill.name.replace(/\s+/g, '-')}`;
        selectGrid.innerHTML += `
          <label class="skill-checkbox-label" for="${id}">
            <input type="checkbox" id="${id}" value="${skill.name}" class="skill-checkbox-input">
            <span>${cat.emoji} ${skill.name}</span>
          </label>
        `;
      });
    });
  }
  
  document.getElementById("add-project-form").reset();
  document.getElementById("add-project-modal").classList.add("active");
}

export function closeAddProjectModal() {
  document.getElementById("add-project-modal").classList.remove("active");
}

export function handleAddProjectSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("project-title").value.trim();
  const desc = document.getElementById("project-desc").value.trim();
  const url = document.getElementById("project-url").value.trim();
  const videoUrl = document.getElementById("project-video-url").value.trim();
  
  const checkedSkills = [];
  const checkboxes = document.querySelectorAll("#project-skills-select input[type='checkbox']");
  checkboxes.forEach(cb => {
    if (cb.checked) {
      checkedSkills.push(cb.value);
    }
  });
  
  const newProject = {
    id: "proj_" + Date.now(),
    title: title,
    description: desc,
    url: url,
    videoUrl: videoUrl,
    skills: checkedSkills,
    createdAt: new Date().toISOString()
  };
  
  const studentId = currentState.selectedStudent || "callum_oco26000271";
  const key = `cineskills_portfolio_projects_${studentId}`;
  const projects = JSON.parse(localStorage.getItem(key) || "[]");
  projects.push(newProject);
  localStorage.setItem(key, JSON.stringify(projects));
  
  closeAddProjectModal();
  renderProfileView();
}

export function renderProfileView() {
  const rawName = sessionStorage.getItem("cineskills_active_student_name") || localStorage.getItem("cineskills_last_student_name") || localStorage.getItem("cineskills_student_name") || "Student";
  const rawId = sessionStorage.getItem("cineskills_active_student_id") || localStorage.getItem("cineskills_last_student_id") || localStorage.getItem("cineskills_student_id") || "";
  
  const dossierStudentName = document.getElementById("dossier-student-name");
  const dossierStudentId = document.getElementById("dossier-student-id");
  const dossierProgressPct = document.getElementById("dossier-progress-pct");
  const dossierXp = document.getElementById("dossier-xp");
  const dossierMastered = document.getElementById("dossier-mastered");
  const dossierRankBadge = document.getElementById("dossier-rank-badge");
  const dossierArchetypeBadge = document.getElementById("dossier-archetype-badge");
  const milestonesList = document.getElementById("milestones-list");

  if (dossierStudentName) dossierStudentName.textContent = rawName;
  if (dossierStudentId) dossierStudentId.textContent = rawId;

  const studentId = currentState.selectedStudent || rawId;
  const emoji = localStorage.getItem(`cineskills_emoji_${studentId}`) || "🎬";
  const profilePic = document.getElementById("dossier-profile-pic");
  if (profilePic) {
    profilePic.innerHTML = `<span class="emoji-content">${emoji}</span>`;
  }

  let earnedXp = 0;
  let maxPossibleXp = 0;
  let completedCount = 0;
  let totalSkills = 0;
  const categoryStats = {};

  window.CINESKILLS_DATABASE.categories.forEach(cat => {
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

  const pct = maxPossibleXp > 0 ? Math.round((earnedXp / maxPossibleXp) * 100) : 0;
  
  if (dossierProgressPct) dossierProgressPct.textContent = `${pct}%`;
  if (dossierXp) dossierXp.textContent = `${earnedXp} / ${maxPossibleXp} XP`;
  if (dossierMastered) dossierMastered.textContent = `${completedCount} / ${totalSkills}`;

  const { current } = getDirectorRank(pct);
  if (dossierRankBadge) {
    dossierRankBadge.innerHTML = `${current.emoji} <strong>${current.title}</strong> <span style="font-weight:400; opacity:0.8;">(${current.director})</span>`;
  }
  
  const archetype = calculateArchetype(categoryStats, pct);
  if (dossierArchetypeBadge) {
    dossierArchetypeBadge.innerHTML = `${archetype.emoji} <strong>${archetype.title}</strong>`;
  }

  try { drawRadarChart(categoryStats); } catch (e) { console.error("Error drawing radar chart:", e); }
  try { drawTimelineChart(pct); } catch (e) { console.error("Error drawing timeline chart:", e); }
  renderAchievements(categoryStats);

  if (milestonesList) {
    milestonesList.innerHTML = "";
    FILM_RANKS.forEach(rank => {
      const isUnlocked = pct >= rank.threshold;
      const statusIcon = isUnlocked ? "✅" : "🔒";
      const statusClass = isUnlocked ? "unlocked" : "locked";
      milestonesList.innerHTML += `
        <div class="milestone-item ${statusClass}">
          <span class="milestone-status">${statusIcon}</span>
          <div class="milestone-details">
            <span class="milestone-title">${rank.emoji} ${rank.title} (${rank.threshold}%)</span>
            <span class="milestone-director">Director: ${rank.director}</span>
          </div>
        </div>
      `;
    });
  }

  const evidenceLogList = document.getElementById("evidence-log-list");
  if (evidenceLogList) {
    evidenceLogList.innerHTML = "";
    let hasEvidence = false;
    
    window.CINESKILLS_DATABASE.categories.forEach(cat => {
      cat.skills.forEach(skill => {
        const skillState = currentState.progress[skill.name];
        if (skillState && skillState.notes && skillState.notes.trim() !== "") {
          hasEvidence = true;
          
          let lvlText = "Do not Understand";
          let lvlClass = "status-none";
          if (skillState.level === 1) {
            lvlText = "Sort of Understand";
            lvlClass = "status-partial";
          } else if (skillState.level === 2) {
            lvlText = "Fully Understand";
            lvlClass = "status-full";
          }

          evidenceLogList.innerHTML += `
            <div class="evidence-log-item">
              <div class="evidence-log-header">
                <span class="evidence-skill-name">${skill.name}</span>
                <span class="skill-status-indicator ${lvlClass}" style="padding: 2px 8px; border-radius: 8px; font-size: 0.65rem;">
                  <span class="status-dot"></span>
                  <span class="status-text">${lvlText}</span>
                </span>
              </div>
              <div class="evidence-category-badge">${cat.emoji} ${cat.name} &bull; ${TIER_NAMES[skill.tier] || `Tier ${skill.tier}`}</div>
              <p class="evidence-notes-text">${skillState.notes.replace(/\n/g, '<br>')}</p>
            </div>
          `;
        }
      });
    });
    
    if (!hasEvidence) {
      evidenceLogList.innerHTML = `<div class="empty-evidence-message">No notes or portfolios linked yet. Open a skill in the matrix to add evidence.</div>`;
    }
  }

  const bioKey = `cineskills_portfolio_bio_${studentId}`;
  const portfolioBio = document.getElementById("portfolio-bio");
  if (portfolioBio) {
    portfolioBio.value = localStorage.getItem(bioKey) || "";
  }
  
  const showreelKey = `cineskills_portfolio_showreel_${studentId}`;
  const savedShowreel = localStorage.getItem(showreelKey) || "";
  const showreelUrlInput = document.getElementById("showreel-url");
  if (showreelUrlInput) {
    showreelUrlInput.value = savedShowreel;
  }
  renderShowreelPlayer(savedShowreel);
  renderProjectsList();
}

export function triggerImportJSON() {
  const input = document.getElementById("import-json-file-input");
  if (input) {
    input.value = "";
    input.click();
  }
}

export function exportData() {
  const studentId = currentState.selectedStudent;
  if (!studentId) {
    alert("No student session active to export.");
    return;
  }
  const studentName = sessionStorage.getItem("cineskills_active_student_name") || "Student";
  const progress = currentState.progress || {};

  const bio = localStorage.getItem(`cineskills_portfolio_bio_${studentId}`) || "";
  const showreel = localStorage.getItem(`cineskills_portfolio_showreel_${studentId}`) || "";
  const projectsRaw = localStorage.getItem(`cineskills_portfolio_projects_${studentId}`);
  const projects = projectsRaw ? JSON.parse(projectsRaw) : [];
  const gearBookingsRaw = localStorage.getItem(`cineskills_gear_bookings_${studentId}`);
  const gearBookings = gearBookingsRaw ? JSON.parse(gearBookingsRaw) : [];
  const achievementsRaw = localStorage.getItem(`cineskills_unlocked_achievements_${studentId}`);
  const achievements = achievementsRaw ? JSON.parse(achievementsRaw) : [];
  const historyRaw = localStorage.getItem(`cineskills_history_${studentId}`);
  const history = historyRaw ? JSON.parse(historyRaw) : [];
  const emoji = localStorage.getItem(`cineskills_emoji_${studentId}`) || "👤";

  const exportPayload = {
    version: "2.0",
    exportDate: new Date().toISOString(),
    studentId: studentId,
    studentName: studentName,
    emoji: emoji,
    progress: progress,
    bio: bio,
    showreel: showreel,
    projects: projects,
    gearBookings: gearBookings,
    achievements: achievements,
    history: history
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `CineSkills_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}_Backup.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importData(event, loadStudentProgressFn) {
  if (!event.target.files || !event.target.files.length) return;
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      
      if (imported.studentId && (imported.progress || imported.skills)) {
        const studentId = imported.studentId;
        const studentName = imported.studentName || "Student";
        const progress = imported.progress || imported.skills || {};

        sessionStorage.setItem("cineskills_active_student_id", studentId);
        sessionStorage.setItem("cineskills_active_student_name", studentName);
        localStorage.setItem("cineskills_last_student_id", studentId);
        localStorage.setItem("cineskills_last_student_name", studentName);
        localStorage.setItem("cineskills_student_id", studentId);
        localStorage.setItem("cineskills_student_name", studentName);

        localStorage.setItem(`cineskills_progress_${studentId}`, JSON.stringify(progress));

        if (imported.bio !== undefined) {
          localStorage.setItem(`cineskills_portfolio_bio_${studentId}`, imported.bio);
        }
        if (imported.showreel !== undefined) {
          localStorage.setItem(`cineskills_portfolio_showreel_${studentId}`, imported.showreel);
        }
        if (imported.projects !== undefined) {
          localStorage.setItem(`cineskills_portfolio_projects_${studentId}`, JSON.stringify(imported.projects));
        }
        if (imported.gearBookings !== undefined) {
          localStorage.setItem(`cineskills_gear_bookings_${studentId}`, JSON.stringify(imported.gearBookings));
        }
        if (imported.achievements !== undefined) {
          localStorage.setItem(`cineskills_unlocked_achievements_${studentId}`, JSON.stringify(imported.achievements));
        }
        if (imported.history !== undefined) {
          localStorage.setItem(`cineskills_history_${studentId}`, JSON.stringify(imported.history));
        }
        if (imported.emoji) {
          localStorage.setItem(`cineskills_emoji_${studentId}`, imported.emoji);
        }

        currentState.selectedStudent = studentId;
        
        if (typeof window.loadStudentProgress === 'function') {
          window.loadStudentProgress(studentId);
        } else if (typeof loadStudentProgressFn === 'function') {
          loadStudentProgressFn(studentId);
        }

        if (typeof window.renderProfileView === 'function') {
          window.renderProfileView();
        }

        alert(`✅ Successfully imported backup for ${studentName}!`);
      } else {
        alert("❌ Invalid CineSkills backup file format. Missing required student data.");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("❌ Failed to parse backup file. Please upload a valid CineSkills JSON backup.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

export function exportPDF() {
  const studentName = sessionStorage.getItem("cineskills_active_student_name") || "Student";
  
  let earnedXp = 0;
  let maxPossibleXp = 0;
  let completedCount = 0;
  let totalSkillsCount = 0;
  
  window.CINESKILLS_DATABASE.categories.forEach(cat => {
    cat.skills.forEach(skill => {
      maxPossibleXp += skill.xp;
      totalSkillsCount++;
      const skillState = currentState.progress[skill.name] || { level: 0 };
      const lvl = skillState.level || 0;
      if (lvl === 1) {
        earnedXp += skill.xp * 0.5;
      } else if (lvl === 2) {
        earnedXp += skill.xp;
        completedCount++;
      }
    });
  });
  
  const pct = maxPossibleXp > 0 ? Math.round((earnedXp / maxPossibleXp) * 100) : 0;
  
  let printHtml = `
    <div class="print-header">
      <div class="print-title">CineSkills Report</div>
      <div class="print-subtitle">The Creative Media Skill Tracker & Competency Record</div>
      
      <div class="print-meta-grid">
        <div class="print-meta-item"><strong>Student:</strong> ${studentName}</div>
        <div class="print-meta-item"><strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
        <div class="print-meta-item"><strong>Total Score:</strong> ${earnedXp} / ${maxPossibleXp} XP (${pct}%)</div>
        <div class="print-meta-item"><strong>Mastery Level:</strong> ${completedCount} / ${totalSkillsCount} Skills Fully Understood</div>
      </div>
    </div>
  `;
  
  window.CINESKILLS_DATABASE.categories.forEach(cat => {
    let categoryHtml = `
      <div class="print-category-section">
        <div class="print-category-header">${cat.emoji} ${cat.name}</div>
        <table class="print-table">
          <thead>
            <tr>
              <th style="width: 25%;">Skill Name</th>
              <th style="width: 10%;">Tier</th>
              <th style="width: 20%;">Understanding Level</th>
              <th style="width: 45%;">Evidence & Verification Notes</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    let hasSkills = false;
    cat.skills.forEach(skill => {
      hasSkills = true;
      const skillState = currentState.progress[skill.name] || { level: 0, notes: "" };
      const lvl = skillState.level || 0;
      
      let lvlText = "Do not Understand";
      let lvlClass = "print-level-0";
      if (lvl === 1) {
        lvlText = "Sort of Understand";
        lvlClass = "print-level-1";
      } else if (lvl === 2) {
        lvlText = "Fully Understand";
        lvlClass = "print-level-2";
      }
      
      const evidenceText = skillState.notes ? skillState.notes.replace(/\n/g, '<br>') : '<em>No evidence provided.</em>';
      
      categoryHtml += `
        <tr>
          <td><strong>${skill.name}</strong></td>
          <td>${TIER_NAMES[skill.tier] || `Tier ${skill.tier}`}</td>
          <td><span class="print-level-badge ${lvlClass}">${lvlText}</span></td>
          <td class="print-evidence">${evidenceText}</td>
        </tr>
      `;
    });
    
    categoryHtml += `
          </tbody>
        </table>
      </div>
    `;
    
    if (hasSkills) {
      printHtml += categoryHtml;
    }
  });
  
  let printContainer = document.getElementById("print-section");
  if (!printContainer) {
    printContainer = document.createElement("div");
    printContainer.id = "print-section";
    document.body.appendChild(printContainer);
  }
  
  printContainer.innerHTML = printHtml;
  window.print();
}
