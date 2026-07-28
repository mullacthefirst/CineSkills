// State management, constants, and persistence helpers for CineGrade

export const TIER_NAMES = { 1: "Beginner", 2: "Intermediate", 3: "Master" };

export let currentState = {
  selectedStudent: "",
  progress: {}, // maps skillName -> { level: 0/1/2, notes: "" }
  expandedTiers: {}, // maps rowId -> boolean
  searchQuery: "",
  filterStatus: "all",
  filterTier: "all",
  isInitialLoad: true,
  matrixLayout: localStorage.getItem("cinegrade_matrix_layout") || "grid",
  isAlanSmithee: false
};

// Gamification Ranks (Famous Directors)
export const FILM_RANKS = [
  { threshold: 0, title: "Runner", director: "Alan Smithee", emoji: "🎬" },
  { threshold: 10, title: "Guerrilla Director", director: "Ava DuVernay", emoji: "🎥" },
  { threshold: 25, title: "Visual Stylist", director: "Wong Kar-wai", emoji: "🎨" },
  { threshold: 45, title: "Auteur Director", director: "Greta Gerwig", emoji: "📝" },
  { threshold: 60, title: "Master of Suspense", director: "Alfred Hitchcock", emoji: "🎭" },
  { threshold: 75, title: "Grand Visionary", director: "Christopher Nolan", emoji: "⌛" },
  { threshold: 90, title: "Blockbuster Legend", director: "Steven Spielberg", emoji: "🦖" },
  { threshold: 100, title: "Perfectionist Master", director: "Stanley Kubrick", emoji: "👁️" }
];

// Gamification Archetype Specialties
export const ARCHETYPES = {
  "camera-lighting": { title: "Director of Photography", emoji: "🎥", desc: "Master of camera framing, composition, exposure, and lighting design." },
  "research-story": { title: "Screenwriter", emoji: "✍️", desc: "Developing strong concepts, narrative structures, characters, and themes." },
  "management-pre-production": { title: "Line Producer / First AD", emoji: "📋", desc: "Commanding schedules, location scouting, risk mitigations, and set logistics." },
  "audio-post-production": { title: "Sound Designer / Mixer", emoji: "🎙️", desc: "Capturing field dialogue, field mixing, ambient effects, and audio polish." },
  "camera-post-production": { title: "Editor & Colorist", emoji: "🎞️", desc: "Assembling raw clips, normalising loudness, and grading primary color logs." },
  "management-professional-practice": { title: "Production Manager", emoji: "💼", desc: "Managing freelance invoices, council agreements, CVs, and welfare." },
  "camera-story": { title: "Director / Auteur", emoji: "🎬", desc: "Fusing screenplays, character motivations, and camera blocking styles." },
  "camera-technician": { title: "Camera Assistant / AC", emoji: "🎥", desc: "Expert in camera rigging, lens calibration, sensor cleaning, and focus pulling." },
  "lighting-technician": { title: "Chief Lighting Technician / Spark", emoji: "💡", desc: "Expert in C-stand rigging safety, electrical loads, and fixtures maintenance." },
  "audio-technician": { title: "Sound Assistant", emoji: "🎙️", desc: "Expert in lavalier rigging, gain staging, and boom handling." },
  "post-production-technician": { title: "Digital Imaging Technician / DIT", emoji: "🎞️", desc: "Managing EditShare client networks, media spaces, transcoding, and server backups." },

  "story": { title: "Storyteller", emoji: "📖", desc: "Focused on concept development, screenplays, and thematic subtext." },
  "pre-production": { title: "Production Designer", emoji: "📋", desc: "Focused on storyboards, production schedules, and art direction." },
  "camera": { title: "Camera Operator", emoji: "🎥", desc: "Focused on lenses, composition rules, manual focus, and exposure balances." },
  "lighting": { title: "Gaffer / Rigging Lead", emoji: "💡", desc: "Focused on 3-point lighting setups, Kelvin values, and set safety." },
  "audio": { title: "Location Sound Recordist", emoji: "🎙️", desc: "Focused on lavalier rigging, gain staging, and boom handling." },
  "post-production": { title: "Post-Production Editor", emoji: "🎞️", desc: "Focused on timeline pacing, transitions, and master exports." },
  "management": { title: "Production Coordinator", emoji: "🎬", desc: "Focused on paperwork, funding pitches, and festival strategies." },
  "professional-practice": { title: "Freelance Practitioner", emoji: "💼", desc: "Focused on invoicing, day rates, networking, and contract law." },
  "research": { title: "Media Critic / Analyst", emoji: "📚", desc: "Focused on film movements, case studies, and original theories." },
  "technician": { title: "Media Technician", emoji: "🛠️", desc: "Focused on equipment maintenance, electrical safety, hardware repair, and system calibration." }
};

export function getDirectorRank(pct) {
  if (currentState.isAlanSmithee) {
    return {
      current: { threshold: 0, title: "Disowned Director", director: "Alan Smithee", emoji: "🎬" },
      next: null
    };
  }
  let current = FILM_RANKS[0];
  let next = null;
  for (let i = 0; i < FILM_RANKS.length; i++) {
    if (pct >= FILM_RANKS[i].threshold) {
      current = FILM_RANKS[i];
      next = FILM_RANKS[i + 1] || null;
    }
  }
  return { current, next };
}

export function calculateArchetype(categoryStats, overallPct) {
  if (currentState.isAlanSmithee) {
    return {
      title: "Anonymous Filmmaker",
      emoji: "👥",
      desc: "This project has been disowned due to creative differences with the studio."
    };
  }
  if (overallPct < 5) {
    return {
      title: "Unspecialized Crew",
      emoji: "🙋‍♂️",
      desc: "Begin completing tasks and cycling understanding levels to unlock your filmmaker archetype."
    };
  }

  const sorted = Object.keys(categoryStats)
    .map(catId => ({
      id: catId,
      pct: categoryStats[catId].totalXp > 0 ? (categoryStats[catId].earnedXp / categoryStats[catId].totalXp) * 100 : 0
    }))
    .sort((a, b) => b.pct - a.pct);

  if (sorted[0].pct === 0) {
    return {
      title: "Unspecialized Crew",
      emoji: "🙋‍♂️",
      desc: "Begin completing tasks and cycling understanding levels to unlock your filmmaker archetype."
    };
  }

  const topPairKey = [sorted[0].id, sorted[1].id].sort().join("-");
  if (ARCHETYPES[topPairKey]) {
    return ARCHETYPES[topPairKey];
  }

  const topCatId = sorted[0].id;
  if (ARCHETYPES[topCatId]) {
    return ARCHETYPES[topCatId];
  }

  return {
    title: "All-Round Filmmaker",
    emoji: "🌟",
    desc: "A versatile crew member maintaining a highly balanced skill profile across the board."
  };
}

export function saveStudentProgress() {
  const localKey = `cinegrade_progress_${currentState.selectedStudent}`;
  localStorage.setItem(localKey, JSON.stringify(currentState.progress));
  if (typeof window.syncProgressToCloud === 'function') {
    window.syncProgressToCloud();
  }
}
