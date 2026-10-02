import { ServiceDetails, VariableDetails } from "./manifest";

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
