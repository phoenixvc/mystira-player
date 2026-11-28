import translations from '../../content/manor/fire-door.af.preview.json';
import type { StoryYaml } from '../schema/story-yaml';

type SceneTranslation = {
  title: string;
  description: string;
  lines?: string[];
  task?: string;
  objects?: Record<string, string[]>;
  choices?: Record<string, string>;
  onWrong?: string[];
};

export function firstLessonSceneIds(story: StoryYaml): Set<string> {
  const pieces = story.lesson?.pieces.slice(0, 2) ?? [];
  return new Set(pieces.flatMap((piece) => piece.scenes ?? piece.versions?.flatMap((version) => version.scenes) ?? []));
}

/** Localized preview copy only; IDs, answer keys, media and staging notes stay authored. */
export function applyMummysPartyAfrikaans(story: StoryYaml): StoryYaml {
  const copy = translations.scenes as Record<string, SceneTranslation>;
  const ids = firstLessonSceneIds(story);
  for (const id of ids) if (!copy[id]) throw new Error(`Missing Afrikaans preview copy for ${id}.`);
  story.title = translations.title;
  story.description = translations.description;
  for (const piece of story.lesson?.pieces ?? []) {
    const title = (translations.pieces as Record<string, string>)[piece.id];
    if (title) piece.title = title;
  }
  if (story.lesson) {
    story.lesson.pieces = story.lesson.pieces.slice(0, 2);
    story.lesson.checks = undefined;
    story.lesson.result = undefined;
  }
  for (const character of story.characters) {
    if (character.id === 'ghost') character.name = 'Spookie';
    if (character.id === 'mummy') character.name = 'Mummie';
  }
  for (const scene of story.scenes) {
    if (!ids.has(scene.id)) continue;
    const translated = copy[scene.id]!;
    scene.title = translated.title;
    scene.description = translated.description;
    if ((scene.lines?.length ?? 0) !== (translated.lines?.length ?? 0)) throw new Error(`Afrikaans line count differs for ${scene.id}.`);
    scene.lines?.forEach((line, index) => { line.text = translated.lines![index]!; });
    if (scene.task) {
      if (!translated.task) throw new Error(`Missing Afrikaans task for ${scene.id}.`);
      scene.task.text = translated.task;
    }
    for (const object of scene.objects ?? []) {
      const text = translated.objects?.[object.id];
      if (text?.length !== 2) throw new Error(`Missing Afrikaans object ${scene.id}/${object.id}.`);
      object.label = text[0]!;
      if (object.reveal) object.reveal.text = text[1]!;
    }
    for (const branch of scene.branches) {
      const choice = branch.id && translated.choices?.[branch.id]
        || branch.object_id && translated.objects?.[branch.object_id]?.[0];
      if (!translated.choices && !translated.objects) continue;
      if (!choice) throw new Error(`Missing Afrikaans choice ${scene.id}/${branch.id}.`);
      branch.choice = choice;
    }
    if (scene.practice?.on_wrong) {
      if (scene.practice.on_wrong.length !== translated.onWrong?.length) throw new Error(`Afrikaans feedback count differs for ${scene.id}.`);
      scene.practice.on_wrong.forEach((item, index) => { item.text = translated.onWrong![index]!; });
    }
  }
  return story;
}
