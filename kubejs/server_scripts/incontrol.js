const START_PHASEIC = 'start';
const $DataStorage = Java.loadClass('mcjty.incontrol.data.DataStorage');

function getPhases() {
  try {
    if (!world) return '[]';
    return $DataStorage.getData(world).getPhases();
  } catch (e) {
    return '[]';
  }
}

/**
 * Check if a specific phase is active using InControl's PhaseManager.
 * @param {Internal.ServerJS} server
 * @param {string} phaseName
 */
function hasPhaseIC(server, phaseName) {
  return getPhases().contains(phaseName);
}

/**
 * Add a phase using InControl command.
 * @param {Internal.ServerJS} server
 * @param {string} phaseName
 */
function addPhaseIC(server, phaseName) {
  server.runCommandSilent('incontrol setphase ' + phaseName);
  refreshStartPhaseStatus(server);
}

/**
 * Remove a phase using InControl command.
 * @param {Internal.ServerJS} server
 * @param {string} phaseName
 */
function removePhaseIC(server, phaseName) {
  server.runCommandSilent('incontrol clearphase ' + phaseName);
  refreshStartPhaseStatus(server);
}

function hasStartPhaseIC(server) {
  return hasPhaseIC(server, START_PHASEIC);
}

function addStartPhaseIC(server) {
  addPhaseIC(server, START_PHASEIC);
}

function removeStartPhaseIC(server) {
  removePhaseIC(server, START_PHASEIC);
}

/**
 * Zombie despawn prevention logic.
 * Makes zombies persistent during the start phase.
 * Registered at top level to avoid duplicate listeners on reload.
 */
EntityEvents.spawned((event) => {
  if (isStartPhase() && event.entity.type === 'minecraft:zombie') {
    let zombie = event.entity;
    zombie.customName = getRandomName();
    setPersisted(zombie);

    // 1. Set 85% drop chance for all equipment slots
    try {
      const equipmentSlots = ['mainhand'];
      equipmentSlots.forEach(slot => {
        zombie.setDropChance(slot, 0.85);

        // 2. Ensure at least 50% durability
        let item = zombie.getSlot(slot);
        if (item && !item.empty && item.damageable) {
          let maxDamage = item.maxDamage;
          if (item.damageValue > maxDamage * 0.5) {
            item.damageValue = Math.floor(maxDamage * 0.5);
          }
        }
      });
      event.server.tell('A zombie has been enhanced!');
    } catch (e) {
      event.server.tell('Enhance error: ' + e);
    }
  }
});
