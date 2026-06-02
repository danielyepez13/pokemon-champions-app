import { create } from 'zustand';
import { SyncOrchestrator, syncEvents } from '../services/sync-orchestrator';

type SyncMode = 'full' | 'meta' | null;
type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';
type SyncPhase = 'pokeapi' | 'pikalytics' | null;

interface SyncState {
  status: SyncStatus;
  mode: SyncMode;
  phase: SyncPhase;
  progress: { current: number; total: number };
  error: string | null;
  startSync: () => Promise<void>;
  cleanSync: () => Promise<void>;
  syncMeta: (force?: boolean) => Promise<void>;
  resetStatus: () => void;
}

/** Tracks which operation is running so the complete handler can preserve mode for UI alerts. */
let activeMode: SyncMode = null;

export const useSyncStore = create<SyncState>((set) => {
  syncEvents.on('progress', (data) => {
    console.log(`[SyncStore] Progress: ${data.phase} (${data.current}/${data.total})`);
    set({
      status: 'syncing',
      phase: data.phase,
      progress: { current: data.current, total: data.total },
    });
  });

  syncEvents.on('complete', () => {
    console.log('[SyncStore] Sync complete.');
    set({ status: 'done', phase: null, mode: activeMode });
  });

  syncEvents.on('error', (message) => {
    console.error(`[SyncStore] Sync error: ${message}`);
    set({ status: 'error', error: message, phase: null });
  });

  return {
    status: 'idle',
    mode: null,
    phase: null,
    progress: { current: 0, total: 0 },
    error: null,

    startSync: async () => {
      console.log('[SyncStore] Triggering startSync...');
      activeMode = 'full';
      set({
        status: 'syncing',
        mode: 'full',
        error: null,
        progress: { current: 0, total: 0 },
      });
      await SyncOrchestrator.startSync();
    },

    cleanSync: async () => {
      console.log('[SyncStore] Triggering cleanSync...');
      activeMode = 'full';
      set({
        status: 'syncing',
        mode: 'full',
        error: null,
        progress: { current: 0, total: 0 },
      });
      await SyncOrchestrator.cleanSync();
    },

    syncMeta: async (force = false) => {
      console.log('[SyncStore] Triggering syncMeta...');
      activeMode = 'meta';
      set({
        status: 'syncing',
        mode: 'meta',
        error: null,
        progress: { current: 0, total: 0 },
      });
      await SyncOrchestrator.syncPikalytics(force);
    },

    resetStatus: () => {
      activeMode = null;
      set({
        status: 'idle',
        mode: null,
        phase: null,
        error: null,
        progress: { current: 0, total: 0 },
      });
    },
  };
});
