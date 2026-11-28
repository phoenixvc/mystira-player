import type { SceneYaml } from '../schema/story-yaml';
import type { SceneStaging } from '../engine/local/compiler';
import type { StageLayer } from '../schema/node-base';

const mediaRoot = `${import.meta.env.BASE_URL}mummys-party/`;

const positions: Record<string, Pick<StageLayer, 'left' | 'bottom' | 'width' | 'height'>> = {
  'pumpkin-lantern': { left: 35, bottom: 29, width: 7 },
  'candle-battery': { left: 36, bottom: 35, width: 3 },
  'paper-bats': { left: 16, bottom: 55, width: 10 },
  sofa: { left: 70, bottom: 12, width: 24 },
  'plugs-six': { left: 12, bottom: 24, width: 7 },
  'plugs-two': { left: 12, bottom: 24, width: 7 },
  'smoke-alarm': { left: 65, bottom: 82, width: 5 },
  'meet-here-sign': { left: 80, bottom: 52, width: 10 },
  'arrow-left': { left: 28, bottom: 2, width: 11 },
  'arrow-right': { left: 65, bottom: 2, width: 11 },
  'fire-engine': { left: 5, bottom: 3, width: 34 },
  'fire-poster': { left: 6, bottom: 32, width: 12 },
  'potion-boilover': { left: 42, bottom: 10, width: 14 },
  'bag-of-sweets': { left: 42, bottom: 5, width: 10 },
  'blackened-pan': { left: 45, bottom: 8, width: 10 },
  'smoke-door': { left: 0, bottom: 0, width: 100, height: 100 },
  'smoke-ceiling': { left: 0, bottom: 0, width: 100, height: 100 },
};

function pathForPiece(name: string): string {
  if (name.startsWith('smoke-')) return `effects/${name}.png`;
  if (name.startsWith('arrow-') || name === 'meet-here-sign') return `svg/${name}.svg`;
  return `pieces/${name}.png`;
}

/** Temporary staging for this supplied demo. The authored story still needs structured piece placements. */
export function stageMummysParty(scene: SceneYaml): SceneStaging {
  if (scene.media.video) return { layers: [], imageForCast };
  const instruction = scene.metadata && typeof scene.metadata === 'object' && 'creative_instruction' in scene.metadata
    ? String(scene.metadata.creative_instruction ?? '') : '';
  const pieces = instruction.split('Pieces:')[1] ?? '';
  const paintedAlarm = /(?:party-room|pootions-shop)\.jpg$/.test(scene.media.image ?? '');
  const layers: StageLayer[] = Object.keys(positions).filter((name) => new RegExp(`\\b${name}\\b`).test(pieces))
    .filter((name) => !(paintedAlarm && name === 'smoke-alarm'))
    .filter((name) => !(scene.id === 'max_s1_03' && name === 'sofa'))
    .map((name) => {
      const position = { ...positions[name]! };
      if (name === 'sofa' && /sofa (?:pushed away|clear of)/.test(pieces)) position.left = 54;
      if (name === 'paper-bats' && /paper-bats (?:moved from the lamp to|on) the wall/.test(pieces)) { position.left = 31; position.bottom = 68; }
      if (name === 'fire-poster' && /shown large, close up/.test(pieces)) { position.left = 37; position.bottom = 10; position.width = 26; }
      return { id: name, imageUrl: `${mediaRoot}${pathForPiece(name)}`, alt: '', ...position, ...(name.startsWith('smoke-') ? { overlay: true } : {}) };
    });
  for (const member of scene.cast ?? []) {
    if (member.character_id !== 'ghost') continue;
    const left = member.slot === 'left' ? 8.5 : member.slot === 'right' ? 64.5 : 36.5;
    const glow = member.pose ? `poses/ghost/ghost-${member.pose}-glow.svg` : 'characters/ghost-glow.svg';
    layers.push({ id: 'ghost-glow', imageUrl: `${mediaRoot}${glow}`, alt: '', left, bottom: 1, width: 27, height: 65 });
  }
  return { layers, imageForCast };
}

function imageForCast(imageUrl: string, pose?: string): string {
  if (!pose) return imageUrl;
  return imageUrl.replace(/\/characters\/([^/]+)\.png$/, (_match, name: string) => `/poses/${name}/${name}-${pose}.png`);
}
