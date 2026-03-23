let loaded = false;

LevelEvents.tick((event) => {
  if (loaded) return;
  setWorld(event.level);
  onReload(event.server);
});
