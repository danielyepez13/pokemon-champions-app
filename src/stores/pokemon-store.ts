import { create } from 'zustand';
import { Pokemon, Stats } from '../models/pokemon';
import { PokemonDAO } from '../database/dao/pokemon.dao';

interface PokemonFilters {
  search: string;
  types: string[];
  statMin: Partial<Stats>;
  statMax: Partial<Stats>;
}

interface PokemonState {
  pokemons: Pokemon[];
  filteredPokemons: Pokemon[];
  isLoading: boolean;
  filters: PokemonFilters;

  loadPokemons: () => Promise<void>;
  setSearch: (query: string) => void;
  toggleTypeFilter: (type: string) => void;
  clearFilters: () => void;
  applyFilters: () => void;
}

export const usePokemonStore = create<PokemonState>((set, get) => ({
  pokemons: [],
  filteredPokemons: [],
  isLoading: false,
  filters: {
    search: '',
    types: [],
    statMin: {},
    statMax: {},
  },

  loadPokemons: async () => {
    set({ isLoading: true });
    const all = await PokemonDAO.getAll();
    set({ pokemons: all, filteredPokemons: all, isLoading: false });
  },

  setSearch: (query: string) => {
    set((state) => ({ filters: { ...state.filters, search: query } }));
    get().applyFilters();
  },

  toggleTypeFilter: (type: string) => {
    set((state) => {
      const types = state.filters.types.includes(type)
        ? state.filters.types.filter((t) => t !== type)
        : [...state.filters.types, type];
      return { filters: { ...state.filters, types } };
    });
    get().applyFilters();
  },

  clearFilters: () => {
    set((state) => ({
      filters: { search: '', types: [], statMin: {}, statMax: {} },
      filteredPokemons: state.pokemons,
    }));
  },

  applyFilters: async () => {
    const { pokemons, filters } = get();
    
    // If there is a search query, we might want to use the DAO's FTS search
    if (filters.search.length > 2) {
      const results = await PokemonDAO.search(filters.search);
      // Further filter by type if needed
      const typeFiltered = filters.types.length > 0 
        ? results.filter(p => filters.types.every(t => p.types.includes(t)))
        : results;
      set({ filteredPokemons: typeFiltered });
      return;
    }

    // Default local filtering for types
    const filtered = pokemons.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesTypes = filters.types.length === 0 || filters.types.every((t) => p.types.includes(t));
      return matchesSearch && matchesTypes;
    });

    set({ filteredPokemons: filtered });
  },
}));
