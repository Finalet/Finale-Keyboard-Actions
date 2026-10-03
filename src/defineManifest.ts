import fieldValidators from "@/src/utils/fieldValidators";

export function defineManifest(manifest: ActionManifest) {
  ValidateManifest(manifest);
  return manifest;
}

function ValidateManifest(manifest: ActionManifest) {
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
    fieldValidators.isContainedInArray(tag, availableTags, `${tag} tag`);
  }

  // Validate status
  fieldValidators.isContainedInArray(manifest.status, availableStatuses, "Status");

  // Validate version
  fieldValidators.minMaxLength(manifest.version, 5, 64, "Version");
  fieldValidators.isValidVersion(manifest.version, "Version");

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

export interface ActionManifest {
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

const availableStatuses = ["active", "deprecated"] as const;
export type ActionStatus = (typeof availableStatuses)[number];

const availableTags = ["Requires authentication", "Paid", "Free"] as const;
export type ActionTag = (typeof availableTags)[number];
