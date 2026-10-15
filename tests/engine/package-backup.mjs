/** Local handoff utility, not a production engine method or a live demo recording. */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const directory = resolve(process.argv[2] || 'artifacts/builder-a/local-workflow');
const html = await readFile(join(directory, 'offline-rehearsal.html'), 'utf8');
const match = html.match(/<script id="rehearsal-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Generate the engine rehearsal before packaging.');
const data = JSON.parse(match[1]);
const decodeImage = uri => {
  if (!uri.startsWith('data:image/svg+xml;base64,')) throw new Error('Expected an embedded engine SVG.');
  return Buffer.from(uri.split(',')[1], 'base64');
};
for (const [name, expected] of [['graphicrouter-pitch-v1.pptx', data.proof.originalPptxSha256], ['graphicrouter-pitch-v2-violet.pptx', data.proof.revisedPptxSha256]]) {
  const actual = createHash('sha256').update(await readFile(join(directory, name))).digest('hex');
  if (actual !== expected) throw new Error(`${name} no longer matches the verified rehearsal.`);
}
const raster = join(directory, 'backup-images'); await mkdir(raster, { recursive: true });
for (const [index, frame] of data.frames.entries()) {
  await sharp(decodeImage(frame.views.finished)).resize(1600, 900).png().toFile(join(raster, `slide${index + 1}.png`));
}
await sharp(decodeImage(data.revisedSlide)).resize(1600, 900).png().toFile(join(raster, 'slide3-violet.png'));
await writeFile(join(directory, 'backup-context.json'), JSON.stringify({
  kind: 'offline-engine-backup',
  pdf: 'Five raster pages from the engine SVGs. Use the PPTX for editable elements. Not a Canva PDF export.',
  animation: 'Scripted replay from precomputed SVGs. No live ChatGPT, service, Canva call, or screen recording.',
  speakingPaceVerified: false,
}, null, 2));
await copyFile(new URL('../../src/fixtures/stage-runbook.md', import.meta.url), join(directory, 'stage-runbook.md'));
await copyFile(new URL('./package-backup.py', import.meta.url), join(directory, 'build-backup.py'));
const result = spawnSync('python3', [join(directory, 'build-backup.py'), directory], { encoding: 'utf8' });
if (result.status !== 0) throw new Error(result.stderr || 'Backup packaging failed. Python needs Pillow, reportlab, and PyMuPDF.');
console.log(result.stdout.trim());
