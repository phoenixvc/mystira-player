import type { Interaction } from '../schema/interactions';

type ChoiceLocal = NonNullable<Extract<Interaction, { type: 'choices' }>['local']>;
type HotspotLocal = NonNullable<Extract<Interaction, { type: 'hotspots' }>['local']>;

export function practiceFeedback(local: ChoiceLocal | HotspotLocal, selectedId: string, wrongTries: number) {
  const keyed = local.outcomes?.[selectedId];
  const message = keyed && 'onWrong' in keyed ? keyed.onWrong
    : local.feedback?.onWrong?.[wrongTries - 1] ?? local.feedback?.hint ?? { text: 'Not yet. Try again.' };
  return { message, revealTarget: wrongTries >= (local.feedback?.revealAfter ?? 3) };
}
