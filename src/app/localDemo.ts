import { parse } from 'yaml';
import { z } from 'zod';
import corePreview from '../../content/manor/core-preview.story.yaml?raw';
import { LocalEngine } from '../engine/local/LocalEngine';
import type { Engine } from '../engine/types';
import { StoryYamlSchema } from '../schema/story-yaml';

const ConfigSchema = z.object({
  mode: z.literal('local'),
  demo: z.literal(true),
  interactions: z.object({ enabled: z.array(z.enum(['choices', 'hotspots', 'sequence', 'inspect', 'pattern', 'keypad', 'count'])) }),
});

export async function loadLocalDemo(): Promise<{ engine: Engine; activityId: string; isDemoMode: boolean; sceneForProfile: (sceneId: string, profileId: string) => string | undefined }> {
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`);
  if (!response.ok) throw new Error(`Could not load player configuration (${response.status}).`);
  const config = ConfigSchema.parse(await response.json());
  const story = StoryYamlSchema.parse(parse(corePreview));
  const engine = new LocalEngine(story, config.interactions.enabled);
  return { engine, activityId: story.title, isDemoMode: config.demo, sceneForProfile: (sceneId, profileId) => engine.demoSceneForProfile(sceneId, profileId) };
}
