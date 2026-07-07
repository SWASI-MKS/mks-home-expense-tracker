import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EditRequest } from '@/types';
import { dbService } from '@/services/firestore/dbService';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';

interface EditRequestState {
  editRequests: EditRequest[];
  addEditRequest: (request: Omit<EditRequest, 'requestId' | 'createdAt' | 'status'>) => void;
  updateEditRequest: (requestId: string, updates: Partial<EditRequest>) => void;
  deleteEditRequest: (requestId: string) => void;
  getRequestsByTransaction: (transactionId: string) => EditRequest[];
  getRequestsByOwner: (owner: string) => EditRequest[];
  getPendingRequests: () => EditRequest[];
  getRequestsForCurrentUser: () => EditRequest[];
}

export const useEditRequestStore = create<EditRequestState>()(
  persist(
    (set, get) => ({
      editRequests: [],
      
      addEditRequest: (request) => set((state) => {
        const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        console.log('[useEditRequestStore.addEditRequest] Request created! requestId=', requestId);
        
        const newRequest: EditRequest = {
          ...request,
          requestId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        console.log('[useEditRequestStore.addEditRequest] Calling dbService.save for request:', newRequest);
        dbService.save('editRequests', newRequest.requestId, newRequest);
        
        return { editRequests: [newRequest, ...state.editRequests] };
      }),
      
      updateEditRequest: (requestId, updates) => set((state) => {
        console.log('[useEditRequestStore.updateEditRequest] Called with requestId=', requestId, 'updates=', updates);
        const existing = state.editRequests.find(r => r.requestId === requestId);
        if (!existing) {
          console.log('[useEditRequestStore.updateEditRequest] Request not found, returning');
          return state;
        }
        
        const updated = { ...existing, ...updates };
        console.log('[useEditRequestStore.updateEditRequest] Updating request to:', updated);
        dbService.save('editRequests', updated.requestId, updated);
        
        // Show toast for status changes
        if (updates.status === 'approved') {
          console.log('[useEditRequestStore.updateEditRequest] Request approved!');
        } else if (updates.status === 'rejected') {
          console.log('[useEditRequestStore.updateEditRequest] Request rejected!');
        }
        
        return {
          editRequests: state.editRequests.map(r => r.requestId === requestId ? updated : r)
        };
      }),
      
      deleteEditRequest: (requestId) => set((state) => {
        console.log('[useEditRequestStore.deleteEditRequest] Called with requestId=', requestId);
        dbService.delete('editRequests', requestId);
        return {
          editRequests: state.editRequests.filter(r => r.requestId !== requestId)
        };
      }),
      
      getRequestsByTransaction: (transactionId) => {
        return get().editRequests.filter(r => r.transactionId === transactionId);
      },
      
      getRequestsByOwner: (owner) => {
        console.log('[useEditRequestStore.getRequestsByOwner] Called with owner=', owner);
        const requests = get().editRequests.filter(r => {
          const match = r.owner.trim().toLowerCase() === owner.trim().toLowerCase();
          console.log('[useEditRequestStore.getRequestsByOwner] Checking request', r.requestId, 'match:', match);
          return match;
        });
        console.log('[useEditRequestStore.getRequestsByOwner] Found requests:', requests);
        return requests;
      },
      
      getPendingRequests: () => {
        return get().editRequests.filter(r => r.status === 'pending');
      },
      
      getRequestsForCurrentUser: () => {
        const currentUser = useAuthStore.getState().currentMember;
        console.log('[useEditRequestStore.getRequestsForCurrentUser] currentUser=', currentUser);
        
        // Get requests where currentUser is owner OR requester
        const requests = get().editRequests.filter(r => {
          const isOwner = currentUser && r.owner.trim().toLowerCase() === currentUser.trim().toLowerCase();
          const isRequester = currentUser && r.requestedBy.trim().toLowerCase() === currentUser.trim().toLowerCase();
          console.log('[useEditRequestStore.getRequestsForCurrentUser] Checking request', r.requestId, 'isOwner:', isOwner, 'isRequester:', isRequester);
          return isOwner || isRequester;
        });
        
        console.log('[useEditRequestStore.getRequestsForCurrentUser] Found requests:', requests);
        return requests;
      }
    }),
    {
      name: 'expense-tracker-edit-requests',
    }
  )
);
