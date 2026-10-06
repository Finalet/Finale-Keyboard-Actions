import fieldValidators from "@/src/utils/fieldValidators";
import { compareVersion, getPath, IO } from "../utils/misc";
import Action, { Manifest, Releases } from "./Action";

export function defineManifest(manifest: Manifest) {
  return manifest;
}

export function ValidateManifest(manifest: Manifest) {
  ValidateAllLeadingTrailingWhitespaces(manifest);

  const minStringLength = 3;
  const maxNameLength = 256;
  const maxDescriptionLength = 1024;

  // Validate ID
  fieldValidators.minMaxLength(manifest.id, minStringLength, maxNameLength, "ID");
  fieldValidators.isLowercaseEnglishHyphenated(manifest.id, "ID");

  // Validate Name
  fieldValidators.minMaxLength(manifest.name, minStringLength, maxNameLength, "Name");

  // Validate Description
  fieldValidators.minMaxLength(manifest.description, minStringLength, maxDescriptionLength, "Description");

  // Validate Author name
  fieldValidators.minMaxLength(manifest.author.name, minStringLength, maxNameLength, "Author name");
  if (manifest.author.url !== undefined) {
    fieldValidators.isValidURL(manifest.author.url, "Author URL");
  }

  // Validate tags
  fieldValidators.noDuplicatesInArray(manifest.tags, "Tags");
  for (const tag of manifest.tags) {
    fieldValidators.isContainedInArray(tag, Action.availableTags, `${tag} tag`);
  }

  // Validate status
  fieldValidators.isContainedInArray(manifest.status, Action.availableStatuses, "Status");

  // Validate version
  fieldValidators.minMaxLength(manifest.version, 5, 64, "Version");
  fieldValidators.isValidVersion(manifest.version, "Version");

  const releases = IO.loadJsonFileIfExists<Releases>(`${getPath(`marketplace/actions/${manifest.id}`)}/releases.json`);
  const highestReleaseVersion = releases?.releases.reduce((prev, curr) => (compareVersion(curr.version, prev.version) === "higher" ? curr : prev), { version: "0.0.0" })?.version ?? "0.0.0";
  if (compareVersion(manifest.version, highestReleaseVersion) === "lower") {
    throw new Error(`New version "${manifest.version}" cannot be lower than the highest released version "${highestReleaseVersion}".`);
  }

  // Validate services
  for (const service of manifest.services) {
    fieldValidators.minMaxLength(service.name, minStringLength, maxNameLength, "Service name");
    fieldValidators.minMaxLength(service.description, minStringLength, maxDescriptionLength, "Service description");
    fieldValidators.noDuplicatesInArray(service.origins, "Service origins");
    fieldValidators.noEmptyArray(service.origins, "Service origins");
    for (const origin of service.origins) {
      fieldValidators.isValidOrigin(origin, `${service.name} origin`);
    }
  }

  // Validate variables
  if (manifest.variables) {
    for (const [key, variable] of Object.entries(manifest.variables)) {
      // Validate variable key
      fieldValidators.noLeadingTrailingWhitespace(key, `Variable key (${key})`);
      fieldValidators.isWrappedInCurlyBraces(key, `Variable key (${key})`);
      fieldValidators.isLowercaseEnglishUnderscored(key.slice(1, -1), `Variable key (${key})`);

      // Validate variable fields
      fieldValidators.minMaxLength(variable.name, minStringLength, maxNameLength, `Variable name (${key})`);
      fieldValidators.minMaxLength(variable.description, minStringLength, maxDescriptionLength, `Variable description (${key})`);
    }
  }

  // Validate action requests
  const action = IO.loadJsonFile(getPath(`marketplace/actions/${manifest.id}/versions/${manifest.version}.json`));
  const origins = new Set(manifest.services.flatMap((service) => service.origins.map((origin) => new URL(origin).origin)));
  const usedVariables = new Set<string>();
  ValidateActionRequests(action, manifest, origins, usedVariables);

  for (const variable of Object.keys(manifest.variables ?? {})) {
    if (!usedVariables.has(variable)) {
      throw new Error(`Manifest variable "${variable}" is not used in any request in version "${manifest.version}".`);
    }
  }
}

function ValidateActionRequests(value: unknown, manifest: Manifest, origins: Set<string>, usedVariables: Set<string>, path = "action"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => ValidateActionRequests(item, manifest, origins, usedVariables, `${path}[${index}]`));
  } else if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (key === "request" && typeof child === "object" && child !== null) {
        const context = `Version "${manifest.version}" ${childPath}`;

        // Variables in the host or port make the origin user-defined.
        if (typeof child.url === "string") {
          const authority = child.url.match(/^https?:\/\/([^/?#]*)/i)?.[1] ?? "";
          const hostAndPort = authority.slice(authority.lastIndexOf("@") + 1);
          if (getVariables(hostAndPort).length === 0) {
            const origin = fieldValidators.isValidURL(child.url, `${context} URL`).origin;
            if (!origins.has(origin)) {
              throw new Error(`${context} origin "${origin}" must be included in a manifest service.`);
            }
          }
        }

        for (const variable of new Set(getVariables(child))) {
          usedVariables.add(variable);
          if (!Action.dynamicVariables.includes(variable) && !Object.hasOwn(manifest.variables ?? {}, variable)) {
            throw new Error(`${context} variable "${variable}" is missing a manifest variable entry.`);
          }
        }
      } else {
        ValidateActionRequests(child, manifest, origins, usedVariables, childPath);
      }
    }
  }
}

function getVariables(value: unknown): string[] {
  if (typeof value === "string") {
    return value.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) ?? [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(getVariables);
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(getVariables);
  }
  return [];
}

function ValidateAllLeadingTrailingWhitespaces(value: unknown, path = "manifest"): void {
  if (typeof value === "string") {
    fieldValidators.noLeadingTrailingWhitespace(value, path);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      ValidateAllLeadingTrailingWhitespaces(item, `${path}[${index}]`);
    });
  } else if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      ValidateAllLeadingTrailingWhitespaces(child, `${path}.${key}`);
    }
  }
}
