/* global BlockEvents, hasAnyPhaseIC */

/**
 * Grass block break restriction system.
 * Prevents players from breaking grass blocks if ANY InControl phase is active.
 */
BlockEvents.broken('minecraft:grass_block', (event) => {
  if (hasAnyPhaseIC()) {
    event.cancel();
  }
});
