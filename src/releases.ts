import { ServiceDetails, VariableDetails } from "@/src/defineManifest";

interface ActionReleases {
  id: string;
  releases: ReleaseDetails[];
}

interface ReleaseDetails {
  version: string;
  releaseDate: string;
  services: ServiceDetails[];
  variables: Record<string, VariableDetails>;
  dynamicVariables: string[];
}
