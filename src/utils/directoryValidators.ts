import { readdirSync } from "node:fs";

const allowedFilesAndDirectories = (path: string, allowedFiles: string[], allowedDirectories: string[]) => {
  const entries = readdirSync(path, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && allowedDirectories.includes(entry.name)) continue;
    if (entry.isFile() && allowedFiles.includes(entry.name)) continue;

    throw new Error(`Unexpected entry in directory "${path}": ${entry.name}. Only ${allowedDirectories.join(", ")} and ${allowedFiles.join(", ")} are allowed.`);
  }
};

const directoryValidators = {
  allowedFilesAndDirectories,
};

export default directoryValidators;
