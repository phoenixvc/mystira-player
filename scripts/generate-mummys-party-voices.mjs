import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, stat, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locale = process.argv.find((argument) => argument.startsWith('--locale='))?.slice('--locale='.length) ?? 'en';
if (!['en', 'af'].includes(locale)) throw new Error('Supported locales: en, af.');
const config = JSON.parse(await readFile(path.join(root, `scripts/mummys-party-voices${locale === 'af' ? '.af' : ''}.config.json`), 'utf8'));
const story = parse(await readFile(path.join(root, 'content/manor/fire-door.story.yaml'), 'utf8'));
const outputDir = path.join(root, 'public/mummys-party/audio', config.locale);
const manifestPath = path.join(root, `src/app/mummysPartyVoiceManifest${locale === 'af' ? '.af' : ''}.json`);
const generate = process.argv.includes('--generate');
const key = process.env.ELEVENLABS_API_KEY;

const pieces = story.lesson?.pieces.slice(0, config.pieceCount);
if (!pieces?.length) throw new Error('The lesson pieces are missing.');
const selectedIds = new Set(pieces.flatMap((piece) => piece.scenes ?? piece.versions?.flatMap((version) => version.scenes) ?? []));
const selectedScenes = story.scenes.filter((scene) => selectedIds.has(scene.id));
if (selectedScenes.length !== selectedIds.size) throw new Error('A lesson scene is missing from the story.');
if (locale === 'af') {
  const translation = JSON.parse(await readFile(path.join(root, 'content/manor/fire-door.af.preview.json'), 'utf8'));
  for (const scene of selectedScenes) {
    const translated = translation.scenes?.[scene.id];
    const lines = translated?.lines ?? [];
    if (lines.length !== (scene.lines?.length ?? 0)) throw new Error(`Afrikaans lines missing for ${scene.id}.`);
    if (!translated?.description) throw new Error(`Afrikaans description missing for ${scene.id}.`);
    scene.description = translated.description;
    scene.lines?.forEach((line, index) => { line.text = lines[index]; });
  }
}
const entries = selectedScenes.flatMap((scene) => {
  if (scene.media?.video) return [];
  const lines = scene.lines?.length ? scene.lines.map((line, lineIndex) => ({ ...line, lineIndex }))
    : [{ speaker: scene.active_character, text: scene.description, lineIndex: -1 }];
  return lines.flatMap((line) => {
    const voiceId = config.voices[line.speaker];
    if (!voiceId) return [];
    const hash = createHash('sha256').update(JSON.stringify([config.locale, config.model, config.outputFormat, voiceId, line.text])).digest('hex').slice(0, 20);
    return [{ sceneId: scene.id, lineIndex: line.lineIndex, speaker: line.speaker, text: line.text, file: `${line.speaker}-${hash}.mp3` }];
  });
});
const unique = [...new Map(entries.map((entry) => [entry.file, entry])).values()];
const missing = [];
for (const entry of unique) {
  try { if ((await stat(path.join(outputDir, entry.file))).size < 1000) missing.push(entry); }
  catch { missing.push(entry); }
}
const characters = missing.reduce((sum, entry) => sum + entry.text.length, 0);
console.log(`${locale}: ${selectedScenes.length} scenes, ${entries.length} lines, ${unique.length} unique clips, ${missing.length} to generate, ${characters} new characters.`);
if (characters > config.maxNewCharacters) throw new Error(`Generation exceeds the ${config.maxNewCharacters}-character run limit.`);
if (!generate) process.exit(0);
if (missing.length && !key) throw new Error('ELEVENLABS_API_KEY is required to generate missing clips.');

await mkdir(outputDir, { recursive: true });
for (const [index, entry] of missing.entries()) {
  const voiceId = config.voices[entry.speaker];
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(config.outputFormat)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: entry.text, model_id: config.model, ...(locale === 'af' ? { language_code: 'af' } : {}) }),
  });
  if (!response.ok) {
    let status = 'unknown';
    try { status = (await response.json())?.detail?.status ?? 'unknown'; } catch { /* Keep response details and key out of logs. */ }
    throw new Error(`Speech generation failed for ${entry.speaker} clip ${index + 1}/${missing.length}: HTTP ${response.status} (${status}).`);
  }
  if (!(response.headers.get('content-type') ?? '').includes('audio/')) throw new Error(`Speech response ${index + 1} is not audio.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`Speech response ${index + 1} is unexpectedly short.`);
  const destination = path.join(outputDir, entry.file);
  const temporary = `${destination}.partial`;
  try { await writeFile(temporary, bytes); await rename(temporary, destination); }
  finally { await unlink(temporary).catch(() => {}); }
  console.log(`Saved ${index + 1}/${missing.length}: ${entry.speaker} (${entry.text.length} characters)`);
}

const manifest = { locale: config.locale, model: config.model, lines: entries };
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote manifest for ${entries.length} authored lines.`);
