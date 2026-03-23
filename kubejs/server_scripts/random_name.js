const $Names = Java.loadClass(
  'com.natamus.villagernames_common_forge.util.Names',
);

function getRandomName() {
  return $Names.getRandomName();
}
