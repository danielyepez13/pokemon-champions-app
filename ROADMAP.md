# Hoja de Ruta (Roadmap) - Pokémon Competitive App

Este documento describe las fases de desarrollo del proyecto. Las Fases 1 a 3 ya han sido implementadas, por lo que el enfoque actual está en las Fases 4 y 5.

---

## ✅ Fases Completadas

### Fase 1: Motor Base y Tabla de Tipos
- Creación de la base de datos de tipos.
- Cálculo de multiplicadores de daño (debilidades y resistencias).
- Lógica de cálculo de estadísticas con límite de 32 EVs (formato Champions).

### Fase 2: Sincronización de Metadatos (Pikalytics)
- Extracción de datos meta usando Jina AI (`r.jina.ai/pikalytics...`).
- Persistencia en SQLite (`meta_usage`) de objetos, habilidades y movimientos con uso > 15%.
- Etiquetas tácticas (meta-flags) para identificar *speed control*, clima, etc.

### Fase 3: Interfaz de Battle Preview
- Pantalla interactiva que carga el equipo activo y permite ingresar los 6 Pokémon rivales.
- Búsqueda rápida optimizada (teclado auto-enfocado).
- **Heatmap Matrix:** Visualización 6x6 de ventajas de tipos.
- **Alertas Tácticas:** Avisos dinámicos en tiempo real basados en los datos de la Fase 2 y los meta-flags.

---

## 🚀 Fases Pendientes

### Fase 4: Reconocimiento de "Top Teams" (Arquetipos Meta)
**Objetivo:** Identificar el equipo rival como un arquetipo conocido del meta para revelar sus configuraciones exactas (sets), no para predecir compañeros.

1. **Extracción de Top Teams:**
   - Crear un endpoint/scraper usando Jina AI para `https://www.pikalytics.com/topteams/championstournaments`.
   - Extraer las composiciones de los equipos más exitosos, incluyendo los objetos, habilidades y movimientos específicos que usan **juntos**.
2. **Sistema de Reconocimiento (Pattern Matching):**
   - Cuando el usuario ingresa los 6 Pokémon del rival en el Battle Preview, el sistema compara esa combinación contra la base de datos de Top Teams.
   - Si coincide (ej. coinciden 5 o 6 Pokémon), la app asume que se trata de ese arquetipo o una variante.
3. **Revelación de Sets Exactos:**
   - En lugar de mostrar "el Pokémon X suele usar el objeto Y en un 40% de los casos", la app dirá: *"Este es el equipo de [Jugador/Arquetipo], su Pokémon X lleva este objeto exacto y estos ataques"*.
   - Permitirá al jugador conocer la estrategia general del equipo contrario (quién es el support, quién es el atacante especial, etc.) de antemano.

### Fase 5: Bandas de Velocidad (Speed Tiers)
**Objetivo:** Refinar la toma de decisiones basada en métricas exactas del formato.

1. **Integración de Speed Tiers:**
   - Extraer datos de `https://www.pikalytics.com/speed-tiers`.
   - Visualizar una barra o lista ordenada donde el usuario pueda ver exactamente dónde se ubican sus Pokémon respecto al equipo rival (ej. "Su Pokémon X con Choice Scarf llega a 210 de velocidad, superando a tu Pokémon Y por 2 puntos").
   - Mostrar un acordeón resumen en la pestaña de Battle Preview y una lista completa en una pestaña dedicada.

### Fase 6: Pulido y Exportación
- Exportación de los equipos propios en formato Pokepaste.
- Soporte para actualizar la base de datos de "Top Teams" manualmente antes de un torneo (botón de sync específico).
- Refinamiento de la UI/UX en dispositivos móviles (animaciones, gestos).

---

## ⏸️ En Stand By

### Damage Calculator Local
- Integrar una versión de cálculos de daño (tipo `@smogon/calc`).
- Dejado en espera temporalmente para dar prioridad a la visualización de Speed Tiers y análisis táctico base.
