// Pinned before anything else runs: several lib/ date helpers parse
// "YYYY-MM-DDT00:00:00" (no zone) as local time — without a fixed TZ, the
// same test would pass or fail depending on which machine/CI runner's
// default timezone happens to be running it. Set here (not per test file)
// since worker processes inherit process.env at spawn time, but a test
// file only runs after Date-parsing code may already be imported.
process.env.TZ = "UTC";

const nextJest = require("next/jest");

// next/jest handles the Next.js-specific bits (SWC transform, CSS/image
// imports, env vars) so this config only needs the parts that are actually
// project-specific.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "providers/**/*.{ts,tsx}",
    "!**/*.test.{ts,tsx}",
    "!**/*.d.ts",
  ],
  // Guards the coverage this project has already reached — a PR that
  // deletes or guts a test file (rather than touching app code) should
  // fail CI here, not slip through on green. Set a few points below the
  // last full-suite run (99.96/99.81/100/100) rather than at it: a couple
  // of sections intentionally keep a documented sub-100% branch number
  // (see e.g. member-pending-invites-section.test.tsx's comment on a
  // Jest/Istanbul coverage-merging quirk), and that number drifts by a
  // fraction of a percent run to run.
  coverageThreshold: {
    global: {
      statements: 99,
      branches: 99,
      functions: 99,
      lines: 99,
    },
  },
};

module.exports = async () => {
  const resolvedConfig = await createJestConfig(config)();
  return {
    ...resolvedConfig,
    // next/jest always prepends a blanket "/node_modules/" ignore pattern
    // of its own, and transformIgnorePatterns entries are OR'd together —
    // appending a narrower exception can't override that blanket one, so
    // this has to fully replace the array instead. marked ships ESM-only,
    // so it needs to be transformed too, or `require("marked")` fails
    // under Jest's CJS runtime.
    transformIgnorePatterns: ["/node_modules/(?!(marked)/)"],
  };
};
