import { create } from 'zustand';
import { FamilyMember } from './useFamilyStore';

interface AuthState {
  isAuthenticated: boolean;
  currentMember: FamilyMember | null;
  login: (member: FamilyMember) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  currentMember: null,
  login: (member) => set({ isAuthenticated: true, currentMember: member }),
  logout: () => set({ isAuthenticated: false, currentMember: null }),
}));
