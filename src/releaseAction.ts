import { ServiceDetails, VariableDetails } from "@/src/defineManifest";
import ValidateAction, { getActionManifestDefinition } from "./validateAction";
import { getPath, getProcessArg, JSONtoString, loadJsonFile, loadJsonIfExists } from "./utils/misc";
import { writeFileSync } from "fs";

function Run() {
  try {
    const actionId = getProcessArg(0);
    if (!actionId) throw new Error("Missing action ID. Use: npm run release <action-id>");

    console.log(`\nReleasing action "${actionId}"`);

    ReleaseAction(actionId);

    console.log(`✅ Action "${actionId}" ${getActionManifestDefinition(actionId).version} has been released.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed: ${message}`);
    process.exitCode = 1;
  }
}

function ReleaseAction(actionId: string) {
  ValidateAction(actionId);

  const manifest = getActionManifestDefinition(actionId);
  const actionFolder = getPath(`marketplace/actions/${actionId}`);
  const actionJson = loadJsonFile(`${actionFolder}/versions/${manifest.version}.json`);

  const newRelease: ActionRelease = {
    version: manifest.version,
    releaseDate: new Date().toISOString(),
    services: manifest.services,
    variables: manifest.variables,
    dynamicVariables: getRequestDynamicVariables(actionJson),
  };

  const releasesFilePath = `${actionFolder}/releases.json`;

  let releases: ActionReleases = loadJsonIfExists<ActionReleases>(releasesFilePath) ?? { id: actionId, releases: [] };

  releases.releases.push(newRelease);

  writeFileSync(`${actionFolder}/manifest.json`, JSONtoString(manifest), "utf8");
  writeFileSync(releasesFilePath, JSONtoString(releases), "utf8");
}

const getDynamicVariables = (from: string): string[] => {
  const dynamicVariables = [
    "{selected_text}",
    "{previous_word}",
    "{previous_2_words}",
    "{previous_3_words}",
    "{clipboard_text}",
    "{keyboard_language}",
    "{keyboard_language_code}",
    "{keyboard_locale}",
    "{device_timezone_name}",
    "{device_timezone_utc}",
  ];
  return dynamicVariables.filter((variable) => from.includes(variable));
};

const getRequestDynamicVariables = (from: any): string[] => {
  if (from === null || typeof from !== "object") return [];

  const variables = Object.entries(from).flatMap(([key, value]) => {
    if (key === "request" && value !== null && typeof value === "object") {
      return getDynamicVariables(JSON.stringify(value));
    }
    return getRequestDynamicVariables(value);
  });

  return [...new Set(variables)];
};

export interface ActionReleases {
  id: string;
  releases: ActionRelease[];
}

export interface ActionRelease {
  version: string;
  releaseDate: string;
  services: ServiceDetails[];
  variables?: Record<string, VariableDetails>;
  dynamicVariables: string[];
}

if (require.main === module) {
  Run();
}
