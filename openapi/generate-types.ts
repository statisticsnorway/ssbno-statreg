import { exec } from "child_process";
import { readdirSync, mkdirSync } from "fs";

mkdirSync("src/types", { recursive: true });

for (const f of readdirSync("openapi")) {
  if (!f.startsWith("openapi-")) continue;
  const name = f.slice(8).replace(/\..+$/, ""); // remove "openapi-" and extension
  exec(`npx openapi-typescript openapi/${f} -o src/types/${name}.d.ts`, () => // run openapi-generator
    console.log(`✓ ${name}`)
  );
}