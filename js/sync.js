// CineGrade Cloud Sync & Teacher Dashboard System (Supabase / Free Tier Sync)
import { currentState, saveStudentProgress } from './state.js';

// Default Classroom Supabase Credentials (Pre-configured by Lecturer)
export const DEFAULT_SUPABASE_URL = "https://xronqdapgcqezmwrwdap.supabase.co";
export const DEFAULT_SUPABASE_KEY = "sb_publishable_sAwlb2pRYhg8ffYhMFDrEA_eyO_S8_4";

let SUPABASE_URL = localStorage.getItem("cinegrade_supabase_url") || DEFAULT_SUPABASE_URL;
let SUPABASE_KEY = localStorage.getItem("cinegrade_supabase_key") || DEFAULT_SUPABASE_KEY;
let supabaseClient = null;

export function initSupabase() {
  let storedUrl = localStorage.getItem("cinegrade_supabase_url") || localStorage.getItem("cineskills_supabase_url");
  let storedKey = localStorage.getItem("cinegrade_supabase_key") || localStorage.getItem("cineskills_supabase_key");

  if (storedUrl) {
    storedUrl = storedUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
    if (storedUrl.includes("rest/v1") || storedUrl.includes("/rest")) {
      storedUrl = DEFAULT_SUPABASE_URL;
    }
  }

  SUPABASE_URL = storedUrl || DEFAULT_SUPABASE_URL;
  SUPABASE_KEY = storedKey || DEFAULT_SUPABASE_KEY;

  // Overwrite broken local storage entries with clean URL
  localStorage.setItem("cinegrade_supabase_url", SUPABASE_URL);
  localStorage.setItem("cineskills_supabase_url", SUPABASE_URL);
  localStorage.setItem("cinegrade_supabase_key", SUPABASE_KEY);
  localStorage.setItem("cineskills_supabase_key", SUPABASE_KEY);

  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log("[Cloud Sync] Supabase client initialized with URL:", SUPABASE_URL);
    } catch (e) {
      console.warn("[Cloud Sync] Failed to initialize Supabase client", e);
    }
  }
}

let syncDebounceTimer = null;

// Sync progress to cloud database (Debounced to prevent notification spam)
export function syncProgressToCloud() {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  updateCloudSyncStatusIndicator("saving");

  syncDebounceTimer = setTimeout(async () => {
    if (!supabaseClient) {
      initSupabase();
    }

    const studentId = currentState.selectedStudent;
    if (!studentId || !supabaseClient) {
      updateCloudSyncStatusIndicator("offline");
      return;
    }

    const studentName = sessionStorage.getItem("cinegrade_active_student_name") || "Student";
    const progress = currentState.progress || {};

    let earnedXp = 0;
    let masteredCount = 0;
    if (window.CINEGRADE_DATABASE && window.CINEGRADE_DATABASE.categories) {
      window.CINEGRADE_DATABASE.categories.forEach(cat => {
        cat.skills.forEach(skill => {
          const state = progress[skill.name];
          if (state && state.level === 2) {
            earnedXp += skill.xp;
            masteredCount++;
          } else if (state && state.level === 1) {
            earnedXp += skill.xp * 0.5;
          }
        });
      });
    }

    try {
      let { data, error } = await supabaseClient
        .from('cineskills_student_progress')
        .upsert({
          student_id: studentId,
          student_name: studentName,
          progress_json: progress,
          xp: earnedXp,
          mastered_count: masteredCount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' });

      if (error && error.message.includes('relation "cineskills_student_progress" does not exist')) {
        // Fallback to legacy cinegrade_student_progress table
        const res = await supabaseClient
          .from('cinegrade_student_progress')
          .upsert({
            student_id: studentId,
            student_name: studentName,
            progress_json: progress,
            xp: earnedXp,
            mastered_count: masteredCount,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id' });
        error = res.error;
      }

      if (error) {
        console.error("[Cloud Sync] Database error during sync:", error.message, error.details || "");
        updateCloudSyncStatusIndicator("error", error.message);
      } else {
        console.log("[Cloud Sync] Progress synced to cloud successfully for:", studentName);
        updateCloudSyncStatusIndicator("synced");
      }
    } catch (err) {
      console.error("[Cloud Sync] Exception during cloud sync:", err);
      updateCloudSyncStatusIndicator("error", err.message || "Network exception");
    }
  }, 1200); // 1.2 second debounce
}

// Pull progress from cloud database
export async function pullProgressFromCloud(studentId) {
  if (!studentId || !supabaseClient) return null;

  try {
    let { data, error } = await supabaseClient
      .from('cineskills_student_progress')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      const res = await supabaseClient
        .from('cinegrade_student_progress')
        .select('*')
        .eq('student_id', studentId)
        .single();
      data = res.data;
    }

    if (data && data.progress_json) {
      console.log("[Cloud Sync] Pulled student progress from cloud!");
      return data.progress_json;
    }
  } catch (err) {
    console.warn("[Cloud Sync] Unable to pull cloud data:", err);
  }
  return null;
}

// Educator / Teacher Overview Dashboard
export async function fetchTeacherClassroomData() {
  if (!supabaseClient) {
    return getLocalTeacherClassroomData();
  }

  try {
    let { data, error } = await supabaseClient
      .from('cineskills_student_progress')
      .select('*')
      .order('xp', { ascending: false });

    if (error) {
      const res = await supabaseClient
        .from('cinegrade_student_progress')
        .select('*')
        .order('xp', { ascending: false });
      data = res.data;
    }
      .order('xp', { ascending: false });

    if (data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("[Teacher Mode] Cloud data unavailable, using local session records:", err);
  }

  return getLocalTeacherClassroomData();
}

function getLocalTeacherClassroomData() {
  const studentsList = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("cinegrade_progress_")) {
      const studentId = key.replace("cinegrade_progress_", "");
      try {
        const progress = JSON.parse(localStorage.getItem(key)) || {};

        let studentName = studentId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        if (studentId === currentState.selectedStudent) {
          studentName = sessionStorage.getItem("cinegrade_active_student_name") || studentName;
        }

        let xp = 0;
        let mastered = 0;
        CINEGRADE_DATABASE.categories.forEach(cat => {
          cat.skills.forEach(s => {
            if (progress[s.name] && progress[s.name].level === 2) {
              xp += s.xp;
              mastered++;
            } else if (progress[s.name] && progress[s.name].level === 1) {
              xp += s.xp * 0.5;
            }
          });
        });

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
    const studentName = sessionStorage.getItem("cinegrade_active_student_name") || "Callum";
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

// Quiet Cloud Status Indicator in Navbar (Replaces intrusive Toast popups)
export function updateCloudSyncStatusIndicator(status, details = "") {
  let badge = document.getElementById("cloud-sync-status-badge");
  if (!badge) {
    const parent = document.querySelector(".nav-controls");
    if (parent) {
      badge = document.createElement("span");
      badge.id = "cloud-sync-status-badge";
      badge.style.fontSize = "0.75rem";
      badge.style.padding = "4px 10px";
      badge.style.borderRadius = "12px";
      badge.style.transition = "all 0.3s ease";
      badge.style.display = "inline-flex";
      badge.style.alignItems = "center";
      badge.style.gap = "4px";
      badge.style.marginLeft = "4px";
      parent.insertBefore(badge, parent.firstChild);
    }
  }

  if (!badge) return;

  if (status === "saving") {
    badge.innerHTML = "☁️ <em>Saving...</em>";
    badge.style.background = "rgba(59, 130, 246, 0.15)";
    badge.style.color = "var(--accent-blue)";
    badge.style.opacity = "1";
    badge.title = "Saving student progress to cloud...";
  } else if (status === "synced") {
    badge.innerHTML = "☁️ <strong>Synced</strong>";
    badge.style.background = "rgba(16, 185, 129, 0.15)";
    badge.style.color = "var(--color-completed)";
    badge.style.opacity = "1";
    badge.title = "Student progress synced to cloud";
    setTimeout(() => {
      badge.style.opacity = "0.5";
    }, 2000);
  } else if (status === "offline") {
    badge.innerHTML = "📱 Offline";
    badge.style.background = "rgba(255, 255, 255, 0.05)";
    badge.style.color = "var(--text-muted)";
    badge.style.opacity = "0.6";
    badge.title = "Operating in local storage mode";
  } else if (status === "error") {
    badge.innerHTML = "⚠️ Sync Error";
    badge.style.background = "rgba(239, 68, 68, 0.15)";
    badge.style.color = "var(--color-locked)";
    badge.style.opacity = "1";
    badge.title = details ? `Sync Error: ${details}` : "Click Settings -> Educator View -> Cloud Setup to verify API key & RLS table policy";
  }
}

// Render Teacher / Educator Dashboard Modal
export async function openTeacherDashboardModal() {
  const storedPin = localStorage.getItem("cinegrade_teacher_pin") || "1234";
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
          <p class="login-subtitle" style="margin: 4px 0 0 0;">Real-time student progress matrix & class competency leaderboard.</p>
        </div>
        <button class="btn-utility" style="font-size: 0.8rem;" onclick="configureCloudSyncPrompt()">⚙️ Cloud Setup</button>
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
    bodyEl.innerHTML = `<div style="text-align: center; padding: 32px; color: var(--text-muted);">No student records found.</div>`;
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

  const totalPossibleXp = 2400; // 120 skills * average XP

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

export function configureCloudSyncPrompt() {
  const currentUrl = localStorage.getItem("cinegrade_supabase_url") || "";
  const currentKey = localStorage.getItem("cinegrade_supabase_key") || "";
  const currentPin = localStorage.getItem("cinegrade_teacher_pin") || "1234";

  const pin = prompt("Set your Educator Passcode (Default: 1234):", currentPin);
  if (pin === null) return;
  const url = prompt("Enter your free Supabase Project URL (or leave blank to use Local/PWA mode):", currentUrl);
  if (url === null) return;
  const key = prompt("Enter your free Supabase Anon Key:", currentKey);
  if (key === null) return;

  localStorage.setItem("cinegrade_teacher_pin", pin.trim() || "1234");
  localStorage.setItem("cinegrade_supabase_url", url.trim());
  localStorage.setItem("cinegrade_supabase_key", key.trim());

  SUPABASE_URL = url.trim();
  SUPABASE_KEY = key.trim();
  initSupabase();
  syncProgressToCloud();

  alert("Educator settings updated! Your passcode and cloud sync parameters have been saved.");
}
