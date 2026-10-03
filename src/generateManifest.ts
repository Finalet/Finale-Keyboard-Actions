import { writeFileSync } from "node:fs";
import fieldValidators from "./utils/fieldValidators";
import { getPath } from "./utils/misc";
import { getActionManifestDefinition } from "./validateAction";

export default function GenerateActionManifest(actionId: string): void {
  fieldValidators.isLowercaseEnglishHyphenated(actionId, "Action ID");

  const manifest = getActionManifestDefinition(actionId);
  const actionFolder = getPath(`marketplace/actions/${actionId}`);

  writeFileSync(`${actionFolder}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
