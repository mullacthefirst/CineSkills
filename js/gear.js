// Gear Locker Equipment and Licensing System
import { currentState, TIER_NAMES } from './state.js';

export function getRequiredSkillsForGear(gear) {
  const catData = window.CINESKILLS_DATABASE.categories.find(c => c.id === gear.category);
  if (!catData) return [];
  return catData.skills
    .filter(s => s.tier <= gear.tier)
    .map(s => s.name);
}

export function getStudentCategoryLicense(categoryId, progress) {
  const cat = window.CINESKILLS_DATABASE.categories.find(c => c.id === categoryId);
  if (!cat) return 0;
  
  const skills = cat.skills;
  const hasMastered = (skill) => progress[skill.name] && progress[skill.name].level === 2;
  
  const t1Skills = skills.filter(s => s.tier === 1);
  const t2Skills = skills.filter(s => s.tier === 2);
  const t3Skills = skills.filter(s => s.tier === 3);
  
  const t1Mastered = t1Skills.length > 0 && t1Skills.every(hasMastered);
  const t2Mastered = t2Skills.length > 0 && t2Skills.every(hasMastered);
  const t3Mastered = t3Skills.length > 0 && t3Skills.every(hasMastered);
  
  if (t1Mastered && t2Mastered && t3Mastered) return 3;
  if (t1Mastered && t2Mastered) return 2;
  if (t1Mastered) return 1;
  return 0;
}

export function renderLicenseDashboard() {
  const dashboard = document.getElementById("license-dashboard");
  if (!dashboard) return;
  
  const categoriesToRender = [
    { id: "camera", name: "Camera & Support", emoji: "🎥" },
    { id: "audio", name: "Audio Production", emoji: "🎙️" },
    { id: "lighting", name: "Lighting & Studio", emoji: "💡" }
  ];
  
  const progress = currentState.progress || {};
  dashboard.innerHTML = "";
  
  categoriesToRender.forEach(catInfo => {
    const licenseLvl = getStudentCategoryLicense(catInfo.id, progress);
    
    const catData = window.CINESKILLS_DATABASE.categories.find(c => c.id === catInfo.id);
    let nextTierText = "";
    let pct = 0;
    
    if (catData) {
      const skills = catData.skills;
      const hasMastered = (s) => progress[s.name] && progress[s.name].level === 2;
      
      if (licenseLvl === 0) {
        const t1 = skills.filter(s => s.tier === 1);
        const mastered = t1.filter(hasMastered).length;
        pct = (mastered / t1.length) * 100;
        nextTierText = `${mastered}/${t1.length} Beginner Skills for License`;
      } else if (licenseLvl === 1) {
        const t2 = skills.filter(s => s.tier === 2);
        const mastered = t2.filter(hasMastered).length;
        pct = (mastered / t2.length) * 100;
        nextTierText = `${mastered}/${t2.length} Intermediate Skills for License`;
      } else if (licenseLvl === 2) {
        const t3 = skills.filter(s => s.tier === 3);
        const mastered = t3.filter(hasMastered).length;
        pct = (mastered / t3.length) * 100;
        nextTierText = `${mastered}/${t3.length} Master Skills for License`;
      } else {
        pct = 100;
        nextTierText = "All Skills Mastered!";
      }
    }
    
    let statusLabel = "No License";
    let statusClass = "tier-0";
    if (licenseLvl === 1) { statusLabel = "Beginner Certified"; statusClass = "tier-1"; }
    else if (licenseLvl === 2) { statusLabel = "Intermediate Certified"; statusClass = "tier-2"; }
    else if (licenseLvl === 3) { statusLabel = "Master Certified"; statusClass = "tier-3"; }
    
    const cardHtml = `
      <div class="glass-panel license-card">
        <span class="license-title">${catInfo.emoji} ${catInfo.name}</span>
        <span class="license-status ${statusClass}">${statusLabel}</span>
        <div class="license-progress-bar">
          <div class="license-progress-fill ${statusClass}" style="width: ${pct}%"></div>
        </div>
        <span class="license-progress-text">${nextTierText}</span>
      </div>
    `;
    dashboard.innerHTML += cardHtml;
  });
}

export function downloadCertificate(categoryId, tier) {
  const studentName = sessionStorage.getItem("cineskills_active_student_name") || localStorage.getItem("cineskills_last_student_name") || localStorage.getItem("cineskills_student_name") || "Student";
  const studentId = sessionStorage.getItem("cineskills_active_student_id") || localStorage.getItem("cineskills_last_student_id") || localStorage.getItem("cineskills_student_id") || "";
  
  const categoryNames = {
    camera: "Camera & Support",
    audio: "Audio Production",
    lighting: "Lighting & Studio"
  };
  const categoryName = categoryNames[categoryId] || categoryId;
  const dateString = new Date().toLocaleDateString('en-GB');
  
  const tierName = TIER_NAMES[tier] || `Tier ${tier}`;

  const printHtml = `
    <div class="certificate-print-page">
      <div class="print-certificate-container">
        <div class="certificate-header-group">
          <div class="certificate-logo">CineSkills</div>
          <div class="certificate-title">Certificate of Competency</div>
        </div>
        <div class="certificate-badge">🏆</div>
        <div>
          <div class="certificate-present">This is proudly presented to</div>
          <div class="certificate-student-name">${studentName}</div>
          ${studentId ? `<div class="certificate-student-id">Student ID: ${studentId}</div>` : ''}
        </div>
        <div class="certificate-body">
          for demonstrating outstanding technical proficiency and mastering all required practical competencies to earn the
        </div>
        <div class="certificate-license-name">${categoryName} — ${tierName} License</div>
        <div class="certificate-footer">
          <div class="certificate-date">
            <span class="value">${dateString}</span>
            <span class="label">Date Issued</span>
          </div>
          <div class="certificate-signature">
            <span class="signature-line"></span>
            <span class="label">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  `;

  let printContainer = document.getElementById("print-section");
  if (!printContainer) {
    printContainer = document.createElement("div");
    printContainer.id = "print-section";
    document.body.appendChild(printContainer);
  }
  
  document.body.classList.add("certificate-print-mode");
  printContainer.innerHTML = printHtml;
  
  window.print();
  
  document.body.classList.remove("certificate-print-mode");
}

export function renderGearView() {
  const studentId = currentState.selectedStudent || "";
  const rawName = sessionStorage.getItem("cineskills_active_student_name") || localStorage.getItem("cineskills_last_student_name") || localStorage.getItem("cineskills_student_name") || "Student";
  const rawId = sessionStorage.getItem("cineskills_active_student_id") || localStorage.getItem("cineskills_last_student_id") || localStorage.getItem("cineskills_student_id") || "";
  const activeStudentName = rawId ? `${rawName} (${rawId})` : rawName;
  const studentEmoji = localStorage.getItem(`cineskills_emoji_${studentId}`) || "🎬";
  
  const studentBadge = document.getElementById("gear-active-student");
  if (studentBadge) {
    studentBadge.textContent = `${studentEmoji} ${activeStudentName}`;
  }
  
  renderLicenseDashboard();
  
  const gearGrid = document.getElementById("gear-grid");
  if (!gearGrid) return;
  gearGrid.innerHTML = "";
  
  const gearCategories = [
    { id: "camera", name: "Camera & Support", emoji: "🎥", description: "Cinema cameras, mirrorless bodies, lenses, and support rigs." },
    { id: "audio", name: "Audio Production", emoji: "🎙️", description: "Field recorders, microphones, wireless kits, and sound gear." },
    { id: "lighting", name: "Lighting & Studio", emoji: "💡", description: "LED panels, tube lights, modifiers, and studio rigging." }
  ];
  
  const gearItems = CINEGRADE_EQUIPMENT || [];
  
  gearCategories.forEach(cat => {
    const catGear = gearItems.filter(g => g.category === cat.id);
    if (catGear.length === 0) return;
    
    const catSection = document.createElement("div");
    catSection.className = "category-section glass-panel";
    
    let skillsHtml = "";
    
    [1, 2, 3].forEach(t => {
      const tierGear = catGear.filter(g => g.tier === t);
      if (tierGear.length === 0) return;
      
      const rowId = `gear-${cat.id}-tier-${t}`;
      const isExpanded = currentState.expandedTiers[rowId] === true;
      const collapsedClass = isExpanded ? "" : "collapsed";
      
      let tierGearCardsHtml = "";
      
      tierGear.forEach(gear => {
        const requiredSkills = getRequiredSkillsForGear(gear);
        
        let masteredCount = 0;
        const reqTagsHtml = requiredSkills.map(skillName => {
          const isMastered = currentState.progress[skillName] && currentState.progress[skillName].level === 2;
          if (isMastered) masteredCount++;
          
          return `<span class="gear-req-tag ${isMastered ? 'unlocked' : 'locked'}">
            ${isMastered ? '✓' : '✗'} ${skillName}
          </span>`;
        }).join("");
        
        const licenseLvl = getStudentCategoryLicense(gear.category, currentState.progress);
        const isAuthorized = licenseLvl >= gear.tier;
        
        let licenseReqText = "";
        if (gear.tier === 1) licenseReqText = "Beginner License";
        else if (gear.tier === 2) licenseReqText = "Intermediate License";
        else if (gear.tier === 3) licenseReqText = "Master License";
        
        tierGearCardsHtml += `
          <div class="glass-panel gear-card">
            <div>
              <div class="gear-card-header">
                <span class="gear-category-badge ${gear.category}">${gear.category} (${TIER_NAMES[gear.tier]})</span>
                <span class="gear-status-indicator ${isAuthorized ? 'authorized' : 'locked'}">
                  ${isAuthorized ? '⚡ Authorized' : '🔒 Locked'}
                </span>
              </div>
              
              <div class="gear-info">
                <h3 style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                  <span>${gear.brand} ${gear.model}</span>
                </h3>
                <p style="font-size:0.75rem; font-weight:600; color:var(--text-muted); margin-bottom:8px; text-transform: uppercase;">${gear.type}</p>
                <p>${gear.description}</p>
              </div>
            </div>
            
            <div>
              <div class="gear-requirements">
                <span class="gear-req-title">Requires: ${licenseReqText} (${masteredCount}/${requiredSkills.length} skills)</span>
                <div class="gear-reqs-flex">
                  ${reqTagsHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      const licenseLvl = getStudentCategoryLicense(cat.id, currentState.progress);
      const isTierCertified = licenseLvl >= t;
      
      skillsHtml += `
        <div class="tier-subsection">
          <div class="tier-header-row ${collapsedClass}" onclick="toggleTierSection(this, '${rowId}')">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h4 class="tier-title">${TIER_NAMES[t]} Equipment</h4>
              ${isTierCertified ? `
                <button class="btn-download-cert" onclick="event.stopPropagation(); downloadCertificate('${cat.id}', ${t})" title="Download ${TIER_NAMES[t]} Certificate">
                  🎓 Download Certificate
                </button>
              ` : ''}
            </div>
            <span class="tier-chevron">▼</span>
          </div>
          <div id="${rowId}" class="skills-row ${collapsedClass}">
            ${tierGearCardsHtml}
          </div>
        </div>
      `;
    });
    
    catSection.innerHTML = `
      <div class="category-header" style="margin-bottom: 24px;">
        <h3>${cat.emoji} ${cat.name}</h3>
        <p class="category-desc">${cat.description}</p>
      </div>
      <div class="category-body">
        ${skillsHtml}
      </div>
    `;
    
    gearGrid.appendChild(catSection);
  });
}
