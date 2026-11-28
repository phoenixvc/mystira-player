"""Validate a Mystira story YAML 2.1 file: JSON Schema plus the cross-reference rules in content-format.md section 10."""
import json
import sys

import yaml
from jsonschema import Draft7Validator

class UniqueKeyLoader(yaml.SafeLoader):
    pass


def unique_mapping(loader, node):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node)
        if key in mapping:
            raise yaml.constructor.ConstructorError(None, None, f"duplicate YAML key '{key}'", key_node.start_mark)
        mapping[key] = loader.construct_object(value_node)
    return mapping


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)

schema_path, content_path = sys.argv[1], sys.argv[2]
try:
    with open(content_path, encoding="utf-8") as content_file:
        doc = yaml.load(content_file, Loader=UniqueKeyLoader)
except yaml.YAMLError as cause:
    print(f"{content_path}: 1 problem(s)\n  - yaml: {cause}")
    sys.exit(1)
errors: list[str] = []

for e in sorted(Draft7Validator(json.load(open(schema_path))).iter_errors(doc), key=str):
    errors.append(f"schema: {'/'.join(map(str, e.path))}: {e.message}")

scenes = {s["id"]: s for s in doc.get("scenes", [])}
chars = {c.get("id") for c in doc.get("characters", [])}
lesson = doc.get("lesson") or {}
check_scene_ids = {q["scene"] for c in lesson.get("checks", []) for q in c.get("questions", [])}


def scene(sid: str, where: str):
    if sid not in scenes:
        errors.append(f"{where}: scene '{sid}' does not exist")
        return None
    return scenes[sid]


def answer_resolves(sc: dict, ans: dict, where: str) -> None:
    branches = {b.get("id") for b in sc.get("branches", [])}
    objects = {o["id"] for o in sc.get("objects", [])}
    inter = sc.get("interaction") or {}
    if "branch" in ans and ans["branch"] not in branches:
        errors.append(f"{where}: answer branch '{ans['branch']}' not in scene '{sc['id']}'")
    if "object" in ans and ans["object"] not in objects:
        errors.append(f"{where}: answer object '{ans['object']}' not in scene '{sc['id']}'")
    if "order" in ans:
        items = {i["id"] for i in inter.get("items", [])} if inter.get("kind") == "sequence" else set()
        if set(ans["order"]) != items:
            errors.append(f"{where}: answer order must name every sequence item of '{sc['id']}' exactly once")
    if "parts" in ans:
        parts = {p["id"] for p in inter.get("document", {}).get("parts", [])} if inter.get("kind") == "inspect" else set()
        if not set(ans["parts"]) <= parts:
            errors.append(f"{where}: answer parts not all in inspect document of '{sc['id']}'")


def boxes_ok(boxes: list[tuple[str, list[float]]], where: str) -> None:
    for name, b in boxes:
        if len(b) != 4:
            continue
        x, y, w, h = b
        if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > 1 or y + h > 1:
            errors.append(f"{where}: box '{name}' is not inside the picture")
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            (n1, a), (n2, b) = boxes[i], boxes[j]
            if len(a) == 4 and len(b) == 4 and a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]:
                errors.append(f"{where}: boxes '{n1}' and '{n2}' overlap")


for sc in scenes.values():
    w = f"scene '{sc['id']}'"
    for b in sc.get("branches", []):
        if b.get("next_scene") and b["next_scene"] not in scenes:
            errors.append(f"{w}: branch '{b.get('id')}' goes to missing scene '{b['next_scene']}'")
        if b.get("object_id") and b["object_id"] not in {o["id"] for o in sc.get("objects", [])}:
            errors.append(f"{w}: branch '{b.get('id')}' targets missing object '{b['object_id']}'")
    if sc.get("next_scene") and sc["next_scene"] not in scenes:
        errors.append(f"{w}: next_scene '{sc['next_scene']}' does not exist")
    for line in sc.get("lines", []):
        if line["speaker"] not in chars and line["speaker"] != "narrator":
            errors.append(f"{w}: speaker '{line['speaker']}' is not a character")
    for c in sc.get("cast", []):
        if c["character_id"] not in chars:
            errors.append(f"{w}: cast member '{c['character_id']}' is not a character")
    if sc.get("practice"):
        answer_resolves(sc, sc["practice"]["answer"], f"{w} practice")
        outcomes = sc["practice"].get("outcomes") or {}
        if outcomes and sc.get("interaction"):
            errors.append(f"{w}: practice outcomes are only supported for choices and hotspots")
        correct = sc["practice"]["answer"].get("branch") or sc["practice"]["answer"].get("object")
        is_hotspot = any(b.get("object_id") for b in sc.get("branches", []))
        ids = [b.get("object_id") if is_hotspot else b.get("id") for b in sc.get("branches", [])]
        if outcomes and (correct not in ids or not ids or any(not item for item in ids) or len(ids) != len(set(ids))):
            errors.append(f"{w}: practice outcomes require unique explicit choice or hotspot IDs")
        if outcomes and is_hotspot:
            bounded = {o["id"] for o in sc.get("objects", []) if len((o.get("geometry") or {}).get("bounds") or []) == 4}
            for item in ids:
                if item not in bounded:
                    errors.append(f"{w}: outcome hotspot '{item}' needs an object with rectangular bounds")
        for outcome_id, outcome in outcomes.items():
            if outcome_id not in ids:
                errors.append(f"{w}: outcome ID '{outcome_id}' does not match a selectable answer")
            if "on_correct" in outcome and (is_hotspot or outcome_id != correct):
                errors.append(f"{w}: on_correct is only allowed for the correct choice ID")
            if "on_wrong" in outcome and outcome_id == correct:
                errors.append(f"{w}: the correct answer cannot have on_wrong feedback")
    plain_choices = [b for b in sc.get("branches", []) if not b.get("object_id")]
    if sc.get("type") == "choice" and plain_choices and not 2 <= len(plain_choices) <= 4:
        errors.append(f"{w}: choices must number 2 to 4")
    targets = [o for o in sc.get("objects", []) if (o.get("geometry") or {}).get("bounds")]
    if targets and not 2 <= len(targets) <= 6:
        errors.append(f"{w}: tap targets must number 2 to 6")
    boxes_ok([(o["id"], o["geometry"]["bounds"]) for o in targets], w)
    if sc["id"] in check_scene_ids:
        for bad in ("practice", "task"):
            if sc.get(bad):
                errors.append(f"{w}: a check scene may not have '{bad}'")
        if any(o.get("reveal") for o in sc.get("objects", [])):
            errors.append(f"{w}: a check scene may not have 'reveal'")

for p in lesson.get("pieces", []):
    for sid in p.get("scenes", []):
        scene(sid, f"piece '{p['id']}'")
    for v in p.get("versions", []):
        for sid in v["scenes"]:
            scene(sid, f"piece '{p['id']}' version '{v['id']}'")
for c in lesson.get("checks", []):
    for q in c["questions"]:
        sc = scene(q["scene"], f"check '{c['id']}' question '{q['id']}'")
        if sc:
            answer_resolves(sc, q["answer"], f"check '{c['id']}' question '{q['id']}'")
        for r in q.get("research", []):
            rs = scene(r, f"question '{q['id']}' research")
            if rs and not rs.get("research"):
                errors.append(f"question '{q['id']}': research scene '{r}' has no research field")
if lesson.get("result"):
    scene(lesson["result"]["scene"], "lesson result")

pieces = {p["id"]: p for p in lesson.get("pieces", [])}
for prof in (doc.get("demo") or {}).get("profiles", []):
    for pid, vid in (prof.get("versions") or {}).items():
        if pid not in pieces or vid not in {v["id"] for v in pieces[pid].get("versions", [])}:
            errors.append(f"demo '{prof['id']}': version '{pid}: {vid}' does not exist")
    for pid in (prof.get("rationale") or {}):
        if pid not in pieces:
            errors.append(f"demo '{prof['id']}': rationale for unknown piece '{pid}'")

print(f"{content_path}: {len(errors)} problem(s)")
for e in errors:
    print("  -", e)
sys.exit(1 if errors else 0)
