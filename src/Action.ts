import { getPath, IO, ThrowError } from "./utils/misc";

export default class Action {
  path: string;

  id: string;
  manifest: Manifest;
  releases: Releases;
  versionFiles: Record<string, any>;

  constructor(id: string) {
    this.path = getPath(`marketplace/actions/${id}`);
    this.id = id;
    this.manifest = this.loadManifest();
    this.releases = this.loadReleases();
    this.versionFiles = this.loadVersionFiles();
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

  private loadReleases(): Releases {
    const releases: Releases = IO.loadJsonFile(`${this.path}/releases.json`);
    return releases;
  }

  private loadVersionFiles(): Record<string, any> {
    const entries = IO.loadEntriesFromDirectory(`${this.path}/versions`);
    if (entries.some((entry) => entry.isDirectory() || entry.name.slice(-5) !== ".json")) {
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
}

interface Releases {
  id: string;
  releases: Release[];
}

interface Release {
  version: string;
  releaseDate: string;
  services: ServiceDetails[];
  variables?: Record<string, VariableDetails>;
  dynamicVariables: string[];
}

interface Manifest {
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

interface VariableDetails {
  name: string;
  description: string;
}

interface ServiceDetails {
  name: string;
  description: string;
  origins: string[];
}

const availableStatuses = ["active", "deprecated"] as const;
type ActionStatus = (typeof availableStatuses)[number];

const availableTags = ["Requires authentication", "Paid", "Free"] as const;
type ActionTag = (typeof availableTags)[number];
