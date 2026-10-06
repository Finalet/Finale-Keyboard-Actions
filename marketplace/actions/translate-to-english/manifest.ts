import { defineManifest } from "@/src/action/manifest";

export default defineManifest({
  id: "translate-to-english",
  name: "Translate to English",
  description: "Translate the selected text to English.",
  author: {
    name: "Finalet",
    url: "https://github.com/Finalet",
  },
  tags: ["Requires authentication", "Paid"],
  status: "active",
  version: "1.0.0",
  services: [
    {
      name: "Google Translate",
      description: "Translates the selected text.",
      origins: ["https://translation.googleapis.com"],
    },
  ],
  variables: {
    "{gcp_key}": {
      name: "GCP Key",
      description: "The Google Cloud Platform API key used for translation requests.",
    },
  },
});
