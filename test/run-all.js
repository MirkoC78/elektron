// Esegue tutti i test di Elektron: node test/run-all.js
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
let failed = 0;
const order = ['engine.test.js', 'bank.test.js', 'content.test.js', 'generator.test.js', 'course.test.js', 'save.test.js', 'review.test.js', 'explain.test.js'];
for (const t of order) {
  if (!fs.existsSync(path.join(__dirname, t))) continue;
  try { process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, t)], { encoding: 'utf8', maxBuffer: 1 << 26 })); }
  catch (e) { failed++; process.stdout.write(e.stdout || ''); process.stdout.write(e.stderr || ''); }
}
console.log(failed ? `\n${failed} gruppi di test con errori.` : '\nTutti i test superati.');
process.exitCode = failed ? 1 : 0;
