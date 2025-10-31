import { exec } from "child_process";
import { readdirSync, mkdirSync } from "fs";

for (const f of readdirSync("openapi")) {
  if (!f.startsWith("openapi-")) continue;
  const name = f.slice(8).replace(/\..+$/, "");
  const outDir = `src/domains/${name}`;
  mkdirSync(outDir, { recursive: true });

  const cmd = `npx swagger-typescript-api generate --path "openapi/${f}" --output "${outDir}" --name "api.ts" --modular --axios`;
  console.log(`→ Generating ${name} API...`);
  exec(cmd, (err, _stdout, stderr) => {
    if (err) console.error(`✗ ${name}:`, stderr || err.message);
    else console.log(`✓ ${name}`);
  });
}
