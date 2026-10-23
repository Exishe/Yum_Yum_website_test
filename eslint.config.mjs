import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "db/migrations/**", "playwright-report/**", "test-results/**", "next-env.d.ts", "lib/images.generated.ts"],
  },
];

export default config;
