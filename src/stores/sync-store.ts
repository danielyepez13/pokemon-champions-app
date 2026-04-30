import { create } from 'zustand';
import { SyncOrchestrator, syncEvents } from '../services/sync-orchestrator';

interface SyncState {
  status: 'idle' | 'syncing' | 'done' | 'error';
  phase: 'items' | 'pokeapi' | 'pikalytics' | null;
  progress: { current: number; total: number };
  error: string | null;
  startSync: () => Promise<void>;
}


export const useSyncStore = create<SyncState>((set) => {
  // Listen to orchestrator events
  syncEvents.on('progress', (data) => {
    console.log(`[SyncStore] Progress: ${data.phase} (${data.current}/${data.total})`);
    set({ 
      status: 'syncing', 
      phase: data.phase, 
      progress: { current: data.current, total: data.total } 
    });
  });

  syncEvents.on('complete', () => {
    console.log('[SyncStore] Sync complete.');
    set({ status: 'done', phase: null });
  });

  syncEvents.on('error', (message) => {
    console.error(`[SyncStore] Sync error: ${message}`);
    set({ status: 'error', error: message });
  });

  return {
    status: 'idle',
    phase: null,
    progress: { current: 0, total: 0 },
    error: null,
    startSync: async () => {
      console.log('[SyncStore] Triggering startSync...');
      set({ status: 'syncing', error: null });
      await SyncOrchestrator.startSync();
    },
  };
});
