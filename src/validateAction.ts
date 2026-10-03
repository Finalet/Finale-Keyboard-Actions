import { readdirSync } from "node:fs";
import Ajv from "ajv/dist/2020";
import fieldValidators from "./utils/fieldValidators";
import directoryValidators from "./utils/directoryValidators";
import { loadJsonFile, getPath, getProcessArg, compareVersion } from "./utils/misc";
import { ActionManifest } from "./defineManifest";

function Run() {
  console.log("\nStarting validation...");
  try {
    const actionId = getProcessArg(0);
    if (!actionId) throw new Error("Missing action ID. Use: npm run validate <action-id>");

    ValidateAction(actionId);

    console.log(`✅ Action "${actionId}" is valid.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed: ${message}`);
    process.exitCode = 1;
  }
}

export default function ValidateAction(actionId: string): void {
  const requiredFiles = ["manifest.ts"];
  const allowedFiles = [...requiredFiles, "manifest.json", "README.md", "releases.json"];

  const requiredDirectories = ["versions"];
  const allowedDirectories = [...requiredDirectories];

  // Validate ID
  fieldValidators.isLowercaseEnglishHyphenated(actionId, "Action ID");

  // Validate folder structure

  const actionFolder = getPath(`marketplace/actions/${actionId}`);
  directoryValidators.exists(actionFolder);

  directoryValidators.allowedFilesAndDirectories(actionFolder, allowedFiles, allowedDirectories);

  directoryValidators.requiredFiles(actionFolder, requiredFiles);
  directoryValidators.requiredDirectories(actionFolder, requiredDirectories);

  // Validate manifest
  const manifest = getActionManifestDefinition(actionId);

  // Validate versions

  const versionsFolder = `${actionFolder}/versions`;

  directoryValidators.requiredFiles(versionsFolder, [`${manifest.version}.json`]);

  const versionFiles = readdirSync(versionsFolder, { withFileTypes: true });

  const schema = loadJsonFile(getPath("submission/action.schema.json"));
  const ajv = new Ajv({ strict: true, allErrors: true });
  const validate = ajv.compile(schema);

  for (const file of versionFiles) {
    if (!file.isFile() || !file.name.endsWith(".json")) {
      throw new Error(`Unexpected entry in versions directory: "${file.name}". Only JSON files are allowed.`);
    }

    let fileVersion = file.name.slice(0, -5);
    fieldValidators.isValidVersion(fileVersion, `Version filename "${file.name}"`);

    if (compareVersion(fileVersion, manifest.version) === "higher") {
      throw new Error(`Version file ${file.name} cannot be higher than the manifest version "${manifest.version}".`);
    }

    const action = loadJsonFile(`${versionsFolder}/${file.name}`);

    if (!validate(action)) {
      throw new Error(`Version file "${file.name}" does not match the action schema: ${ajv.errorsText(validate.errors)}`);
    }
  }
}

export const getActionManifestDefinition = (actionId: string): ActionManifest => {
  const actionFolder = getPath(`marketplace/actions/${actionId}`);

  const manifest: ActionManifest = require(`${actionFolder}/manifest.ts`).default;

  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    throw new Error(`Manifest "manifest.ts" must default-export "defineManifest({..})".`);
  }

  if (!("id" in manifest) || manifest.id !== actionId) {
    throw new Error(`Manifest ID must match action ID "${actionId}".`);
  }
  return manifest;
};

if (require.main === module) {
  Run();
}
