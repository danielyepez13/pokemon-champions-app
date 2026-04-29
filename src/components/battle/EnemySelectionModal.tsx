/**
 * EnemySelectionModal
 *
 * A fast, keyboard-first Pokémon picker optimized for the
 * 80-second battle preparation window.
 * Opens with auto-focused text input and filters local DB in real-time.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Modal,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  View as RNView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Image } from 'expo-image';
import { Pokemon } from '@/src/models/pokemon';
import { PokemonDAO } from '@/src/database/dao/pokemon.dao';
import { resolvePokemonSprite } from '@/src/utils/team-sprite-resolver';

interface Props {
  visible: boolean;
  slotIndex: number;
  onSelect: (pokemon: Pokemon) => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  fire: '#FF6B35', water: '#4A9EDB', grass: '#4CAF50', electric: '#F9CA24',
  ice: '#A8D8EA', fighting: '#C0392B', poison: '#8E44AD', ground: '#D4AC0D',
  flying: '#7FDBFF', psychic: '#E91E8C', bug: '#8BC34A', rock: '#9E9E9E',
  ghost: '#7B1FA2', dragon: '#3F51B5', dark: '#546E7A', steel: '#78909C',
  fairy: '#F48FB1', normal: '#6D6D6D',
};

export function EnemySelectionModal({ visible, slotIndex, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pokemon[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [visible]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const found = await PokemonDAO.search(text);
        setResults(found.slice(0, 20));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 150);
  }, []);

  const handleSelect = useCallback((pokemon: Pokemon) => {
    onSelect(pokemon);
    onClose();
  }, [onSelect, onClose]);

  const renderItem = useCallback(({ item }: { item: Pokemon }) => {
    const sprite = resolvePokemonSprite(item.dexNumber, item.form ?? '', item.spriteDefault);
    const primaryType = item.types[0]?.toLowerCase() ?? 'normal';
    const typeColor = TYPE_COLORS[primaryType] ?? '#6D6D6D';

    return (
      <Pressable
        style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
        onPress={() => handleSelect(item)}
      >
        <RNView style={[styles.resultSprite, { borderColor: typeColor + '44' }]}>
          {sprite ? (
            <Image source={sprite} style={{ width: 40, height: 40 }} contentFit="contain" />
          ) : (
            <RNView style={styles.noSprite} />
          )}
        </RNView>
        <RNView style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.name}</Text>
          <RNView style={styles.resultTypes}>
            {item.types.map(t => (
              <RNView
                key={t}
                style={[styles.typePill, { backgroundColor: (TYPE_COLORS[t.toLowerCase()] ?? '#6D6D6D') + '30' }]}
              >
                <Text style={[styles.typePillText, { color: TYPE_COLORS[t.toLowerCase()] ?? '#6D6D6D' }]}>
                  {t.toUpperCase()}
                </Text>
              </RNView>
            ))}
          </RNView>
        </RNView>
        <Text style={styles.dexNumber}>#{String(item.dexNumber).padStart(3, '0')}</Text>
      </Pressable>
    );
  }, [handleSelect]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <RNView style={styles.sheet}>
        {/* Header */}
        <RNView style={styles.header}>
          <Text style={styles.headerTitle}>
            Slot {slotIndex + 1} — Select enemy
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </RNView>

        {/* Search Input */}
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Type name..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {/* Results */}
        {searching ? (
          <RNView style={styles.centered}>
            <ActivityIndicator color="#d4af37" />
          </RNView>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              query.length >= 2 ? (
                <RNView style={styles.centered}>
                  <Text style={styles.emptyText}>No results for "{query}"</Text>
                </RNView>
              ) : (
                <RNView style={styles.centered}>
                  <Text style={styles.emptyText}>Type at least 2 letters</Text>
                </RNView>
              )
            }
          />
        )}
      </RNView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    maxHeight: '75%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: {
    color: '#d4af37',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
  },
  searchInput: {
    margin: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
  },
  resultsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 10,
  },
  resultItemPressed: {
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  resultSprite: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSprite: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 3,
  },
  resultTypes: {
    flexDirection: 'row',
    gap: 4,
  },
  typePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typePillText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dexNumber: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontWeight: '600',
  },
  centered: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
  },
});
