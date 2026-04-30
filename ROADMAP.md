# Hoja de Ruta (Roadmap) - Pokémon Competitive App

Este documento describe las fases de desarrollo del proyecto. Las Fases 1 a 3 ya han sido implementadas, por lo que el enfoque actual está en las Fases 4 a 7.

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

### Fase 4: Refactorización de la Pokédex (Meta Competitiva)
**Objetivo:** Reemplazar la Pokédex actual por una vista completamente orientada al meta competitivo de Champions Tournaments, usando el endpoint de IA de Pikalytics como fuente de datos principal.

1. **Nueva fuente de datos — Endpoint AI de Pikalytics:**
   - El índice (`https://www.pikalytics.com/ai/pokedex/championstournaments`) devuelve los Pokémon del meta con su `usage %` y links directos al detalle de cada uno.
   - La lista de la Pokédex mostrará **únicamente los Pokémon presentes en este índice** (el meta actual), con su porcentaje de uso.
   - Cada detalle individual (`/ai/pokedex/championstournaments/{Pokemon}`) devuelve: movimientos, habilidades, objetos, compañeros frecuentes (*teammates*), estadísticas base y **equipos destacados** donde aparece el Pokémon.
   - Las imágenes se resuelven desde la CDN de Pikalytics: `https://cdn.pikalytics.com/images/championssprites/{pokemon_lower}.png` (el endpoint AI **no** incluye URLs de imágenes directamente; la URL se construye con el nombre del Pokémon en minúsculas).

2. **Rediseño de la pantalla de lista (Pokédex tab):**
   - Mostrar los Pokémon del meta ordenados por uso, con sprite, nombre y barra/porcentaje de uso.
   - Diseño premium con tarjetas oscuras, acentos dorados y animaciones suaves.

3. **Rediseño de la pantalla de detalles (`pokemon/[id].tsx`):**
   - Panel superior: sprite, nombre, tipos, uso total y ranking.
   - Sección **Estadísticas Base** con barras visuales.
   - Sección **Movimientos, Objetos y Habilidades más usados** con barras de porcentaje.
   - Sección **Compañeros Frecuentes** (*Common Teammates*) con sprites circulares y navegación.
   - Sección **Equipos Destacados** (*Featured Teams*): tarjetas mostrando los 6 sprites del equipo, jugador, récord y el set exacto del Pokémon consultado.

4. **Adaptación de la base de datos:**
   - Nueva tabla `meta_teammates` para compañeros frecuentes por Pokémon.
   - Nueva tabla `featured_teams` con los equipos destacados extraídos por Pokémon.

---

### Fase 5: Reconocimiento de "Top Teams" en Battle Preview (Arquetipos Meta)
**Objetivo:** Identificar el equipo rival como un arquetipo conocido del meta para revelar sus configuraciones exactas (sets), directamente en la pestaña de Battle Preview.

> Esta fase se apoya en parte en los `featured_teams` recopilados durante la Fase 4, pero se nutre de un endpoint separado dedicado a equipos top: `https://www.pikalytics.com/topteams/championstournaments`.

1. **Extracción de Top Teams (endpoint propio):**
   - Fetch del endpoint de top teams de Pikalytics para obtener composiciones completas con objetos, habilidades y movimientos específicos que usan **juntos**.
2. **Sistema de Reconocimiento (Pattern Matching):**
   - Cuando el usuario ingresa los 6 Pokémon del rival en el Battle Preview, el sistema compara esa combinación contra la base de datos de Top Teams + Featured Teams de la Fase 4.
   - Si coinciden 5 o 6 Pokémon, la app asume que se trata de ese arquetipo o una variante.
3. **Revelación de Sets Exactos:**
   - En lugar de mostrar "el Pokémon X suele usar el objeto Y en un 40% de los casos", la app dirá: *"Este es el equipo de [Jugador/Arquetipo], su Pokémon X lleva este objeto exacto y estos ataques"*.

---

### Fase 6: Bandas de Velocidad (Speed Tiers)
**Objetivo:** Refinar la toma de decisiones basada en métricas exactas del formato.

1. **Integración de Speed Tiers:**
   - Extraer datos de `https://www.pikalytics.com/speed-tiers`.
   - Visualizar una barra o lista ordenada donde el usuario pueda ver exactamente dónde se ubican sus Pokémon respecto al equipo rival.
   - Mostrar un acordeón resumen en la pestaña de Battle Preview y una lista completa en una pestaña dedicada.

---

### Fase 7: Pulido, Exportación y Calculadora de Daño
**Objetivo:** Cerrar el ciclo competitivo con herramientas de exportación y análisis de daño integradas.

- Exportación de los equipos propios en formato Pokepaste.
- Soporte para actualizar la base de datos de "Top Teams" manualmente antes de un torneo (botón de sync específico).
- Refinamiento de la UI/UX en dispositivos móviles (animaciones, gestos).
- **Calculadora de Daño:** Integrar `@smogon/calc` como pantalla principal, reemplazando la pestaña de Items con una calculadora de daño interactiva en contexto de batalla.

---

## ⏸️ En Stand By

*(Sin elementos pendientes actualmente — la calculadora de daño fue integrada en la Fase 7.)*
