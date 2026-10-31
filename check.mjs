// Verifies every local href/src in dist/ points to a file that exists.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
let bad = 0, links = 0;
for (const f of readdirSync('dist').filter(f => f.endsWith('.html'))) {
  for (const [, l] of readFileSync(`dist/${f}`, 'utf8').matchAll(/(?:href|src)="([^"#?]+)"/g)) {
    if (/^(https?:|mailto:)/.test(l)) continue;
    links++;
    if (!existsSync(`dist/${l}`)) { bad++; console.error(`${f}: broken link ${l}`); }
  }
}
console.log(`${links} local links checked, ${bad} broken.`);
process.exit(bad ? 1 : 0);
