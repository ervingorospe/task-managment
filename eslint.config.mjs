import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "coverage/**", "node_modules/**"],
  },
  {
    // eslint-config-next@16 bundles eslint-plugin-react-hooks@7's new
    // "React Compiler readiness" rules (set-state-in-effect, refs,
    // incompatible-library, use-memo, static-components, immutability,
    // etc.), all defaulted to "error". None of these existed under the
    // v4-era plugin this project was linted with before, and fixing the
    // ~45 findings they surface is real app-logic work, not a side effect
    // of a dependency bump — tracked separately. Keeping only the two
    // rules this project was already held to.
    rules: {
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
    },
  },
];

export default eslintConfig;
