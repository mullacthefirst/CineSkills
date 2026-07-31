// CineSkills Local System & Teacher Dashboard (100% Local / Offline)
import { currentState } from './state.js';

// GDPR Compliance: Cryptographic SHA-256 Pseudonymization / Password Hashing Helper
export async function hashStudentId(rawId) {
  if (!rawId) return "anon_guest";
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawId.toLowerCase().trim() + "_cineskills_gdpr_salt_v1");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "anon_" + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let hash = 0;
    for (let i = 0; i < rawId.length; i++) {
      hash = ((hash << 5) - hash) + rawId.charCodeAt(i);
      hash |= 0;
    }
    return "anon_" + Math.abs(hash).toString(36);
  }
}

// Local Educator / Teacher Overview Data Aggregator
export async function fetchTeacherClassroomData() {
  return getLocalTeacherClassroomData();
}

function getLocalTeacherClassroomData() {
  const studentsList = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("cineskills_progress_")) {
      const studentId = key.replace("cineskills_progress_", "");
      try {
        const progress = JSON.parse(localStorage.getItem(key)) || {};

        let studentName = studentId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        if (studentId === currentState.selectedStudent) {
          studentName = sessionStorage.getItem("cineskills_active_student_name") || studentName;
        }

        let xp = 0;
        let mastered = 0;
        if (window.CINESKILLS_DATABASE && window.CINESKILLS_DATABASE.categories) {
          window.CINESKILLS_DATABASE.categories.forEach(cat => {
            cat.skills.forEach(s => {
              if (progress[s.name] && progress[s.name].level === 2) {
                xp += s.xp;
                mastered++;
              } else if (progress[s.name] && progress[s.name].level === 1) {
                xp += s.xp * 0.5;
              }
            });
          });
        }

        studentsList.push({
          student_id: studentId,
          student_name: studentName,
          progress_json: progress,
          xp: xp,
          mastered_count: mastered,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (studentsList.length === 0) {
    const currentStudentId = currentState.selectedStudent || "student";
    const studentName = sessionStorage.getItem("cineskills_active_student_name") || "Callum";
    studentsList.push({
      student_id: currentStudentId,
      student_name: studentName,
      progress_json: currentState.progress || {},
      xp: 0,
      mastered_count: 0,
      updated_at: new Date().toISOString()
    });
  }

  studentsList.sort((a, b) => b.xp - a.xp);
  return studentsList;
}

// Render Teacher / Educator Dashboard Modal
export async function openTeacherDashboardModal() {
  const storedPin = localStorage.getItem("cineskills_teacher_pin") || "1234";
  const inputPin = prompt("🔒 Educator Security Check:\nPlease enter the Educator Passcode to view class records (Default: 1234):");

  if (inputPin === null) return;
  if (inputPin.trim() !== storedPin) {
    alert("❌ Invalid Educator Passcode. Access denied.");
    return;
  }

  let modal = document.getElementById("teacher-dashboard-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "teacher-dashboard-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 850px; width: 90%;">
      <button class="close-btn" onclick="document.getElementById('teacher-dashboard-modal').classList.remove('active')">&times;</button>
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--panel-border); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 class="login-title" style="margin:0;">👩‍🏫 Educator Class Overview</h2>
          <p class="login-subtitle" style="margin: 4px 0 0 0;">Local student progress matrix & class competency leaderboard.</p>
        </div>
      </div>

      <div id="teacher-modal-body" style="max-height: 450px; overflow-y: auto;">
        <div style="text-align: center; padding: 24px; color: var(--text-secondary);">Loading student data...</div>
      </div>
    </div>
  `;

  modal.classList.add("active");

  const studentsData = await fetchTeacherClassroomData();
  const bodyEl = document.getElementById("teacher-modal-body");

  if (!studentsData || studentsData.length === 0) {
    bodyEl.innerHTML = `<div style="text-align: center; padding: 32px; color: var(--text-muted);">No student records found on this device.</div>`;
    return;
  }

  let tableHtml = `
    <table class="print-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
      <thead>
        <tr style="border-bottom: 1px solid var(--panel-border); text-align: left;">
          <th style="padding: 10px;">Student Name</th>
          <th style="padding: 10px;">XP Earned</th>
          <th style="padding: 10px;">Mastered Skills</th>
          <th style="padding: 10px;">Completion %</th>
          <th style="padding: 10px;">Last Active</th>
        </tr>
      </thead>
      <tbody>
  `;

  const totalPossibleXp = 2400;

  studentsData.forEach((st, idx) => {
    const pct = Math.round((st.xp / totalPossibleXp) * 100);
    const dateStr = st.updated_at ? new Date(st.updated_at).toLocaleDateString() : "Today";

    tableHtml += `
      <tr style="border-bottom: 1px dashed var(--panel-border);">
        <td style="padding: 10px; font-weight: 600; color: var(--text-primary);">
          ${idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : ""}${st.student_name}
        </td>
        <td style="padding: 10px; color: var(--accent-blue); font-weight: 700;">${st.xp} XP</td>
        <td style="padding: 10px;">${st.mastered_count} / 120</td>
        <td style="padding: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="progress-track-mini" style="flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
              <div class="progress-bar-mini" style="width: ${pct}%; height: 100%; background: var(--color-completed);"></div>
            </div>
            <span>${pct}%</span>
          </div>
        </td>
        <td style="padding: 10px; color: var(--text-muted); font-size: 0.75rem;">${dateStr}</td>
      </tr>
    `;
  });

  tableHtml += `</tbody></table>`;
  bodyEl.innerHTML = tableHtml;
}

// Stubs for backwards compatibility (Local/Offline mode)
export function syncProgressToCloud() {}
export async function pullProgressFromCloud() { return null; }
export function updateCloudSyncStatusIndicator() {}

