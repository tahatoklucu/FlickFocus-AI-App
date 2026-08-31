import { defineConfig } from "vitest/config";

/**
 * Firestore security rule tests. These need the Firestore emulator (and so a
 * Java runtime), which is why they are kept out of the default `npm test`.
 * Run them with `npm run test:rules`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["firestore-tests/**/*.test.ts"],
    globals: true,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // The emulator is shared state, so suites must not run concurrently.
    fileParallelism: false,
  },
});
