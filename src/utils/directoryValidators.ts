import { existsSync, lstatSync, readdirSync } from "node:fs";

const exists = (path: string) => {
  if (!existsSync(path) || !lstatSync(path).isDirectory()) {
    throw new Error(`Directory "${path}" does not exist or is not a directory.`);
  }
};

const allowedFilesAndDirectories = (path: string, allowedFiles: string[], allowedDirectories: string[]) => {
  const entries = readdirSync(path, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && allowedDirectories.includes(entry.name)) continue;
    if (entry.isFile() && allowedFiles.includes(entry.name)) continue;

    throw new Error(`Unexpected entry in directory "${path}": ${entry.name}. Only ${allowedDirectories.join(", ")} and ${allowedFiles.join(", ")} are allowed.`);
  }
};

const requiredFiles = (path: string, files: string[]) => {
  const entries = readdirSync(path, { withFileTypes: true });

  for (const file of files) {
    if (!entries.some((entry) => entry.isFile() && entry.name === file)) {
      throw new Error(`Required file "${file}" is missing in directory "${path}".`);
    }
  }
};

const requiredDirectories = (path: string, directories: string[]) => {
  const entries = readdirSync(path, { withFileTypes: true });

  for (const dir of directories) {
    if (!entries.some((entry) => entry.isDirectory() && entry.name === dir)) {
      throw new Error(`Required directory "${dir}" is missing in directory "${path}".`);
    }
  }
};

const directoryValidators = {
  exists,
  allowedFilesAndDirectories,
  requiredFiles,
  requiredDirectories,
};

export default directoryValidators;
