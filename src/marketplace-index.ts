import Action from "./action/Action";
import type { ActionTag } from "./action/types";
import JSONValidator from "./utils/JSONValidator";
import { getPath, IO } from "./utils/misc";

export function GenerateIndex() {
  const actionsPath = getPath("marketplace/actions");

  const entries: IndexEntry[] = IO.loadEntriesFromDirectory(actionsPath)
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const manifest = new Action(entry.name).manifest;
      return {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description,
        author: manifest.author.name,
        version: manifest.version,
        tags: manifest.tags,
      };
    });

  const index: MarketplaceIndex = {
    actions: entries,
    updatedAt: new Date(),
  };

  IO.writeJsonFile(getPath("marketplace/index.json"), index);

  const validator = new JSONValidator(getPath("submission/index.schema.json"));
  validator.Validate(IO.loadJsonFile(getPath("marketplace/index.json")), "marketplace/index.json");
}

interface MarketplaceIndex {
  actions: IndexEntry[];
  updatedAt: Date;
}

interface IndexEntry {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  tags: ActionTag[];
}
