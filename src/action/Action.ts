import Ajv, { ValidateFunction } from "ajv/dist/2020";
import directoryValidators from "../utils/directoryValidators";
import { compareVersion, getPath, IO, ThrowError } from "../utils/misc";
import { ValidateManifest } from "./manifest";

export default class Action {
  path: string;

  id: string;
  manifest: Manifest;
  releases: Releases | null;
  versionFiles: Record<string, any>;

  private actionValidator: {
    validate: ValidateFunction<unknown>;
    ajv: Ajv;
  };

  static availableStatuses = ["active", "deprecated"] as const;
  static availableTags = ["Requires authentication", "Paid", "Free"] as const;

  constructor(id: string) {
    this.path = getPath(`marketplace/actions/${id}`);
    this.id = id;
    this.manifest = this.loadManifest();
    this.releases = this.loadReleases();
    this.versionFiles = this.loadVersionFiles();

    this.verifyFileStructure();

    const schema = IO.loadJsonFile(getPath("submission/action.schema.json"));
    const ajv = new Ajv({ strict: true, allErrors: true });
    this.actionValidator = {
      ajv,
      validate: ajv.compile(schema),
    };
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
    ValidateManifest(this.manifest);

    for (const version of Object.keys(this.versionFiles)) {
      if (compareVersion(version, this.manifest.version) === "higher") {
        ThrowError.actionError(this.id, `Action can't contain a version file that is higher (${version}) than the manifest (${this.manifest.version}).`);
      }

      const action = IO.loadJsonFile(`${this.path}/versions/${version}.json`);
      if (!this.actionValidator.validate(action)) {
        ThrowError.actionError(this.id, `${version} version JSON failed validation: ${this.actionValidator.ajv.errorsText(this.actionValidator.validate.errors)}`);
      }
    }
  }
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
