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

export const availableStatuses = ["active", "deprecated"] as const;
export const availableTags = ["Requires authentication", "Paid", "Free"] as const;

export const dynamicVariables = [
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

export type ActionStatus = (typeof availableStatuses)[number];
export type ActionTag = (typeof availableTags)[number];
export type DynamicVariable = (typeof dynamicVariables)[number];
