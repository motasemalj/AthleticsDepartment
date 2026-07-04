// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "functions/lib/*"],
  },
  {
    rules: {
      // Reanimated shared values are mutated inside gesture/press handlers by
      // design (`sv.value = withTiming(...)`); the compiler lint flags these
      // as immutability violations even though Reanimated 4 is compiler-safe.
      "react-hooks/immutability": "off",
    },
  },
]);
