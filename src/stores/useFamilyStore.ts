import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const VALID_MEMBERS = ['Dad', 'Mom', 'Shruti', 'Swasi'] as const;
export type FamilyMember = typeof VALID_MEMBERS[number];

interface FamilyStoreState {
  familyCode: string;
  displayName: FamilyMember | null;
  setDisplayName: (name: FamilyMember | null) => void;
  validateDisplayName: () => void;
}

export const useFamilyStore = create<FamilyStoreState>()(
  persist(
    (set, get) => ({
      familyCode: 'MKS-FAMILY',
      displayName: null,
      
      setDisplayName: (name: FamilyMember | null) => {
        if (name === null || VALID_MEMBERS.includes(name)) {
          set({ displayName: name });
        }
      },

      validateDisplayName: () => {
        const currentName = get().displayName;
        if (currentName !== null && !VALID_MEMBERS.includes(currentName as FamilyMember)) {
          set({ displayName: null });
        }
      }
    }),
    {
      name: 'expense-tracker-family',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Immediately validate after hydration
          state.validateDisplayName();
        }
      }
    }
  )
);
