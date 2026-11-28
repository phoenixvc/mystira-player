import { parse } from 'yaml';
import { z } from 'zod';
import corePreview from '../../content/manor/core-preview.story.yaml?raw';
import pumpkinGate from '../../content/manor/pumpkin-gate.story.yaml?raw';
import { LocalEngine } from '../engine/local/LocalEngine';
import type { Engine } from '../engine/types';
import { StoryYamlSchema } from '../schema/story-yaml';
import { stageMummysParty } from './mummysPartyStaging';

const ConfigSchema = z.object({
  mode: z.literal('local'),
  demo: z.literal(true),
  interactions: z.object({ enabled: z.array(z.enum(['choices', 'hotspots', 'sequence', 'inspect', 'pattern', 'keypad', 'count'])) }),
});

function resolveMummyMedia<T>(value: T): T {
  if (typeof value === 'string' && value.startsWith('assets/')) {
    const path = value.slice('assets/'.length);
    return `${import.meta.env.BASE_URL}mummys-party/${path.endsWith('.mp4') ? `videos/${path}` : path}` as T;
  }
  if (Array.isArray(value)) return value.map(resolveMummyMedia) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveMummyMedia(item)])) as T;
  return value;
}

export async function loadLocalDemo(kind: 'pumpkin-gate' | 'mummys-party' = 'pumpkin-gate'): Promise<{ engine: Engine; activityId: string; isDemoMode: boolean; fullLesson?: boolean; sceneForProfile: (sceneId: string, profileId: string) => string | undefined; piecesForProfile: (profileId: string) => { id: string; title: string; startSceneId: string }[]; assessment?: { engine: Engine; activityId: string; profiles: { profileId: string; displayName: string }[]; sequenceProfiles: { profileId: string; displayName: string }[]; inspectProfiles: { profileId: string; displayName: string }[]; entries: { practice?: string; assessment?: string; followUp?: string; sequence?: string; inspect?: string } } }> {
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`);
  if (!response.ok) throw new Error(`Could not load player configuration (${response.status}).`);
  const config = ConfigSchema.parse(await response.json());
  const required = ['choices', 'hotspots', 'sequence', 'inspect'] as const;
  const fullLesson = required.every((kind) => config.interactions.enabled.includes(kind));
  const story = kind === 'mummys-party'
    ? StoryYamlSchema.parse(resolveMummyMedia(parse((await import('../../content/manor/fire-door.story.yaml?raw')).default)))
    : StoryYamlSchema.parse(parse(fullLesson ? pumpkinGate : corePreview));
  const engine = new LocalEngine(story, config.interactions.enabled, kind === 'mummys-party' ? stageMummysParty : undefined);
  const choicesAvailable = config.interactions.enabled.includes('choices') && config.interactions.enabled.includes('hotspots');
  const sequenceAvailable = config.interactions.enabled.includes('sequence');
  const inspectAvailable = config.interactions.enabled.includes('inspect');
  const assessment = choicesAvailable || sequenceAvailable || inspectAvailable ? kind === 'mummys-party' || fullLesson ? story : StoryYamlSchema.parse(parse(pumpkinGate)) : undefined;
  const assessmentEngine = assessment ? assessment === story ? engine : new LocalEngine(assessment, config.interactions.enabled) : undefined;
  const assessmentProfiles = assessmentEngine ? await assessmentEngine.listProfiles() : [];
  const sequenceEntry = sequenceAvailable ? assessmentEngine?.demoSequenceEntry() : undefined;
  const inspectEntry = inspectAvailable ? assessmentEngine?.demoInspectEntry() : undefined;
  const inspectProfileIds = new Set(assessmentEngine?.demoInspectProfileIds() ?? []);
  return { engine, activityId: story.lesson?.id ?? story.title, isDemoMode: config.demo, fullLesson, sceneForProfile: (sceneId, profileId) => engine.demoSceneForProfile(sceneId, profileId), piecesForProfile: (profileId) => engine.demoPiecesForProfile(profileId),
    ...(assessment && assessmentEngine ? { assessment: { engine: assessmentEngine, activityId: assessment.lesson?.id ?? assessment.title, profiles: assessmentProfiles, sequenceProfiles: assessmentProfiles.filter((profile) => !!sequenceEntry && assessmentEngine.demoSceneForProfile(sequenceEntry, profile.profileId) === sequenceEntry), inspectProfiles: assessmentProfiles.filter((profile) => inspectProfileIds.has(profile.profileId)), entries: { ...(choicesAvailable ? { practice: assessmentEngine.demoPracticeEntry(), ...assessmentEngine.demoAssessmentEntries() } : {}), ...(sequenceEntry ? { sequence: sequenceEntry } : {}), ...(inspectEntry ? { inspect: inspectEntry } : {}) } } } : {}) };
}
