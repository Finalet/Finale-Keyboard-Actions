import directoryValidators from "../utils/directoryValidators";
import JSONValidator from "../utils/JSONValidator";
import { compareVersion, getPath, IO, ThrowError } from "../utils/misc";
import { ValidateActionAgainstManifest, ValidateManifest } from "./manifest";
import { dynamicVariables } from "./types";
import type { Manifest, Release, Releases } from "./types";

export default class Action {
  path: string;

  id: string;
  manifest: Manifest;
  releases: Releases | null;
  versionFiles: Record<string, any>;

  private static actionJSONValidator = new JSONValidator(getPath("submission/action.schema.json"));
  private static releasesJSONValidator = new JSONValidator(getPath("submission/releases.schema.json"));

  constructor(id: string) {
    this.path = getPath(`marketplace/actions/${id}`);
    this.id = id;
    this.manifest = this.loadManifest();
    this.releases = this.loadReleases();
    this.versionFiles = this.loadVersionFiles();

    this.verifyFileStructure();
  }

  private loadManifest(): Manifest {
    const manifest: Manifest = IO.loadDefaultExport(`${this.path}/manifest.ts`);

    if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
      ThrowError.actionError(this.id, `manifest.ts must default-export "defineManifest({..})".`);
    }

    if (!("id" in manifest) || manifest.id !== this.id) {
      ThrowError.actionError(this.id, `manifest.ts ID must match action ID "${this.id}".`);
    }

    return manifest;
  }

  private loadReleases(): Releases | null {
    return IO.loadJsonFileIfExists(`${this.path}/releases.json`);
  }

  private loadVersionFiles(): Record<string, any> {
    const entries = IO.loadEntriesFromDirectory(`${this.path}/versions`);

    if (entries.some((entry) => !IO.isEntryJsonFile(entry))) {
      ThrowError.actionError(this.id, `Versions directory must contain only JSON files.`);
    }

    return entries.reduce(
      (acc, entry) => {
        acc[entry.name.slice(0, -5)] = IO.loadJsonFile(`${this.path}/versions/${entry.name}`);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  private verifyFileStructure() {
    const allowedFiles = ["manifest.ts", "manifest.json", "README.md", "releases.json"];
    const allowedDirectories = ["versions"];

    directoryValidators.allowedFilesAndDirectories(this.path, allowedFiles, allowedDirectories);
  }

  Validate() {
    console.log(`\n⏳ Validating "${this.id}".`);

    ValidateManifest(this.manifest);

    if (this.releases !== null) {
      Action.releasesJSONValidator.Validate(this.releases, `[${this.id}]: releases.json`);
    }

    if (!Object.hasOwn(this.versionFiles, this.manifest.version)) {
      ThrowError.actionError(this.id, `Missing "${this.manifest.version}" version file.`);
    }

    for (const [version, action] of Object.entries(this.versionFiles)) {
      Action.actionJSONValidator.Validate(action, `[${this.id}]: ${version} version JSON`);

      if (compareVersion(version, this.manifest.version) === "higher") {
        ThrowError.actionError(this.id, `Action can't contain a version file that is higher (${version}) than the manifest (${this.manifest.version}).`);
      }

      const dynamicVariables = Action.getDynamicVariables(action);
      for (const variable of dynamicVariables) {
        if (action.dynamicVariablePlaceholders[variable] === undefined) {
          ThrowError.actionError(this.id, `Missing dynamic variable placeholder for "${variable}" in version "${version}".`);
        }
      }
    }

    const highestReleaseVersion = this.releases?.releases.reduce((prev, curr) => (compareVersion(curr.version, prev.version) === "higher" ? curr : prev), { version: "0.0.0" })?.version ?? "0.0.0";
    if (compareVersion(this.manifest.version, highestReleaseVersion) === "lower") {
      ThrowError.actionError(this.id, `New version "${this.manifest.version}" cannot be lower than the highest released version "${highestReleaseVersion}".`);
    }

    ValidateActionAgainstManifest(this.versionFiles[this.manifest.version], this.manifest);

    console.log(`✅ Action "${this.id}" is valid.`);
  }

  Release() {
    console.log(`\n⏳ Releasing "${this.id}".`);

    const versionToRelease = this.manifest.version;
    if (this.releases?.releases.some((release) => release.version === versionToRelease)) {
      ThrowError.actionError(this.id, `Version "${versionToRelease}" has already been released.`);
    }

    const actionJSON = this.versionFiles[versionToRelease];

    const newRelease: Release = {
      version: this.manifest.version,
      releaseDate: new Date().toISOString(),
      services: this.manifest.services,
      variables: this.manifest.variables,
      dynamicVariables: Action.getDynamicVariables(actionJSON),
    };

    const releases = this.releases ?? { id: this.id, releases: [] };
    releases.releases.unshift(newRelease);

    IO.writeJsonFile(`${this.path}/manifest.json`, this.manifest);
    IO.writeJsonFile(`${this.path}/releases.json`, releases);

    console.log(`✅ Action "${this.id}" was released.`);
  }

  private static getDynamicVariables = (from: any): string[] => {
    const extractVariables = (from: string): string[] => {
      return dynamicVariables.filter((variable) => from.includes(variable));
    };

    if (from === null || typeof from !== "object") return [];

    const variables = Object.entries(from).flatMap(([key, value]) => {
      if (key === "request" && value !== null && typeof value === "object") {
        return extractVariables(JSON.stringify(value));
      }
      return Action.getDynamicVariables(value);
    });

    return [...new Set(variables)];
  };
}
