# Fase 2: El Matchup (Team Preview) - Plan y Observaciones

## Estructura de la Pantalla

### 1. Slot de Ingreso Rápido
* **Recomendación:** Usar un `BottomSheet` o un `Modal` que se active al tocar una de las 6 ranuras superiores. El teclado debe abrirse automáticamente.
* **Observación:** Implementar un diccionario de "Shortcodes" (ej. "tbolt" para Thundurus-T) ahorrará unos 5-7 segundos vitales.

### 2. Matriz de Calor (Heatmap 6x6)
* **Visual:** Una cuadrícula donde las filas son tus Pokémon y las columnas los del rival.
* **Cálculo:**
  - `Eficacia Ofensiva`: ¿Tiene mi Pokémon algún movimiento (STAB o cobertura) que sea x2 o x4 contra el rival?
  - `Eficacia Defensiva`: ¿Qué tan bien resiste mi Pokémon los tipos base del rival?
* **Recomendación:** Si un Pokémon tuyo tiene "Wide Guard" o "Tailwind", añadir un pequeño indicador en su fila, ya que cambia el matchup global.

### 3. Alertas Críticas
* **Velocidad:** Comparar tu Velocidad Real (EVs + Naturaleza) con la Velocidad Base Máxima del rival a Nivel 50.
* **Habilidades:** 
  - **Urgente:** Si tienes Intimidación y el rival tiene `Defiant` (Kingambit) o `Competitive` (Milotic/Annihilape), lanzar un banner rojo.
* **Sinergia:** Detectar si el rival tiene múltiples Pokémon que se benefician de Clima (ej. 3 de Lluvia) para alertar sobre el control del campo.

---

## Notas de Implementación
* **Estado de la Aplicación:** Se debe crear una pantalla `battle-preview.tsx`.
* **Persistencia:** No es necesario guardar estos datos en SQLite permanentemente, pueden vivir en el estado de la sesión, a menos que el usuario quiera "Guardar el Combate" para análisis posterior.
