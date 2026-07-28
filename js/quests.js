// Daily Quests, Micro Quizzes, and Inspiration Hub
import { currentState, calculateArchetype } from './state.js';
import { setModalCompetencyLevel, closeModal } from './matrix.js';

let activeQuizQuestions = null;
let currentQuizStep = 0;

export const ACHIEVEMENT_BADGES = [
  { id: "runner_rookie", name: "Runner Rookie", emoji: "🎬", desc: "Understand any 3 skills fully.", check: (stats, progress) => {
      let count = 0;
      Object.keys(progress).forEach(name => {
        if (progress[name] && progress[name].level === 2) count++;
      });
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "story_architect", name: "Story Architect", emoji: "📖", desc: "Master 3 Story category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "story");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "safety_inspector", name: "Safety Inspector", emoji: "⚠️", desc: "Master C-Stand Safety and Tripod Safety.", check: (stats, progress) => {
      const hasCStand = progress["C-Stand Safety"] && progress["C-Stand Safety"].level === 2;
      const hasTripod = progress["Tripod Safety"] && progress["Tripod Safety"].level === 2;
      let count = (hasCStand ? 1 : 0) + (hasTripod ? 1 : 0);
      return { unlocked: count === 2, current: count, target: 2 };
    }
  },
  { id: "cinematography_lead", name: "Cinematography Lead", emoji: "🎥", desc: "Master 3 Camera category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "camera");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "gaffer_master", name: "Gaffer Master", emoji: "💡", desc: "Master 3 Lighting category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "lighting");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "sound_sage", name: "Sound Sage", emoji: "🎙️", desc: "Master 3 Audio category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "audio");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "post_prod_spec", name: "Post-Prod Specialist", emoji: "🎞️", desc: "Master 3 Post-Production category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "post-production");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "evidence_archivist", name: "Evidence Archivist", emoji: "✍️", desc: "Add evidence notes to 5 skills.", check: (stats, progress) => {
      let count = 0;
      Object.keys(progress).forEach(name => {
        if (progress[name] && progress[name].notes && progress[name].notes.trim() !== "") count++;
      });
      return { unlocked: count >= 5, current: count, target: 5 };
    }
  },
  { id: "producer_guild", name: "Producer's Guild", emoji: "📋", desc: "Master 3 Management category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "management");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "industry_ready", name: "Industry Ready", emoji: "💼", desc: "Master 3 Professional Practice skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "professional-practice");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "film_scholar", name: "Film Scholar", emoji: "📚", desc: "Master 3 Research category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "research");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "gear_wizard", name: "Gear Wizard", emoji: "🛠️", desc: "Master 3 Technician category skills.", check: (stats, progress) => {
      let count = 0;
      const cat = CINEGRADE_DATABASE.categories.find(c => c.id === "technician");
      if (cat) {
        cat.skills.forEach(s => {
          if (progress[s.name] && progress[s.name].level === 2) count++;
        });
      }
      return { unlocked: count >= 3, current: count, target: 3 };
    }
  },
  { id: "all_round_auteur", name: "All-Round Auteur", emoji: "🌟", desc: "Master at least 1 skill in all 10 categories.", check: (stats, progress) => {
      let categoriesMastered = 0;
      CINEGRADE_DATABASE.categories.forEach(cat => {
        const hasMastered = cat.skills.some(s => progress[s.name] && progress[s.name].level === 2);
        if (hasMastered) categoriesMastered++;
      });
      return { unlocked: categoriesMastered === 10, current: categoriesMastered, target: 10 };
    }
  },
  { id: "timeline_surgeon", name: "Timeline Surgeon", emoji: "✂️", desc: "Master J & L Cuts and Speed Ramping.", check: (stats, progress) => {
      const hasJLCuts = progress["J & L Cuts"] && progress["J & L Cuts"].level === 2;
      const hasSpeedRamp = progress["Speed Ramping"] && progress["Speed Ramping"].level === 2;
      let count = (hasJLCuts ? 1 : 0) + (hasSpeedRamp ? 1 : 0);
      return { unlocked: count === 2, current: count, target: 2 };
    }
  }
];

export function renderAchievements(categoryStats) {
  const listEl = document.getElementById("achievements-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  
  ACHIEVEMENT_BADGES.forEach(badge => {
    const res = badge.check(categoryStats, currentState.progress);
    const isUnlocked = res.unlocked;
    const progressText = isUnlocked ? "🏆 Unlocked" : `Progress: ${res.current} / ${res.target}`;
    const statusClass = isUnlocked ? "unlocked" : "locked";
    
    listEl.innerHTML += `
      <div class="achievement-item ${statusClass}">
        <div class="achievement-icon">${badge.emoji}</div>
        <div class="achievement-details">
          <div class="achievement-name">${badge.name}</div>
          <div class="achievement-desc">${badge.desc}</div>
          <div class="achievement-progress">${progressText}</div>
        </div>
      </div>
    `;
  });
}

// Micro Quiz System
export function generateQuiz(skill, category) {
  const allSkills = [];
  CINEGRADE_DATABASE.categories.forEach(cat => {
    if (cat.id !== category.id) {
      cat.skills.forEach(s => allSkills.push(s));
    }
  });
  
  const getRandomSkill = () => allSkills[Math.floor(Math.random() * allSkills.length)];
  const ds1 = getRandomSkill();
  const ds2 = getRandomSkill();
  
  const questions = [
    {
      q: `What is the primary objective when practicing "${skill.name}"?`,
      options: [
        { text: skill.purpose, isCorrect: true },
        { text: ds1 ? ds1.purpose : "Evaluating film theory contexts.", isCorrect: false },
        { text: ds2 ? ds2.purpose : "Organising administrative workflows.", isCorrect: false },
        { text: "Bypassing setup checks to speed up the shooting day.", isCorrect: false }
      ]
    },
    {
      q: `Which of these is a key practical check required to verify "${skill.name}"?`,
      options: [
        { text: skill.checks.split(",")[0].trim(), isCorrect: true },
        { text: ds1 ? ds1.checks.split(",")[0].trim() : "Ensure all lens caps are removed", isCorrect: false },
        { text: "Check that catering has vegetarian options", isCorrect: false },
        { text: "Confirm the film director is wearing headphones", isCorrect: false }
      ]
    },
    {
      q: `In a real-world media production scenario, how is "${skill.name}" best implemented?`,
      options: [
        { text: `By systematically ensuring you: ${skill.purpose.toLowerCase()}`, isCorrect: true },
        { text: "By ignoring standard guidelines if set logistics are tight.", isCorrect: false },
        { text: "By delegating it to an untrained actor to save crew costs.", isCorrect: false },
        { text: "By letting the editor figure it out in post-production.", isCorrect: false }
      ]
    }
  ];

  questions.forEach(q => {
    q.options = q.options
      .map(opt => ({ opt, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ opt }) => opt);
  });

  return questions;
}

export function startMicroQuiz(activeSkillRef) {
  if (!activeSkillRef) return;
  
  let activeCategory = null;
  CINEGRADE_DATABASE.categories.forEach(cat => {
    if (cat.skills.some(s => s.name === activeSkillRef.name)) {
      activeCategory = cat;
    }
  });
  
  activeQuizQuestions = generateQuiz(activeSkillRef, activeCategory);
  currentQuizStep = 0;
  
  document.getElementById("start-quiz-btn").style.display = "none";
  document.getElementById("quiz-questions-area").style.display = "block";
  document.getElementById("quiz-result-box").style.display = "none";
  
  renderQuizStep();
}

export function renderQuizStep() {
  const formEl = document.getElementById("quiz-form");
  if (!formEl || !activeQuizQuestions) return;
  
  const q = activeQuizQuestions[currentQuizStep];
  const isLast = currentQuizStep === activeQuizQuestions.length - 1;
  
  formEl.innerHTML = `
    <div class="quiz-question-item" style="opacity: 0; transform: translateY(4px); animation: stepFadeIn 0.3s ease-out forwards;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed var(--panel-border); padding-bottom: 8px;">
        <span style="font-size: 0.7rem; color: var(--accent-blue); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Question ${currentQuizStep + 1} of 3</span>
      </div>
      <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); text-align: left; line-height: 1.45;">${q.q}</p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${q.options.map((opt, optIdx) => `
          <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; cursor: pointer; padding: 10px 12px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); transition: all 0.2s ease; text-align: left; width: 100%;">
            <input type="radio" name="quiz_option" value="${optIdx}" required style="margin-top: 3px;">
            <span style="flex-grow: 1;">${opt.text}</span>
          </label>
        `).join("")}
      </div>
      
      <button type="button" class="btn-utility" style="margin-top: 18px; width: 100%; justify-content: center; background: var(--accent-blue); color: white;" onclick="nextQuizStep()">
        ${isLast ? "Submit Quiz" : "Next Question &rarr;"}
      </button>
    </div>
  `;
}

export function nextQuizStep(updateDashboardFn) {
  if (!activeQuizQuestions) return;
  
  const formEl = document.getElementById("quiz-form");
  const selectedInput = formEl.querySelector("input[name='quiz_option']:checked");
  
  if (!selectedInput) {
    alert("Please select an answer before moving forward.");
    return;
  }
  
  activeQuizQuestions[currentQuizStep].selectedAnswer = parseInt(selectedInput.value, 10);
  
  const isLast = currentQuizStep === activeQuizQuestions.length - 1;
  if (!isLast) {
    currentQuizStep++;
    renderQuizStep();
  } else {
    triggerQuizSubmit(updateDashboardFn);
  }
}

export function triggerQuizSubmit(updateDashboardFn) {
  const formEl = document.getElementById("quiz-form");
  if (!formEl) return;
  
  formEl.innerHTML = `
    <div id="quiz-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 10px; gap: 14px;">
      <div class="quiz-spinner"></div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; letter-spacing: 0.02em;">Calculating results...</p>
    </div>
  `;
  
  setTimeout(() => {
    processQuizResults(updateDashboardFn);
  }, 1000);
}

export function processQuizResults(updateDashboardFn) {
  if (!activeQuizQuestions) return;
  
  let score = 0;
  const formEl = document.getElementById("quiz-form");
  formEl.innerHTML = "";
  
  activeQuizQuestions.forEach((q, qIdx) => {
    const selectedIdx = q.selectedAnswer;
    const isCorrect = q.options[selectedIdx].isCorrect;
    if (isCorrect) score++;
    
    formEl.innerHTML += `
      <div style="margin-bottom: 14px; border-bottom: 1px dashed var(--panel-border); padding-bottom: 12px; text-align: left;">
        <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">${qIdx + 1}. ${q.q}</p>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${q.options.map((opt, optIdx) => {
            let labelStyle = "display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--panel-border); background: transparent;";
            if (opt.isCorrect) {
              labelStyle = "display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--color-completed-border); background: var(--color-completed-bg); color: var(--color-completed); font-weight: 600;";
            } else if (optIdx === selectedIdx) {
              labelStyle = "display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--color-locked-border); background: var(--color-locked-bg); color: var(--color-locked);";
            }
            return `
              <div style="${labelStyle}">
                <span>${opt.isCorrect ? "✅" : optIdx === selectedIdx ? "❌" : "&bull;"}</span>
                <span style="flex-grow: 1;">${opt.text}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  });
  
  let recLevel = 0;
  let recText = "Do not Understand";
  
  if (score === 3) {
    recLevel = 2;
    recText = "Fully Understand";
  } else if (score >= 1) {
    recLevel = 1;
    recText = "Sort of Understand";
  }
  
  const resultBox = document.getElementById("quiz-result-box");
  resultBox.innerHTML = `
    <p style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Score: ${score} / 3 Correct</p>
    <p style="font-size: 0.85rem; margin-top: 6px; color: var(--text-secondary); line-height: 1.4;">
      Suggested Level: 
      <span class="skill-status-indicator ${recLevel === 2 ? 'status-full' : recLevel === 1 ? 'status-partial' : 'status-none'}" style="padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; cursor: default; margin-left: 4px; pointer-events: none;">
        <span class="status-dot"></span>
        <span class="status-text">${recText}</span>
      </span>
    </p>
    <button type="button" class="btn-utility" style="margin-top: 14px; width: 100%; justify-content: center; background: var(--accent-blue-glow); border-color: var(--accent-blue);" onclick="applyQuizRecommendation(${recLevel})">
      Apply Recommendation
    </button>
  `;
  resultBox.style.display = "block";
}

export function applyQuizRecommendation(level, updateDashboardFn) {
  setModalCompetencyLevel(level, updateDashboardFn);
  closeModal();
}

// Daily Quests System
const QUEST_TEMPLATES = [
  { id: "quest_storyboard", title: "Storyboard Artist", emoji: "📋", skills: ["Storyboarding", "Concept Development", "Shot List Design"], desc: "Visualize the film's structure by mastering storyboarding, concepting, or shot list specs." },
  { id: "quest_audio_eng", title: "Audio Engineer", emoji: "🎙️", skills: ["Gain Staging", "Mic Placement", "Boom Pole Basics"], desc: "Ensure clean dialogue capture by mastering basic mic setups, boom operations, or gain staging." },
  { id: "quest_gaffer", title: "Lighting Gaffer", emoji: "💡", skills: ["3-Point Basics", "Shaping Light", "Contrast Ratios"], desc: "Shape the mood and atmosphere by mastering 3-point setups, flags, or contrast control." },
  { id: "quest_cam_rig", title: "Camera Tech", emoji: "🎥", skills: ["Camera Rigging", "Tripod Safety", "Lens Mechanics"], desc: "Build a solid camera platform by mastering mechanical rigging, tripod safety, or lens choices." },
  { id: "quest_editor", title: "NLE Editor", emoji: "🎞️", skills: ["File Management", "Rough Cut", "Syncing & Multi-cam"], desc: "Assemble the first narrative timeline by mastering folder organization, rough edits, or multicam sync." },
  { id: "quest_producer", title: "Producer Duties", emoji: "🎬", skills: ["Basic Scheduling", "Production Paperwork", "Crew Coordination"], desc: "Manage set logistics by mastering daily schedules, actor release forms, or crew brief assignments." },
  { id: "quest_theory", title: "Film Scholar", emoji: "📚", skills: ["Visual References", "Film History", "Comparative Analysis"], desc: "Deconstruct cinematic history and styles by mastering comparative analyses, visual references, or film movements." },
  { id: "quest_etiquette", title: "Professional Etiquette", emoji: "💼", skills: ["Set Etiquette", "Time Management", "Health & Safety"], desc: "Respect the camera crew and set safety by mastering set etiquette, call sheet schedules, or health guidelines." },
  { id: "quest_colorist", title: "Colorist Duties", emoji: "🎨", skills: ["Colour Correction", "Log Shooting", "Colour Profile Management"], desc: "Grade log profiles and align cameras by mastering primary correction, log exposure, or profile matching." },
  { id: "quest_sound_design", title: "Sound Designer", emoji: "🔊", skills: ["Sound Design & Foley", "Ambient Recording", "Signal-to-Noise"], desc: "Layer location room tones and spot effects by mastering ambient recordings, foley, or signal-to-noise ratios." }
];

function getDailySeed() {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getDailyQuests() {
  const seed = getDailySeed();
  const quests = [];
  const indices = [];
  
  let tempSeed = seed;
  while (quests.length < 3) {
    const randVal = seededRandom(tempSeed);
    const index = Math.floor(randVal * QUEST_TEMPLATES.length);
    if (!indices.includes(index)) {
      indices.push(index);
      quests.push(QUEST_TEMPLATES[index]);
    }
    tempSeed += 7;
  }
  return quests;
}

export function getQuestBonusXp() {
  if (!currentState.selectedStudent) return 0;
  const questsKey = `cinegrade_quests_${currentState.selectedStudent}`;
  try {
    const claimed = JSON.parse(localStorage.getItem(questsKey) || "[]");
    return claimed.length * 50;
  } catch (e) {
    console.error("Error reading quests data", e);
    return 0;
  }
}

export function renderQuestsView() {
  const container = document.getElementById("quests-list-container");
  const dateBadge = document.getElementById("quest-date-badge");
  if (!container) return;
  
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  if (dateBadge) {
    dateBadge.textContent = `📅 ${today.toLocaleDateString('en-GB', options)}`;
  }
  
  const dailyQuests = getDailyQuests();
  const studentId = currentState.selectedStudent;
  const questsKey = `cinegrade_quests_${studentId}`;
  
  let claimedIds = [];
  try {
    claimedIds = JSON.parse(localStorage.getItem(questsKey) || "[]");
  } catch (e) {}
  
  container.innerHTML = "";
  
  dailyQuests.forEach(quest => {
    let completedSkill = null;
    quest.skills.forEach(skillName => {
      const skillState = currentState.progress[skillName];
      if (skillState && skillState.level === 2) {
        completedSkill = skillName;
      }
    });
    
    const isCompleted = completedSkill !== null;
    const isClaimed = claimedIds.includes(quest.id);
    
    let statusClass = "";
    if (isClaimed) {
      statusClass = "status-quest-claimed";
    } else if (isCompleted) {
      statusClass = "status-quest-completed";
    }
    
    let skillsHtml = "";
    quest.skills.forEach(skillName => {
      const isThisSkillCompleted = currentState.progress[skillName] && currentState.progress[skillName].level === 2;
      const checkMark = isThisSkillCompleted ? "🟢" : "⚪";
      const itemClass = isThisSkillCompleted ? "completed" : "";
      skillsHtml += `<li class="${itemClass}"><span>${checkMark}</span> ${skillName}</li>`;
    });
    
    let footerHtml = "";
    if (isClaimed) {
      footerHtml = `<div class="quest-status-text" style="color: var(--color-completed);">✅ Quest Completed (Claimed +50 XP Bonus)</div>`;
    } else if (isCompleted) {
      footerHtml = `
        <button class="btn-status status-completed" onclick="claimQuestReward('${quest.id}')" style="box-shadow: 0 0 12px var(--color-completed-border);">
          💎 Claim +50 XP Reward
        </button>
      `;
    } else {
      footerHtml = `
        <button class="btn-utility" style="justify-content: center; width: 100%;" onclick="switchView('matrix')">
          🔍 Find Skills in Matrix
        </button>
      `;
    }
    
    const cardHtml = `
      <div class="quest-card glass-panel ${statusClass}">
        <div class="quest-card-header">
          <div class="quest-card-icon">${quest.emoji}</div>
          <div>
            <h4 class="quest-card-title">${quest.title}</h4>
            <div class="quest-reward-badge">💎 Reward: +50 XP</div>
          </div>
        </div>
        
        <div class="quest-card-body">
          <p class="quest-card-desc">${quest.desc}</p>
          <div class="quest-skills-list-container">
            <span class="quest-skills-label">Requirements (Master 1)</span>
            <ul class="quest-skills-items">
              ${skillsHtml}
            </ul>
          </div>
        </div>
        
        <div class="quest-card-footer">
          ${footerHtml}
        </div>
      </div>
    `;
    container.innerHTML += cardHtml;
  });
}

export function claimQuestReward(questId, updateDashboardFn) {
  if (!currentState.selectedStudent) return;
  const questsKey = `cinegrade_quests_${currentState.selectedStudent}`;
  
  let claimed = [];
  try {
    claimed = JSON.parse(localStorage.getItem(questsKey) || "[]");
  } catch (e) {}
  
  if (!claimed.includes(questId)) {
    claimed.push(questId);
    localStorage.setItem(questsKey, JSON.stringify(claimed));
    
    if (typeof updateDashboardFn === 'function') updateDashboardFn();
    renderQuestsView();
  }
}

// Cinematic Inspiration Hub
const CINEMATIC_DB = [
  {
    title: "Blade Runner 2049",
    director: "Denis Villeneuve",
    dp: "Roger Deakins",
    year: 2017,
    mood: "neon-noir",
    discipline: "lighting",
    skills: ["Contrast Ratios", "Colour Profile Management", "Colour Temperature"],
    analysis: "DP Roger Deakins utilised a custom-matching colour palette and high-contrast ratios to separate character silhouettes from the orange neon haze.",
    challenge: "Position a bright amber key light at 90 degrees to your subject in a dark room. Add a light blue rim light from behind."
  },
  {
    title: "Dune",
    director: "Denis Villeneuve",
    dp: "Greig Fraser",
    year: 2021,
    mood: "epic-scale",
    discipline: "camera",
    skills: ["Lens Mechanics", "Depth of Field", "Exposure Triangle"],
    analysis: "DP Greig Fraser shot Dune on large format cameras with specialised anamorphic lenses to capture massive scale.",
    challenge: "Go outside on an overcast day. Frame your subject using a telephoto lens (50mm+) from far away."
  },
  {
    title: "Euphoria",
    director: "Sam Levinson",
    dp: "Marcell Rév",
    year: 2020,
    mood: "dreamy-pastel",
    discipline: "lighting",
    skills: ["Colour Temperature", "Practical Fixtures", "Camera Movement"],
    analysis: "DP Marcell Rév mixed warm tungsten practical lamps with cool blue LED tubes, executing continuous camera movements.",
    challenge: "Place a warm practical lamp behind your subject. Illuminate their face with a soft cool key light."
  }
];

export function renderInspirationView() {
  const recommendationsDiv = document.getElementById("inspiration-recommendations");
  if (!recommendationsDiv) return;
  recommendationsDiv.innerHTML = "";
  
  const uncompletedSkills = [];
  CINEGRADE_DATABASE.categories.forEach(cat => {
    cat.skills.forEach(skill => {
      const progress = currentState.progress[skill.name];
      if (!progress || progress.level < 2) {
        uncompletedSkills.push(skill.name);
      }
    });
  });
  
  const recommendedScenes = CINEMATIC_DB.filter(scene => {
    return scene.skills.some(skillName => uncompletedSkills.includes(skillName));
  });
  
  const displayScenes = recommendedScenes.length > 0 ? recommendedScenes.slice(0, 3) : CINEMATIC_DB.slice(0, 3);
  
  displayScenes.forEach(scene => {
    const skillsHtml = scene.skills.map(skillName => {
      const isMastered = currentState.progress[skillName] && currentState.progress[skillName].level === 2;
      return `<span class="inspiration-skill-tag ${isMastered ? 'mastered' : ''}" onclick="goToSkillFromTag('${skillName}')">
        ${isMastered ? '✓' : '⧗'} ${skillName}
      </span>`;
    }).join("");
    
    const cardHtml = `
      <div class="inspiration-card">
        <div>
          <h5 class="movie-title-header">${scene.title}</h5>
          <div class="movie-meta-row">
            <span class="movie-meta-item">Dir: ${scene.director}</span>
            <span class="movie-meta-item">DP: ${scene.dp}</span>
            <span class="movie-meta-item">${scene.year}</span>
          </div>
          <p class="analysis-text">${scene.analysis}</p>
          
          <div class="challenge-box">
            <span class="challenge-title">⚡ On-Set Challenge</span>
            ${scene.challenge}
          </div>
        </div>
        
        <div class="inspiration-skills-tagged">
          <span class="inspiration-skills-title">Linked CineGrade Skills</span>
          <div class="inspiration-skills-flex">
            ${skillsHtml}
          </div>
        </div>
      </div>
    `;
    recommendationsDiv.innerHTML += cardHtml;
  });
}
