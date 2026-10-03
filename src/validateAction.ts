import fieldValidators from "./utils/fieldValidators";
import directoryValidators from "./utils/directoryValidators";
import { getFilePath, getProcessArg } from "./utils/misc";
import { ActionManifest } from "./defineManifest";

function Run() {
  console.log("\nStarting validation...");
  try {
    const actionId = getProcessArg(0);
    if (!actionId) throw new Error("Missing action ID. Use: npm run validate <action-id>");

    ValidateAction(actionId);

    console.log(`🟢 Action "${actionId}" is valid.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`🔴 Failed: ${message}`);
    process.exitCode = 1;
  }
}

function ValidateAction(actionId: string): void {
  const requiredFiles = ["manifest.ts"];
  const allowedFiles = [...requiredFiles, "manifest.json", "README.md", "releases.json"];

  const requiredDirectories = ["versions"];
  const allowedDirectories = [...requiredDirectories];

  // Validate ID
  fieldValidators.isLowercaseEnglishHyphenated(actionId, "Action ID");

  // Validate folder structure

  const actionFolder = getFilePath(`marketplace/actions/${actionId}`);
  directoryValidators.exists(actionFolder);

  directoryValidators.allowedFilesAndDirectories(actionFolder, allowedFiles, allowedDirectories);

  directoryValidators.requiredFiles(actionFolder, requiredFiles);
  directoryValidators.requiredDirectories(actionFolder, requiredDirectories);

  // Validate manifest
  const manifest = getActionManifestDefinition(actionId);
}

export const getActionManifestDefinition = (actionId: string): ActionManifest => {
  const actionFolder = getFilePath(`marketplace/actions/${actionId}`);

  const manifest: ActionManifest = require(`${actionFolder}/manifest.ts`).default;

  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    throw new Error(`Manifest "manifest.ts" must default-export "defineManifest({..})".`);
  }

  if (!("id" in manifest) || manifest.id !== actionId) {
    throw new Error(`Manifest ID must match action ID "${actionId}".`);
  }
  return manifest;
};

Run();
