import { useState } from 'react';
import { parse } from 'yaml';
import fireDoorYaml from '../../content/manor/fire-door.story.yaml?raw';
import styles from './MummysPartyMediaPreview.module.css';

const root = `${import.meta.env.BASE_URL}mummys-party/`;
const asset = (path: string) => `${root}${path}`;

type PlacedImage = { path: string; alt: string; left: number; bottom: number; width: number };
type Scene = { id?: string; title: string; background: string; description: string; cast: PlacedImage[]; props: PlacedImage[]; smoke?: string[]; video?: string };

type DraftScene = { id: string; title: string; description: string; media: { image: string | null; video: string | null }; cast?: { character_id: string; slot: string; pose?: string }[]; metadata?: { creative_instruction?: string | null } };
type DraftStory = { characters: { id: string; image: string | null }[]; scenes: DraftScene[] };
const draft = parse(fireDoorYaml) as DraftStory;
const toPreviewPath = (path: string) => path.replace(/^assets\//, '').replace(/^([^/]+\.mp4)$/, 'videos/$1');

const piecePositions: Record<string, { left: number; bottom: number; width: number }> = {
  'pumpkin-lantern': { left: 35, bottom: 29, width: 7 }, 'candle-battery': { left: 36, bottom: 35, width: 3 },
  'paper-bats': { left: 16, bottom: 55, width: 10 }, sofa: { left: 70, bottom: 12, width: 24 },
  'plugs-six': { left: 12, bottom: 24, width: 7 }, 'plugs-two': { left: 12, bottom: 24, width: 7 },
  'smoke-alarm': { left: 63, bottom: 82, width: 7 }, 'meet-here-sign': { left: 60, bottom: 39, width: 13 },
  'arrow-left': { left: 28, bottom: 2, width: 11 }, 'arrow-right': { left: 65, bottom: 2, width: 11 },
  'fire-engine': { left: 5, bottom: 3, width: 34 }, 'fire-poster': { left: 6, bottom: 32, width: 12 },
  'potion-boilover': { left: 45, bottom: 10, width: 15 }, 'bag-of-sweets': { left: 45, bottom: 2, width: 11 },
  'blackened-pan': { left: 42, bottom: 8, width: 12 }, 'smoke-door': { left: 0, bottom: 0, width: 100 },
  'smoke-ceiling': { left: 0, bottom: 0, width: 100 },
};

const draftScenes: Scene[] = draft.scenes.map((scene) => {
  const instruction = scene.metadata?.creative_instruction ?? '';
  const pieces = instruction.split('Pieces:')[1] ?? '';
  const usedPieces = Object.keys(piecePositions).filter((name) => new RegExp(`\\b${name}\\b`).test(pieces))
    .filter((name) => !(name === 'smoke-alarm' && /(?:party-room|pootions-shop)\.jpg$/.test(scene.media.image ?? '')));
  const pathForPiece = (name: string) => name.startsWith('smoke-') ? `effects/${name}.png` :
    name.startsWith('arrow-') || name === 'meet-here-sign' ? `svg/${name}.svg` : `pieces/${name}.png`;
  const smokeNames = usedPieces.filter((name) => name.startsWith('smoke-'));
  return {
    id: scene.id,
    title: scene.title,
    background: scene.media.image ? toPreviewPath(scene.media.image) : 'backgrounds/party-room.jpg',
    description: scene.description,
    video: scene.media.video ? toPreviewPath(scene.media.video) : undefined,
    cast: (scene.cast ?? []).flatMap((member) => {
      const character = draft.characters.find((item) => item.id === member.character_id);
      if (!character?.image) return [];
      const base = toPreviewPath(character.image);
      const path = member.pose ? `poses/${base.split('/').at(-1)?.replace('.png', '')}/${base.split('/').at(-1)?.replace('.png', '')}-${member.pose}.png` : base;
      const left = member.slot === 'left' ? 8.5 : member.slot === 'right' ? 64.5 : 36.5;
      return [{ path, alt: character.id, left, bottom: 1, width: 27 }];
    }),
    props: usedPieces.filter((name) => !name.startsWith('smoke-') && !(scene.id === 'max_s1_03' && name === 'sofa')).map((name) => ({ path: pathForPiece(name), alt: name.replaceAll('-', ' '), ...piecePositions[name]!, ...(name === 'fire-poster' && /shown large, close up/.test(pieces) ? { left: 37, bottom: 10, width: 26 } : {}) })),
    smoke: smokeNames.map(pathForPiece),
  };
});

const scenes: Scene[] = [
  { title: 'Getting ready', background: 'backgrounds/party-room.jpg', description: 'Mummy and Ghost in the party room.', cast: [
    { path: 'poses/mummy/mummy-pushing.png', alt: 'Mummy pushing furniture', left: 69, bottom: 1, width: 20 },
    { path: 'poses/ghost/ghost-worried.png', alt: 'Worried ghost', left: 16, bottom: 4, width: 22 },
  ], props: [
    { path: 'pieces/sofa.png', alt: 'Sofa', left: 71, bottom: 11, width: 24 },
    { path: 'pieces/pumpkin-lantern.png', alt: 'Pumpkin lantern', left: 35, bottom: 29, width: 7 },
    { path: 'pieces/paper-bats.png', alt: 'Paper bats', left: 16, bottom: 55, width: 10 },
  ] },
  { title: 'Spot the hazards', background: 'backgrounds/party-room-full.jpg', description: 'A crowded room with things to inspect.', cast: [
    { path: 'characters/ghost.png', alt: 'Ghost', left: 7, bottom: 5, width: 15 },
    { path: 'poses/mummy/mummy-shocked.png', alt: 'Surprised mummy', left: 77, bottom: 2, width: 17 },
  ], props: [
    { path: 'pieces/plugs-six.png', alt: 'Overfilled socket', left: 12, bottom: 24, width: 7 },
    { path: 'pieces/smoke-alarm.png', alt: 'Smoke alarm', left: 65, bottom: 76, width: 7 },
    { path: 'pieces/bag-of-sweets.png', alt: 'Bag of sweets', left: 36, bottom: 3, width: 10 },
  ] },
  { title: 'Make a plan', background: 'backgrounds/hall-wall.jpg', description: 'Signs and exits in the hall.', cast: [
    { path: 'poses/mummy/mummy-sign.png', alt: 'Mummy with a sign', left: 14, bottom: 2, width: 20 },
    { path: 'poses/ghost/ghost-pointing.png', alt: 'Ghost pointing', left: 74, bottom: 5, width: 16 },
  ], props: [
    { path: 'svg/meet-here-sign.svg', alt: 'Meet here sign', left: 48, bottom: 40, width: 16 },
    { path: 'svg/arrow-right.svg', alt: 'Arrow right', left: 64, bottom: 22, width: 10 },
  ] },
  { title: 'Guests arrive', background: 'backgrounds/house-outside-dusk.jpg', description: 'Friends gather outside the house.', cast: [
    { path: 'characters/bat.png', alt: 'Bat', left: 13, bottom: 34, width: 13 },
    { path: 'characters/vampire.png', alt: 'Vampire', left: 35, bottom: 2, width: 17 },
    { path: 'characters/skeleton.png', alt: 'Skeleton', left: 64, bottom: 2, width: 17 },
  ], props: [] },
  { title: 'Smoke alarm', background: 'backgrounds/party-room-full.jpg', description: 'Smoke is layered over the room.', smoke: ['effects/smoke-ceiling.png'], cast: [
    { path: 'poses/ghost/ghost-waving.png', alt: 'Ghost waving', left: 11, bottom: 4, width: 17 },
    { path: 'poses/mummy/mummy-crawling.png', alt: 'Mummy crawling', left: 56, bottom: 0, width: 25 },
  ], props: [
    { path: 'pieces/blackened-pan.png', alt: 'Burnt pan', left: 45, bottom: 10, width: 12 },
  ] },
  { title: 'Get out', background: 'backgrounds/front-garden.jpg', description: 'The guests meet outside.', smoke: ['effects/smoke-door.png'], cast: [
    { path: 'poses/vampire/vampire-crawling.png', alt: 'Vampire crawling', left: 17, bottom: 2, width: 20 },
    { path: 'poses/skeleton/skeleton-crawling.png', alt: 'Skeleton crawling', left: 43, bottom: 2, width: 20 },
    { path: 'poses/ghost/ghost-pleased.png', alt: 'Pleased ghost', left: 75, bottom: 4, width: 15 },
  ], props: [
    { path: 'pieces/fire-engine.png', alt: 'Fire engine', left: 80, bottom: 8, width: 19 },
    { path: 'svg/arrow-left.svg', alt: 'Arrow left', left: 9, bottom: 28, width: 10 },
  ] },
  { title: 'Witch’s shop', background: 'backgrounds/pootions-shop.jpg', description: 'A separate assessment setting.', cast: [
    { path: 'characters/witch.png', alt: 'Witch', left: 14, bottom: 2, width: 19 },
    { path: 'characters/shop-cat.png', alt: 'Shop cat', left: 71, bottom: 2, width: 17 },
  ], props: [
    { path: 'pieces/potion-boilover.png', alt: 'Potion boiling over', left: 46, bottom: 9, width: 16 },
    { path: 'pieces/fire-poster.png', alt: 'Fire safety poster', left: 67, bottom: 37, width: 12 },
  ] },
  { title: 'Look around', background: 'backgrounds/pootions-from-above.jpg', description: 'An overhead view of the shop.', cast: [
    { path: 'poses/witch/witch-alarmed.png', alt: 'Alarmed witch', left: 17, bottom: 3, width: 19 },
    { path: 'poses/ghost/ghost-phone.png', alt: 'Ghost with phone', left: 73, bottom: 3, width: 15 },
  ], props: [
    { path: 'pieces/plugs-two.png', alt: 'Two plugs', left: 49, bottom: 9, width: 10 },
    { path: 'pieces/candle-battery.png', alt: 'Battery candle', left: 60, bottom: 28, width: 9 },
  ] },
  { title: 'Outside the shop', background: 'backgrounds/pootions-outside.jpg', description: 'The shop exterior and firefighter.', cast: [
    { path: 'characters/firefighter.png', alt: 'Firefighter', left: 24, bottom: 2, width: 20 },
    { path: 'poses/mummy/mummy-proud.png', alt: 'Proud mummy', left: 69, bottom: 2, width: 18 },
  ], props: [
    { path: 'pieces/fire-engine.png', alt: 'Fire engine', left: 80, bottom: 8, width: 19 },
  ] },
];

const gallery = [
  { title: 'Base Mummy', files: ['characters/mummy.png'] },
  { title: 'Other poses', files: [
    'poses/witch/witch-shrugging.png', 'poses/skeleton/skeleton-no-hat.png', 'poses/vampire/vampire-pleading.png',
    'poses/mummy/mummy-asking.png', 'poses/mummy/mummy-phone-panic.png', 'poses/mummy/mummy-phone-give.png',
    'poses/mummy/mummy-leaning-sofa.png', 'poses/mummy/mummy-lantern.png', 'poses/mummy/mummy-pointing.png',
  ] },
];

function Placed({ item }: { item: PlacedImage }) {
  const glow = item.path.includes('ghost') && item.path.endsWith('.png')
    ? item.path.replace(/\.png$/, '-glow.svg') : undefined;
  const position = { left: `${item.left}%`, bottom: `${item.bottom}%`, width: `${item.width}%` };
  return <span className={styles.placed} style={position}>
    {glow && <img className={styles.glow} src={asset(glow)} alt="" aria-hidden="true" />}
    <img src={asset(item.path)} alt={item.alt} />
  </span>;
}

export function MummysPartyMediaPreview() {
  const [source, setSource] = useState<'draft' | 'samples'>('draft');
  const [index, setIndex] = useState(0);
  const [showSmoke, setShowSmoke] = useState(true);
  const activeScenes = source === 'draft' ? draftScenes : scenes;
  const scene = activeScenes[index]!;
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.kicker}>Mystira Player · media preview</p><h1>The Mummy’s Party</h1>
        <p>Browse the 77 draft scenes or rough sample arrangements. Positions are temporary.</p></div>
      <a href={import.meta.env.BASE_URL}>Back to player</a>
    </header>
    <section className={styles.preview} aria-label="Sample scene">
      <div className={styles.sourceControls}>
        <label>View <select value={source} onChange={(event) => { setSource(event.target.value as 'draft' | 'samples'); setIndex(0); }}><option value="draft">Lesson draft · 77 scenes</option><option value="samples">Rough sample layouts</option></select></label>
        {source === 'draft' && <label>Scene <select value={index} onChange={(event) => setIndex(Number(event.target.value))}>{draftScenes.map((item, i) => <option key={item.id} value={i}>{i + 1}. {item.id} · {item.title}</option>)}</select></label>}
      </div>
      <div className={styles.stage}>
        <img className={styles.background} src={asset(scene.background)} alt={scene.description} />
        {scene.video && <video className={styles.stageVideo} controls preload="metadata" poster={asset(scene.background)} src={asset(scene.video)} />}
        {scene.props.map((item) => <Placed key={item.path} item={item} />)}
        {showSmoke && scene.smoke?.map((path) => <img key={path} className={styles.smoke} src={asset(path)} alt="" aria-hidden="true" />)}
        {scene.cast.map((item) => <Placed key={item.path} item={item} />)}
      </div>
      <div className={styles.nav}>
        <button type="button" onClick={() => setIndex((index - 1 + activeScenes.length) % activeScenes.length)} aria-label="Previous scene">←</button>
        <div><strong>{scene.title}</strong><span>{index + 1} of {activeScenes.length} · {scene.description}</span></div>
        <button type="button" onClick={() => setIndex((index + 1) % activeScenes.length)} aria-label="Next scene">→</button>
      </div>
      {!!scene.smoke?.length && <label className={styles.toggle}><input type="checkbox" checked={showSmoke} onChange={(event) => setShowSmoke(event.target.checked)} /> Show smoke overlay</label>}
      {source === 'samples' && <div className={styles.scenes}>{scenes.map((item, i) => <button key={item.title} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>{item.title}</button>)}</div>}
    </section>
    <section className={styles.videos} aria-label="Opening and closing videos">
      <h2>Videos</h2><div className={styles.videoGrid}>
        <div><h3>Opening</h3><video controls preload="metadata" src={asset('videos/opening_video.mp4')} /></div>
        <div><h3>Closing</h3><video controls preload="metadata" src={asset('videos/end_video.mp4')} /></div>
      </div>
    </section>
    {gallery.map((group) => <section key={group.title} className={styles.gallery} aria-label={group.title}>
      <h2>{group.title}</h2><div>{group.files.map((file) => <figure key={file}><img loading="lazy" src={asset(file)} alt={file.split('/').at(-1)?.replace('.png', '').replaceAll('-', ' ')} /><figcaption>{file.split('/').at(-1)?.replace('.png', '')}</figcaption></figure>)}</div>
    </section>)}
    <footer>Preview only · placements and order are provisional · source: Mummy’s Party media on Notion</footer>
  </main>;
}
