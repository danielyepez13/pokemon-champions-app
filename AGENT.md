# AGENT.md — personal3 (Pokémon Competitive App)

## Descripción
App móvil **React Native + Expo** para gestión competitiva de Pokémon (VGC). Permite consultar Pokédex, gestionar equipos importados desde formato **Pokémon Showdown / Pokepaste**, y revisar objetos competitivos. Datos persistidos en **SQLite local** con sincronización desde **PokeAPI** y metadatos competitivos desde **Pikalytics**. Incorpora un **Battle Preview Engine** para análisis táctico en tiempo real.

## Stack Técnico
- **Framework:** Expo SDK 54, React Native 0.81
- **Navegación:** expo-router (file-based routing)
- **Lenguaje:** TypeScript ~5.9
- **Base de datos:** expo-sqlite (con FTS5 para búsqueda)
- **Estado global:** Zustand
- **HTTP:** axios + axios-rate-limit
- **Scraping:** cheerio (para Serebii)
- **Animaciones:** react-native-reanimated, react-native-gesture-handler
- **UI:** react-native-safe-area-context, expo-image, @expo/vector-icons

## Estructura del Proyecto

```
personal3/
├── app/                          # expo-router (file-based routing)
│   ├── _layout.tsx               # Root layout + init DB
│   ├── (tabs)/                   # Tab navigation
│   │   ├── _layout.tsx           # 4 tabs: Pokedex, Teams, Items, Battle
│   │   ├── index.tsx             # Pokedex screen
│   │   ├── teams.tsx             # Teams list + import modal
│   │   ├── items.tsx             # Items list + sync modal
│   │   └── battle.tsx            # Battle Preview (Heatmap, Alertas, etc.)
│   ├── pokemon/[id].tsx          # Pokemon detail screen
│   ├── team-detail.tsx           # Team detail / edit screen
│   └── settings.tsx              # Settings screen
├── src/
│   ├── components/               # UI components reutilizables
│   │   └── battle/               # Componentes Battle Preview (HeatmapMatrix, TacticalAlerts, EnemySelectionModal)
│   ├── config/                   # Constantes (DB name, PIKALYTICS_AI_BASE_URL, etc.)
│   ├── database/
│   │   ├── database.ts           # initDatabase, resetDatabase, getDatabase
│   │   └── dao/                  # Data Access Objects
│   │       ├── pokemon.dao.ts    # CRUD pokemon, items, abilities, moves
│   │       ├── team.dao.ts       # CRUD teams, team_members, member_moves
│   │       ├── meta-usage.dao.ts # CRUD meta_usage (Pikalytics)
│   │       ├── ability.dao.ts
│   │       ├── item.dao.ts
│   │       ├── move.dao.ts
│   │       └── sync.dao.ts       # Sync logging
│   ├── models/
│   │   ├── pokemon.ts            # Pokemon, Stats, Ability, Move, Item
│   │   └── item.ts               # Item (standalone)
│   ├── services/
│   │   ├── pokeapi-service.ts    # Fetch data from PokeAPI
│   │   ├── pikalytics-service.ts # Fetch meta data desde Pikalytics AI (markdown)
│   │   ├── pokepaste-parser.ts   # Parse Pokémon Showdown paste format
│   │   ├── serebii-scraper.ts    # Scraping de Serebii (cheerio)
│   │   ├── sync-orchestrator.ts  # Orquesta sync completa (items + pokemon + pikalytics)
│   │   └── team-service.ts       # Importa pokepaste → DB
│   ├── stores/
│   │   ├── pokemon-store.ts      # Zustand: pokemons, filteredPokemons, loadPokemons
│   │   ├── battle-store.ts       # Zustand: enemyTeam, heatmap, speedComparisons, alerts
│   │   └── sync-store.ts         # Zustand: sync status, progress, phase
│   ├── hooks/                    # Custom React hooks
│   └── utils/                    # Utilidades (sprite resolver, listas champions)
│       ├── battle-analysis.ts    # Motor de cálculo táctico (Heatmap, Speed Tiers, Alertas)
│       ├── type-chart.ts         # Tabla de tipos y perfiles defensivos
│       ├── stat-calculator.ts    # Cálculo de stats (max 32 EVs Champions)
│       ├── meta-flags.ts         # Etiquetas de movimientos y habilidades (speed_control, etc.)
│       └── team-sprite-resolver.ts
├── assets/                       # Imágenes, fuentes, iconos
├── constants/                    # Colores, temas
├── pokemon-champions.txt         # Lista base de Pokémon a sincronizar
└── pokemon-items.txt             # Lista base de objetos competitivos
```

## Base de Datos (SQLite)

### Tablas principales
| Tabla | Propósito |
|-------|-----------|
| `pokemon` | Datos base: dex_number, name, form, stats, height, weight, sprites, is_mega |
| `pokemon_types` | Relación pokemon ↔ tipos (slot 1, 2) |
| `abilities` | Habilidades con descripción |
| `pokemon_abilities` | Relación pokemon ↔ habilidades (is_hidden) |
| `moves` | Movimientos: type, category, power, accuracy, pp, effect |
| `pokemon_moves` | Relación pokemon ↔ movimientos (method: level-up, egg, etc.) |
| `items` | Objetos: name, category, effect, sprite_url |
| `pokemon_items` | Relación pokemon ↔ items |
| `teams` | Equipos del usuario: name, is_active, created_at |
| `team_members` | Miembros del equipo: pokemon_id, item_id, ability_id, nature, evs, ivs, level, slot, team_order |
| `member_moves` | Movimientos de cada miembro del equipo |
| `meta_usage` | Datos Pikalytics por Pokémon: type (move/ability/item), name, usage_pct (>15%) |
| `sync_log` | Historial de sincronizaciones |
| `pokemon_fts` | FTS5 virtual table para búsqueda full-text |

### Migraciones
- Columnas `description`, `form`, `is_mega` añadidas dinámicamente a `pokemon`
- Columna `team_order` añadida a `team_members` (backfilled desde `slot`)
- Tabla `meta_usage` añadida con borrado en cascada
- `resetDatabase()` **preserva** datos de equipos (son datos del usuario)

## Servicios Clave

### SyncOrchestrator
- **Fase 1:** Sincroniza items desde `CHAMPIONS_ITEMS_LIST`
- **Fase 2:** Enriquece Pokémon desde PokeAPI (stats, species, types, sprites)
- **Fase 3:** Sincroniza meta-uso desde Pikalytics (solo retiene items/moves/abilities >15%)
- Emite eventos `progress`, `complete`, `error` via `EventEmitter`
- Soporta `cleanSync()` (dropea DB menos teams antes de sincronizar)
- Sprite resolver: genera sufijos por forma (-m mega, -a alola, -g galar, -w wash, -h heat, etc.)

### Battle Preview Engine (`src/utils`)
- **`battle-analysis.ts`**: Lógica core del Battle Preview. Genera matriz de matchups, compara Speed Tiers (detectando posibles Choice Scarf) y produce Alertas Tácticas.
- **`type-chart.ts`**: Calculadora de ventajas y efectividad de tipos.
- **`stat-calculator.ts`**: Lógica de cálculo de estadísticas (basado en el límite de **32 EVs** del formato Champions).
- **`meta-flags.ts`**: Sistema de etiquetado (flags) para detectar automáticamente *speed control*, *redirection*, climas y terrenos.

### PokepasteParser
Parsea formato Pokémon Showdown:
```
Nickname (Species) (M/F) @ Item
Ability: AbilityName
Level: 50
EVs: 252 HP / 252 Atk / 4 Spe
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
Nature
- Move1
- Move2
- Move3
- Move4
```
Soporta: nicknames, gender, EVs, IVs, nature, moves, items, abilities.

### TeamService
- `importFromPokepaste(name, text)`: parsea → resuelve Pokémon/Items/Abilities/Moves en DB → guarda team + members
- Crea stubs de moves si no existen en DB
- Almacena nombres raw de items/abilities no encontrados como fallback

## Stores (Zustand)

### battle-store
- Maneja la UI de la pantalla de Batalla.
- Carga el equipo activo del usuario.
- Mantiene los 6 slots del equipo rival (`enemyTeam`).
- Recalcula reactivamente `heatmap`, `speedComparisons` y `alerts` al detectar cambios.

### pokemon-store
- `pokemons`: lista completa
- `filteredPokemons`: lista filtrada (búsqueda)
- `isLoading`: estado de carga
- `loadPokemons()`: carga desde DB

### sync-store
- `status`: 'idle' | 'syncing' | 'complete' | 'error'
- `progress`: { current, total }
- `phase`: 'items' | 'pokeapi' | 'pikalytics'
- `startSync()`: inicia sincronización

## Convenciones de Código
- **Imports:** usar alias `@/` para rutas absolutas (`@/src/...`, `@/components/...`)
- **Componentes UI:** `components/Themed.tsx` provee `Text` y `View` con tema automático
- **Colores:** `constants/Colors.ts` con soporte light/dark
- **Tema visual:** fondo oscuro `#050505`, acentos dorados `#d4af37`
- **DAOs:** patrón Data Access Object con métodos estáticos (upsert, getAll, getByName, etc.)
- **Sprites:** se resuelven via `resolvePokemonSprite()` usando dex number + form

## Scripts
```bash
npm run start       # Expo dev server
npm run android     # Start + Android
npm run ios         # Start + iOS
npm run web         # Start + Web
```

## Notas Importantes
- Los **equipos son datos del usuario** y sobreviven a `resetDatabase()`
- El motor de stats usa **32 EVs máximos** por stat, no 252 (formato Champions).
- La UI del Battle Preview se basa en **teclado auto-enfocado** para que la introducción de rivales sea inmediata.
- FTS5 puede no estar disponible en todos los entornos; se maneja con try/catch
- Los moves se crean como **stubs** si no existen durante el import
- Items/abilities no resueltos se guardan como **raw text** en `team_members`
- La sync usa listas predefinidas (`pokemon-champions.txt`, `pokemon-items.txt`) como fuente maestra
