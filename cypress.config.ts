import { defineConfig } from "cypress";

export default defineConfig({
  video: true,
  screenshotsFolder: "cypress/screenshots",
  videosFolder: "cypress/videos",
  trashAssetsBeforeRuns: true,
  viewportWidth: 1400,
  viewportHeight: 820,
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
  },
});
