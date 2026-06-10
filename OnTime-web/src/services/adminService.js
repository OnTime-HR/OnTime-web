// src/services/adminService.js
import { auth } from './firebase';
import { updateEmail, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

/**
 * Re-authenticates the current admin user if their session has expired
 * @param {string} currentPassword 
 */
const reauthenticateAdmin = async (currentPassword) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No active administrative session found.");
  
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  return await reauthenticateWithCredential(user, credential);
};

/**
 * Handles security updates for the authenticated administrator's credentials
 */
export const updateAdminProfileData = async (newName, newEmail, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized access configuration.");

  // 1. Update Display Name (Never requires re-authentication)
  if (newName && newName !== user.displayName) {
    await updateProfile(user, { displayName: newName });
  }

  // 2. Handle sensitive data alterations (Email / Password)
  if ((newEmail && newEmail !== user.email) || newPassword) {
    // Prompt for the current password to bypass the security wall if needed
    const verificationPassword = prompt("For security purposes, please re-enter your CURRENT administrative password to commit these credential changes:");
    
    if (!verificationPassword) {
      throw new Error("Profile credential updates canceled: Verification password is required.");
    }

    // Force re-authentication against Firebase identity tokens
    await reauthenticateAdmin(verificationPassword);

    // Commit Email update
    if (newEmail && newEmail !== user.email) {
      await updateEmail(user, newEmail);
    }

    // Commit Password update
    if (newPassword) {
      await updatePassword(user, newPassword);
    }
  }
};