const EQUIPMENT_SLOTS = ['mainhand'];
const START_PHASEIC = 'start';
const $DataStorage = Java.loadClass('mcjty.incontrol.data.DataStorage');

function getPhasesIC() {
  try {
    if (!world) return '[]';
    return $DataStorage.getData(world).getPhases();
  } catch (e) {
    return '[]';
  }
}

function setPhaseIC(phaseName, value) {
  try {
    if (!world) return;
    $DataStorage.getData(world).setPhase(phaseName, value);
  } catch (e) {
    return;
  }
}

/**
 * Check if a specific phase is active using InControl's PhaseManager.
 * @param {string} phaseName
 */
function hasPhaseIC(phaseName) {
  return getPhasesIC().contains(phaseName);
}

/**
 * Add a phase using InControl command.
 * @param {string} phaseName
 */
function addPhaseIC(phaseName) {
  setPhaseIC(phaseName, true);
  refreshStartPhaseStatus(server);
}

/**
 * Remove a phase using InControl command.
 * @param {string} phaseName
 */
function removePhaseIC(phaseName) {
  setPhaseIC(phaseName, false);
  refreshStartPhaseStatus(server);
}

function hasStartPhaseIC() {
  return hasPhaseIC(START_PHASEIC);
}

function addStartPhaseIC() {
  addPhaseIC(START_PHASEIC);
}

function removeStartPhaseIC() {
  removePhaseIC(START_PHASEIC);
}

function hasAnyPhaseIC() {
  return !getPhasesIC().equals('[]');
}

/**
 * Zombie despawn prevention logic.
 * Makes zombies persistent during the start phase.
 * Registered at top level to avoid duplicate listeners on reload.
 */
EntityEvents.spawned((event) => {
  const { entity, server } = event;

  if (isStartPhase() && entity.type === 'minecraft:zombie') {
    // If zombie was spawned with an iron shovel (via InControl), fix its durability
    let mainHand = entity.getMainHandItem();
    if (mainHand && mainHand.id === 'minecraft:iron_shovel') {
      entity.customName = getRandomName();
      setPersisted(entity);
      entity.setDropChance('mainhand', 0.9);
    }
  }
});
