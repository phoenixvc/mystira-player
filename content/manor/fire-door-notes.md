# fire-door.story.yaml: notes for Jurie

The 25 November version passed `scripts/check-content.py` with 0 problems. The 28 November update was checked by hand against the rules in the content format, section 10; please run the checker on it. It is made from the agreed demo page: https://claude.ai/artifact/GutsFX6eeRLUcnvLNySS1e

Where the page does something the format cannot hold yet, the YAML uses the nearest thing the format has, and the page version is listed here. Nothing below is new content: all of it is on the page.

## 1. A line and a changed picture after a right answer

Every screen on the page shows the fix and a line before Next. In the YAML each of these is a short `narrative` scene with the suffix `_after`, reached by `next_scene` from the screen before it. What the picture shows is in its `metadata.creative_instruction`, starting "We see:". If the player can do this inside one scene, these scenes fold back into the screen before them.

## 2. Stretch screens, written in their fallback form

- `spot_table`, `spot_corner`, `spot_backdoor`, `spot_lights`: STRETCH count: one screen of the whole room, find all four. Fallback used here: four tap screens.
- `zoe_s3_11`: STRETCH keypad: dial 112 and tap Call in this European setting. Wrong numbers ring Spider, then Witch’s Poo-tions, then the ghost says “It is 1, 1, 2.” Fallback used here: choices with three numbers. Other regions need their local emergency number before release.
- `max_s3_12`: STRETCH pattern: watch the path light up, then tap it: along the wall, past the sofa, past the coats, the back door. Wrong tiles: the hall door, the fireplace, the cupboard. Fallback used here: choices.
- `max_s3_14`: STRETCH keypad: dial 112 and tap Call in this European setting. Wrong numbers ring Spider, then Witch’s Poo-tions, then the ghost says “It is 1, 1, 2.” Fallback used here: choices with three numbers. Other regions need their local emergency number before release.

## 3. A wrong line for each button

The format gives wrong-answer lines by try (`practice.on_wrong`). On the page each wrong button has its own line. The YAML uses one line that is true for any wrong button; the page lines are:

**`zoe_s3_07`, The party**
- "Go and find the fire": ghost: "Never go looking for the fire. The alarm means out."
- "Finish my toffee apple": ghost: "No time for toffee apples! The alarm is beeping."

**`zoe_s3_08`, Smoke under the ceiling**
- "Run, head up": ghost: "Head up? Your head would be right in the smoke."
- "Hold my breath": ghost: "You cannot hold your breath all the way out. Get low."

**`zoe_s3_09`, Smoke pours in through the hall door**
- "Through the hall": ghost: "The hall is full of smoke! Remember our second way out."
- "Hide in the cupboard": ghost: "Never hide in a fire. Get out."

**`zoe_s3_10`, The lamp post. Everybody is out**
- "Be quick then": skeleton: "Into the smoke? Even I think that is silly."
- "Send the bat": bat: "Me?! I am small, not fireproof! Nobody goes back in."

**`zoe_s3_12`, On the phone**
- "Hello, how are you?": the fire service: "I am fine, thank you! But what is wrong, and where?"
- "Guess where we are": the fire service: "Erm. The moon? Please tell us what is wrong, and where."

**`max_s1_01`, The mummy holds up the pumpkin lantern**
- "Add more candles": mummy: "More candles? That means more flames!"
- "Use a smaller candle": mummy: "Smaller, but it is still a real flame."

**`max_s1_02`, The mummy points at the lamp**
- "Add more bats": mummy: "More paper on a hot lamp? Hmm."
- "Use a red bulb": mummy: "A red bulb still gets hot. The bats are still on it."

**`max_s1_03`, The mummy leans on the sofa**
- "Add a chair too": mummy: "A chair too? Then nobody can use that door."
- "Add some cushions": mummy: "Cushions on the sofa still block the door."

**`max_s1_04`, The mummy shows off the party lights**
- "Add one more": mummy: "Seven plugs? It feels warm already!"
- "Hide it with a rug": mummy: "Under a rug it gets even hotter."

**`max_s2_07`, The party room, with both doors**
- "Up the chimney": mummy: "Up the chimney? I would get stuck. I am mostly bandage."
- "Through the cat flap": mummy: "The cat flap? Only my head fits."

**`max_s2_08`, The front garden**
- "The front step": mummy: "The front step is right next to the house. Too close."
- "The thorn bush": mummy: "The thorn bush? Ouch. Nobody wants to wait in there."

**`max_s2_09`, The mummy with his phone**
- "The pizza shop": mummy: "The pizza shop? They bring pizza, not fire engines."

**`max_s3_12`, Smoke comes through the hall door**
- "Through the hall door": ghost: "Not into the smoke!"
- "Hide in the cupboard": ghost: "Never hide in a fire."

**`max_s3_13`, The lamp post. Everybody is out**
- "Be quick then": vampire: "Into the smoke? For sweets? Even I know better."
- "Send the bat": bat: "Me?! I am small, not fireproof! Nobody goes back in."

**`max_s3_15`, The mummy is on the phone. He panics**
- "Our sweets are inside": the fire service: "We do not rescue sweets. What is wrong, and where?"
- "Guess where I am": the fire service: "Erm. The moon? Please tell us what is wrong, and where."

## 4. Other things the format does not cover yet

- **Put in order:** on the page the cards that are right stay in place, and the hint is about the first wrong card. The YAML has one hint.
- **The result screen:** on the page the ghost adds a second line that depends on the first-try score (3 of 3: "Three out of three on your first try!"; 1 or 2: "And what you did not know, you found out by yourself."; 0: "You found out all three by yourself."). The YAML has only the fixed line.
- **The assessment intro** (`assessment_intro`) is not in any piece or check, because the lesson block has no place for it. It should play before question 1.
- **The smoke alarm** is a narrator line, "BEEP! BEEP! BEEP!". If the player can play a sound effect, it should be one.
- **Tap boxes** are placeholders in a row along the bottom of each picture. They get real positions when the pictures exist.
- **No key** on the result, on purpose.

## 5. Media (updated 28 November 2026)

Paths assume the zip `mummys-party-all-pictures.zip` is unpacked into `assets/`, keeping its folders.

- **Backgrounds:** `media.image` on every scene is a real background, `assets/backgrounds/<name>.jpg`. The cover is `party-room-full.jpg`.
- **Characters:** each character's `image` is `assets/characters/<name>.png`. The firefighter is `firefighter.png`, the shop cat `shop-cat.png`. The fire service (`operator`) has no picture; it is only a voice on the phone.
- **Poses:** each scene has a `cast` with up to three characters. `pose` is the end of the pose file name: `pose: shocked` on the mummy means `assets/poses/mummy/mummy-shocked.png`. No `pose` means the character's own picture.
- **Pieces:** the format has no field for them, so the pieces on each screen are listed in `metadata.creative_instruction`, after "Pieces:". They are in `assets/pieces/`, `assets/effects/` and `assets/svg/`.
- **The ghost** comes as a clean PNG plus a glow SVG of the same size (`ghost-glow.svg`, `ghost-<pose>-glow.svg`), laid underneath.
- **The party room:** `party-room.jpg` has no hazards painted in; the hazards are pieces (pumpkin-lantern, paper-bats, sofa, plugs-six), swapped as each is fixed (candle-battery, paper-bats on the wall, sofa moved, plugs-two). `party-room-full.jpg` has them all painted in and is used only behind the opening video.
- **`max_s1_03`:** the `mummy-leaning-sofa` pose has the sofa in it, so no separate sofa piece on that screen.
- **The witch:** when she is tapped in a research screen, she shows `witch-shrugging`.
- **Not placed on any screen yet:** `bag-of-sweets`, `potion-boilover` and `blackened-pan`. The pan is in the closing video. `fire-engine` is on the result screen.
- **Videos:** `assets/opening_video.mp4` (about 13 seconds) and `assets/end_video.mp4` (about 16 seconds).
