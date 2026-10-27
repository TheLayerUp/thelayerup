import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // "server-only" throws outside a React Server environment; stub it for unit tests.
    alias: {
      "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    },
  },
});
