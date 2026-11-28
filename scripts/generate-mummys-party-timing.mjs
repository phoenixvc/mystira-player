import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'src/app/mummysPartyTiming.json');
const targets = [
  ['spot_table', 0],
  ['max_s1_01', 0],
];
const generate = process.argv.includes('--generate');
const key = process.env.ELEVENLABS_API_KEY;
const existing = JSON.parse(await readFile(output, 'utf8'));
const clips = [...existing.clips];
const missing = [];

for (const locale of ['en', 'af']) {
  const suffix = locale === 'af' ? '.af' : '';
  const manifest = JSON.parse(await readFile(path.join(root, `src/app/mummysPartyVoiceManifest${suffix}.json`), 'utf8'));
  const config = JSON.parse(await readFile(path.join(root, `scripts/mummys-party-voices${suffix}.config.json`), 'utf8'));
  for (const [sceneId, lineIndex] of targets) {
    const entry = manifest.lines.find((line) => line.sceneId === sceneId && line.lineIndex === lineIndex);
    if (!entry) throw new Error(`Missing voice clip for ${sceneId}/${locale}.`);
    const saved = clips.find((clip) => clip.sceneId === sceneId && clip.lineIndex === lineIndex && clip.locale === locale);
    if (saved?.text === entry.text && saved.file === entry.file && saved.words?.length) continue;
    missing.push({ ...entry, locale, config });
  }
}

const characters = missing.reduce((sum, clip) => sum + clip.text.length, 0);
console.log(`Timing pilot: ${missing.length} clips, ${characters} new TTS characters.`);
if (characters > 300) throw new Error('Timing pilot exceeds the 300-character limit.');
if (!generate) process.exit(0);
if (missing.length && !key) throw new Error('ELEVENLABS_API_KEY is required.');

function wordsFromAlignment(text, alignment) {
  const characters = alignment?.characters;
  const starts = alignment?.character_start_times_seconds;
  const ends = alignment?.character_end_times_seconds;
  if (!Array.isArray(characters) || characters.join('') !== text || starts?.length !== characters.length || ends?.length !== characters.length) {
    throw new Error('TTS alignment does not match the exact authored text.');
  }
  return [...text.matchAll(/\S+/gu)].map((match) => {
    const start = match.index;
    const end = start + match[0].length - 1;
    const startMs = Math.round(starts[start] * 1000);
    const endMs = Math.round(ends[end] * 1000);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs < 0 || endMs <= startMs) throw new Error('Invalid TTS word timing.');
    return { text: match[0], startMs, endMs };
  });
}

for (const [index, clip] of missing.entries()) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(clip.config.voices[clip.speaker])}/with-timestamps?output_format=${encodeURIComponent(clip.config.outputFormat)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: clip.text, model_id: clip.config.model, ...(clip.locale === 'af' ? { language_code: 'af' } : {}) }),
  });
  if (!response.ok) throw new Error(`Timing generation failed (${response.status}).`);
  const result = await response.json();
  const words = wordsFromAlignment(clip.text, result.alignment);
  const bytes = Buffer.from(result.audio_base64 ?? '', 'base64');
  if (bytes.length < 1000) throw new Error('Timing generation returned no usable audio.');
  await writeFile(path.join(root, `public/mummys-party/audio/${clip.locale}/${clip.file}`), bytes);
  const entry = { sceneId: clip.sceneId, lineIndex: clip.lineIndex, locale: clip.locale, text: clip.text, file: clip.file, words };
  const savedIndex = clips.findIndex((item) => item.sceneId === clip.sceneId && item.lineIndex === clip.lineIndex && item.locale === clip.locale);
  if (savedIndex < 0) clips.push(entry); else clips[savedIndex] = entry;
  await writeFile(output, JSON.stringify({ clips }, null, 2) + '\n');
  console.log(`Saved timing ${index + 1}/${missing.length}: ${clip.sceneId}/${clip.locale}, ${words.length} words.`);
}
