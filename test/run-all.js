// Esegue tutti i test di Elektron: node test/run-all.js
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
let failed = 0;
// prima quelli nell'ordine delle tappe, poi gli eventuali altri file *.test.js
const order = ['engine.test.js', 'engine2.test.js', 'schematic.test.js', 'answers.test.js', 'generator.test.js', 'course.test.js', 'save.test.js', 'content.test.js'];
const rest = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js') && !order.includes(f)).sort();
for (const t of order.concat(rest)) {
  if (!fs.existsSync(path.join(__dirname, t))) continue;
  try { process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, t)], { encoding: 'utf8', maxBuffer: 1 << 26 })); }
  catch (e) { failed++; process.stdout.write(e.stdout || ''); process.stdout.write(e.stderr || ''); }
}
console.log(failed ? `\n${failed} gruppi di test con errori.` : '\nTutti i test superati.');
process.exitCode = failed ? 1 : 0;
