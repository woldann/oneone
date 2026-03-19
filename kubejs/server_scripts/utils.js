/* global ServerEvents */

/** 
 * Note: Command output capture in KubeJS 6 is not straightforward.
 * We use a global variable to store the phase status, which can be updated 
 * via an explicit check or during initialization.
 */
let _isStartPhaseActive = false;

/**
 * Helper function to check if the server is in the start phase.
 * @param {Internal.ServerJS} server
 * @returns {boolean}
 */
function isStartPhase() {
  // Check the global flag, which is updated on load via command output
  return _isStartPhaseActive;
}

/**
 * Update the start phase status by parsing the 'incontrol phases' command output.
 * @param {Internal.ServerJS} server
 */
function refreshStartPhaseStatus(server) {
  _isStartPhaseActive = hasStartPhaseIC(server);
}

/**
 * Sets the entity to be persistent.
 * @param {Internal.EntityJS} entity
 */
function setPersisted(entity) {
  entity.nbt = entity.nbt.merge({ PersistenceRequired: 1 });
}
