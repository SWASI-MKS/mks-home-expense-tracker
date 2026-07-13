import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useFamilyStore, FamilyMember } from '@/stores/useFamilyStore';
import { sanitizeForFirestore } from '@/utils/firestoreUtils';

export const authService = {
  getFamilyCode: () => {
    return useFamilyStore.getState().familyCode;
  },

  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  },

  verifyPassword: async (member: FamilyMember, password: string): Promise<boolean> => {
    console.log("Starting verification...");
    const familyCode = authService.getFamilyCode();
    if (!familyCode) {
      throw new Error("No family code found.");
    }

    console.log("Reading Firestore...");
    const docRef = doc(db, `families/${familyCode}/members`, member);
    
    // Timeout wrapper for Firestore request
    const getDocPromise = getDoc(docRef);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firestore request timed out after 10 seconds.')), 10000);
    });

    const docSnap = await Promise.race([getDocPromise, timeoutPromise]) as any;

    const inputHash = await authService.hashPassword(password);

    if (docSnap.exists()) {
      console.log("Member document found");
      const data = docSnap.data();
      if (data.passwordHash) {
        const isMatch = data.passwordHash === inputHash;
        if (isMatch) console.log("Password verified");
        return isMatch;
      }
    }

    // First login or missing hash
    const defaultHash = await authService.hashPassword('7869');
    if (inputHash === defaultHash) {
      console.log("Password verified"); // Using default
      // Set default hash but with timeout
      const sanitizedDefault = sanitizeForFirestore({ passwordHash: defaultHash });
      const setDocPromise = setDoc(docRef, sanitizedDefault, { merge: true });
      const setDocTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firestore write timed out after 10 seconds.')), 10000);
      });
      await Promise.race([setDocPromise, setDocTimeout]);
      return true;
    }

    return false;
  },

  changePassword: async (member: FamilyMember, currentPassword: string, newPassword: string): Promise<boolean> => {
    const familyCode = authService.getFamilyCode();
    if (!familyCode) return false;

    const isCurrentValid = await authService.verifyPassword(member, currentPassword);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect.');
    }

    const docRef = doc(db, `families/${familyCode}/members`, member);
    const newHash = await authService.hashPassword(newPassword);

    const sanitizedNew = sanitizeForFirestore({ passwordHash: newHash });
    await setDoc(docRef, sanitizedNew, { merge: true });
    return true;
  }
};
