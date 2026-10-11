import { defineConfig } from "vitest/config";

// Kept apart from vite.config.ts, whose root is the site.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
