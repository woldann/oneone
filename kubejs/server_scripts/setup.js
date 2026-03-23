let world = null;
let loaded = false;

function setWorld(event) {
  world = event.level;
}

LevelEvents.loaded((event) => {
  setWorld(event);
});

function onReload(server) {
  if (loaded) return false;
  loaded = true;
  // One-time check for phases on load
  refreshStartPhaseStatus();

  // Additional start-phase logic
  if (isStartPhase()) {
    onStartPhaseSetup(server);
  }

  server.tell('Reloaded!');
  return true;
}

function onSetup(server) {
  // Delegate world setup logic
  onSetupWorld(server);

  return onReload(server);
}

PlayerEvents.loggedIn((event) => {
  setWorld(event);
  onSetup(event.server);
});

/**
 * Start phase specific settings (Non-repetitive setup).
 * Runs if isStartPhase is true.
 */
function onStartPhaseSetup(server) {
  server.tell('Start phase active!');
}

/**
 * Special operations to be performed when the world is first loaded.
 * Handles its own initialization flag and sets the initial phase.
 */
function onSetupWorld(server) {
  if (!server.persistentData.getBoolean('isWorldInitialized')) {
    addStartPhaseIC();
    server.persistentData.putBoolean('isWorldInitialized', true);
  }
}
