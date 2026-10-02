interface ActionManifest {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  tags: ActionTag[];
  version: string;
  status: "active" | "deprecated";
  services: ServiceDetails[];
  variables: Record<string, VariableDetails>;
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

type ActionTag = "Fetch" | "Trigger" | "Requires authentication" | "Paid" | "Free";
