// Skills Matrix renderer and detail modal controller
import { currentState, TIER_NAMES, saveStudentProgress } from './state.js';

let activeSkillRef = null;

export function renderSkillMatrix() {
  const skillsGrid = document.getElementById("skills-grid");
  if (!skillsGrid) return;
  skillsGrid.innerHTML = "";
  const isTreeMode = currentState.matrixLayout === "tree";

  const gridBtn = document.getElementById("layout-grid-btn");
  const treeBtn = document.getElementById("layout-tree-btn");
  if (gridBtn && treeBtn) {
    if (isTreeMode) {
      gridBtn.classList.remove("active");
      treeBtn.classList.add("active");
    } else {
      gridBtn.classList.add("active");
      treeBtn.classList.remove("active");
    }
  }

  const db = window.CINESKILLS_DATABASE || (typeof CINESKILLS_DATABASE !== 'undefined' ? CINESKILLS_DATABASE : null);
  if (!db || !db.categories) return;

  db.categories.forEach(cat => {
    const filteredSkills = cat.skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(currentState.searchQuery) ||
                            skill.purpose.toLowerCase().includes(currentState.searchQuery);
      
      const skillState = currentState.progress[skill.name] || { level: 0, notes: "" };
      const level = skillState.level || 0;
      
      const matchesStatus = currentState.filterStatus === "all" ||
                            currentState.filterStatus === level.toString();
                             
      const matchesTier = currentState.filterTier === "all" ||
                          currentState.filterTier === skill.tier.toString();

      return matchesSearch && matchesStatus && matchesTier;
    });

    if (filteredSkills.length === 0) return;

    const catSection = document.createElement("div");
    catSection.className = "category-section glass-panel category-" + cat.id + (isTreeMode ? " tree-layout-active" : "");
    
    let bodyHtml = "";
    
    if (isTreeMode) {
      let colsHtml = ["", "", ""];
      
      [1, 2, 3].forEach(t => {
        const tierSkills = filteredSkills.filter(s => s.tier === t);
        
        let tierCardsHtml = "";
        tierSkills.forEach(skill => {
          const skillState = currentState.progress[skill.name] || { level: 0, notes: "" };
          const level = skillState.level || 0;
          
          let statusIndicatorClass = "status-none";
          let levelText = "Do not Understand";
          let earnedXpVal = 0;
          if (level === 1) {
            statusIndicatorClass = "status-partial";
            levelText = "Sort of Understand";
            earnedXpVal = skill.xp * 0.5;
          } else if (level === 2) {
            statusIndicatorClass = "status-full";
            levelText = "Fully Understand";
            earnedXpVal = skill.xp;
          }
          
          tierCardsHtml += `
            <div class="skill-card glass-card hover-trigger" data-skill-name="${skill.name}" onclick="openSkillDetail('${cat.id}', '${skill.name}')">
              <div class="skill-header">
                <div class="skill-status-indicator ${statusIndicatorClass}" onclick="cycleSkillLevel(event, '${cat.id}', '${skill.name}')" title="Click to cycle understanding level">
                  <span class="status-dot"></span>
                  <span class="status-text">${levelText}</span>
                </div>
                <span class="skill-xp">${earnedXpVal}/${skill.xp} XP</span>
              </div>
              <h5 class="skill-name">${skill.name}</h5>
              <p class="skill-desc-preview">${skill.purpose.substring(0, 75)}${skill.purpose.length > 75 ? "..." : ""}</p>
            </div>
          `;
        });
        
        colsHtml[t-1] = `
          <div class="tree-subsection">
            <h4 class="tier-title" style="margin-bottom: 16px;">${TIER_NAMES[t]} (${t * 10} XP)</h4>
            <div class="skills-column" style="display: flex; flex-direction: column; gap: 16px;">
              ${tierCardsHtml || `<div class="skill-desc-preview" style="text-align: center; opacity: 0.5; padding: 16px;">No skills match filters.</div>`}
            </div>
          </div>
        `;
      });
      
      bodyHtml = `
        <svg class="tree-connections-svg" id="svg-${cat.id}"></svg>
        <div class="category-body tree-layout">
          ${colsHtml.join("")}
        </div>
      `;
    } else {
      let skillsHtml = "";
      [1, 2, 3].forEach(t => {
        const tierSkills = filteredSkills.filter(s => s.tier === t);
        if (tierSkills.length === 0) return;
        
        const rowId = `${cat.id}-tier-${t}`;
        const isExpanded = currentState.expandedTiers[rowId] === true;
        const collapsedClass = isExpanded ? "" : "collapsed";
        
        skillsHtml += `
          <div class="tier-subsection">
            <div class="tier-header-row ${collapsedClass}" onclick="toggleTierSection(this, '${rowId}')">
              <h4 class="tier-title">${TIER_NAMES[t]} (${t * 10} XP)</h4>
              <span class="tier-chevron">▼</span>
            </div>
            <div id="${rowId}" class="skills-row ${collapsedClass}">
        `;
        
        tierSkills.forEach(skill => {
          const skillState = currentState.progress[skill.name] || { level: 0, notes: "" };
          const level = skillState.level || 0;
          
          let statusIndicatorClass = "status-none";
          let levelText = "Do not Understand";
          let earnedXpVal = 0;
          if (level === 1) {
            statusIndicatorClass = "status-partial";
            levelText = "Sort of Understand";
            earnedXpVal = skill.xp * 0.5;
          } else if (level === 2) {
            statusIndicatorClass = "status-full";
            levelText = "Fully Understand";
            earnedXpVal = skill.xp;
          }
          
          skillsHtml += `
            <div class="skill-card glass-card hover-trigger" onclick="openSkillDetail('${cat.id}', '${skill.name}')">
              <div class="skill-header">
                <div class="skill-status-indicator ${statusIndicatorClass}" onclick="cycleSkillLevel(event, '${cat.id}', '${skill.name}')" title="Click to cycle understanding level">
                  <span class="status-dot"></span>
                  <span class="status-text">${levelText}</span>
                </div>
                <span class="skill-xp">${earnedXpVal}/${skill.xp} XP</span>
              </div>
              <h5 class="skill-name">${skill.name}</h5>
              <p class="skill-desc-preview">${skill.purpose.substring(0, 75)}${skill.purpose.length > 75 ? "..." : ""}</p>
            </div>
          `;
        });
        
        skillsHtml += `
            </div>
          </div>
        `;
      });
      
      bodyHtml = `
        <div class="category-body">
          ${skillsHtml}
        </div>
      `;
    }

    catSection.innerHTML = `
      <div class="category-header">
        <h3>${cat.emoji} ${cat.name}</h3>
        <p class="category-desc">${cat.description}</p>
      </div>
      ${bodyHtml}
    `;
    
    skillsGrid.appendChild(catSection);
  });
}

export function toggleTierSection(headerEl, rowId) {
  const rowEl = document.getElementById(rowId);
  if (rowEl) {
    rowEl.classList.toggle("collapsed");
    headerEl.classList.toggle("collapsed");
    currentState.expandedTiers[rowId] = !rowEl.classList.contains("collapsed");
  }
}

export function cycleSkillLevel(event, categoryId, skillName, updateDashboardFn) {
  event.stopPropagation();
  
  if (!currentState.progress[skillName]) {
    currentState.progress[skillName] = { level: 0, notes: "" };
  }
  
  let currentLevel = currentState.progress[skillName].level || 0;
  let nextLevel = (currentLevel + 1) % 3;
  
  currentState.progress[skillName].level = nextLevel;
  saveStudentProgress();
  if (typeof updateDashboardFn === 'function') updateDashboardFn();
  renderSkillMatrix();
}

export function openSkillDetail(categoryId, skillName) {
  const cat = CINESKILLS_DATABASE.categories.find(c => c.id === categoryId);
  const skill = cat.skills.find(s => s.name === skillName);
  
  activeSkillRef = skill;
  const skillState = currentState.progress[skillName] || { level: 0, notes: "" };
  const level = skillState.level || 0;
  
  const startBtn = document.getElementById("start-quiz-btn");
  const questionsArea = document.getElementById("quiz-questions-area");
  const resultBox = document.getElementById("quiz-result-box");
  if (startBtn) startBtn.style.display = "block";
  if (questionsArea) questionsArea.style.display = "none";
  if (resultBox) resultBox.style.display = "none";
  
  const modalTitle = document.getElementById("modal-title");
  const modalMeta = document.getElementById("modal-meta");
  const modalPurpose = document.getElementById("modal-purpose");
  const modalChecks = document.getElementById("modal-checks");
  const detailModal = document.getElementById("detail-modal");

  if (modalTitle) modalTitle.textContent = skill.name;
  if (modalMeta) {
    modalMeta.innerHTML = `
      <span class="meta-item"><strong>Category:</strong> ${cat.name}</span>
      <span class="meta-item"><strong>Level:</strong> ${TIER_NAMES[skill.tier] || skill.tier}</span>
      <span class="meta-item"><strong>XP Value:</strong> ${skill.xp} XP</span>
    `;
  }
  
  if (modalPurpose) {
    modalPurpose.innerHTML = `
      <h6 class="section-heading">Purpose:</h6>
      <p>${skill.purpose}</p>
    `;
  }
  
  if (modalChecks) {
    modalChecks.innerHTML = `
      <h6 class="section-heading">Verification Checks:</h6>
      <ul class="checks-list">
        ${skill.checks.split(",").map(c => `<li><span class="bullet-point"></span> ${c.trim()}</li>`).join("")}
      </ul>
    `;
  }

  updateModalCompetencyButtons(level);
  
  const modalNotes = document.getElementById("modal-notes");
  if (modalNotes) modalNotes.value = skillState.notes || "";

  if (detailModal) detailModal.classList.add("active");
}

export function getActiveSkillRef() {
  return activeSkillRef;
}

export function setModalCompetencyLevel(level, updateDashboardFn) {
  if (!activeSkillRef) return;
  
  const skillName = activeSkillRef.name;
  
  if (!currentState.progress[skillName]) {
    currentState.progress[skillName] = { level: 0, notes: "" };
  }
  
  currentState.progress[skillName].level = level;
  saveStudentProgress();
  updateModalCompetencyButtons(level);
  if (typeof updateDashboardFn === 'function') updateDashboardFn();
  renderSkillMatrix();
}

export function updateModalCompetencyButtons(activeLevel) {
  const btnGroup = document.querySelector(".competency-buttons-group");
  if (!btnGroup) return;
  
  const buttons = btnGroup.querySelectorAll(".btn-competency");
  buttons.forEach((btn, idx) => {
    if (idx === activeLevel) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

export function handleNotesInput() {
  if (!activeSkillRef) return;
  
  const skillName = activeSkillRef.name;
  const notesText = document.getElementById("modal-notes").value;
  
  if (!currentState.progress[skillName]) {
    currentState.progress[skillName] = { level: 0, notes: "" };
  }
  
  currentState.progress[skillName].notes = notesText;
  saveStudentProgress();
}

export function closeModal() {
  const detailModal = document.getElementById("detail-modal");
  if (detailModal) detailModal.classList.remove("active");
  activeSkillRef = null;
}
