// CineSkills Local System Utilities (100% Local / Offline)
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

// Stubs for backwards compatibility (Local/Offline mode)
export function syncProgressToCloud() {}
export async function pullProgressFromCloud() { return null; }
export function updateCloudSyncStatusIndicator() {}

