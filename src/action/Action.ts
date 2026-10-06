import directoryValidators from "../utils/directoryValidators";
import JSONValidator from "../utils/JSONValidator";
import { compareVersion, getPath, IO, ThrowError } from "../utils/misc";
import { ValidateManifest } from "./manifest";

export default class Action {
  path: string;

  id: string;
  manifest: Manifest;
  releases: Releases | null;
  versionFiles: Record<string, any>;

  private static actionValidator = new JSONValidator(getPath("submission/action.schema.json"));
  private static releasesValidator = new JSONValidator(getPath("submission/releases.schema.json"));

  static availableStatuses = ["active", "deprecated"] as const;
  static availableTags = ["Requires authentication", "Paid", "Free"] as const;

  static dynamicVariables = [
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

  validate() {
    console.log(`\n⏳ Validating "${this.id}".`);

    ValidateManifest(this.manifest);

    const releasesJson = IO.loadJsonFileIfExists<Releases>(`${this.path}/releases.json`);
    if (releasesJson !== null) {
      Action.releasesValidator.Validate(releasesJson, `[${this.id}]: releases.json`);
    }

    for (const version of Object.keys(this.versionFiles)) {
      if (compareVersion(version, this.manifest.version) === "higher") {
        ThrowError.actionError(this.id, `Action can't contain a version file that is higher (${version}) than the manifest (${this.manifest.version}).`);
      }

      const action = IO.loadJsonFile(`${this.path}/versions/${version}.json`);
      Action.actionValidator.Validate(action, `[${this.id}]: ${version} version JSON`);

      const dynamicVariables = Action.getDynamicVariables(action);
      for (const variable of dynamicVariables) {
        if (action.dynamicVariablePlaceholders[variable] === undefined) {
          ThrowError.actionError(this.id, `Missing dynamic variable placeholder for "${variable}" in version "${version}".`);
        }
      }
    }

    if (!this.versionFiles[this.manifest.version]) {
      ThrowError.actionError(this.id, `Missing "${this.manifest.version}" version file.`);
    }

    console.log(`✅ Action "${this.id}" is valid.`);
  }

  release() {
    console.log(`\n⏳ Releasing "${this.id}".`);

    const versionToRelease = this.manifest.version;
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
      return Action.dynamicVariables.filter((variable) => from.includes(variable));
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

export interface Manifest {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  tags: ActionTag[];
  version: string;
  status: ActionStatus;
  services: ServiceDetails[];
  variables?: Record<string, VariableDetails>;
}

export interface VariableDetails {
  name: string;
  description: string;
}

export interface ServiceDetails {
  name: string;
  description: string;
  origins: string[];
}

export interface Releases {
  id: string;
  releases: Release[];
}

export interface Release {
  version: string;
  releaseDate: string;
  services: ServiceDetails[];
  variables?: Record<string, VariableDetails>;
  dynamicVariables: string[];
}

export type ActionStatus = (typeof Action.availableStatuses)[number];
export type ActionTag = (typeof Action.availableTags)[number];
