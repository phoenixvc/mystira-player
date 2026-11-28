import { parse } from 'yaml';
import { z } from 'zod';
import corePreview from '../../content/manor/core-preview.story.yaml?raw';
import pumpkinGate from '../../content/manor/pumpkin-gate.story.yaml?raw';
import { LocalEngine } from '../engine/local/LocalEngine';
import type { Engine } from '../engine/types';
import { StoryYamlSchema } from '../schema/story-yaml';

const ConfigSchema = z.object({
  mode: z.literal('local'),
  demo: z.literal(true),
  interactions: z.object({ enabled: z.array(z.enum(['choices', 'hotspots', 'sequence', 'inspect', 'pattern', 'keypad', 'count'])) }),
});

export async function loadLocalDemo(): Promise<{ engine: Engine; activityId: string; isDemoMode: boolean; sceneForProfile: (sceneId: string, profileId: string) => string | undefined; piecesForProfile: (profileId: string) => { id: string; title: string; startSceneId: string }[]; assessment?: { engine: Engine; activityId: string; profiles: { profileId: string; displayName: string }[]; sequenceProfiles: { profileId: string; displayName: string }[]; entries: { practice?: string; assessment?: string; followUp?: string; sequence?: string; inspect?: string } } }> {
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`);
  if (!response.ok) throw new Error(`Could not load player configuration (${response.status}).`);
  const config = ConfigSchema.parse(await response.json());
  const story = StoryYamlSchema.parse(parse(corePreview));
  const engine = new LocalEngine(story, config.interactions.enabled);
  const choicesAvailable = config.interactions.enabled.includes('choices') && config.interactions.enabled.includes('hotspots');
  const sequenceAvailable = config.interactions.enabled.includes('sequence');
  const inspectAvailable = config.interactions.enabled.includes('inspect');
  const assessment = choicesAvailable || sequenceAvailable || inspectAvailable ? StoryYamlSchema.parse(parse(pumpkinGate)) : undefined;
  const assessmentEngine = assessment ? new LocalEngine(assessment, config.interactions.enabled) : undefined;
  const assessmentProfiles = assessmentEngine ? await assessmentEngine.listProfiles() : [];
  const sequenceEntry = sequenceAvailable ? assessmentEngine?.demoSequenceEntry() : undefined;
  const inspectEntry = inspectAvailable ? assessmentEngine?.demoInspectEntry() : undefined;
  return { engine, activityId: story.title, isDemoMode: config.demo, sceneForProfile: (sceneId, profileId) => engine.demoSceneForProfile(sceneId, profileId), piecesForProfile: (profileId) => engine.demoPiecesForProfile(profileId),
    ...(assessment && assessmentEngine ? { assessment: { engine: assessmentEngine, activityId: assessment.lesson?.id ?? assessment.title, profiles: assessmentProfiles, sequenceProfiles: assessmentProfiles.filter((profile) => !!sequenceEntry && assessmentEngine.demoSceneForProfile(sequenceEntry, profile.profileId) === sequenceEntry), entries: { ...(choicesAvailable ? { practice: assessmentEngine.demoPracticeEntry(), ...assessmentEngine.demoAssessmentEntries() } : {}), ...(sequenceEntry ? { sequence: sequenceEntry } : {}), ...(inspectEntry ? { inspect: inspectEntry } : {}) } } } : {}) };
}
