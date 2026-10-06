import { Dirent, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { resolve } from "node:path";
import fieldValidators from "./fieldValidators";

export const getProcessArg = (index: number): string | undefined => {
  const args = process.argv.slice(2);
  if (index < 0 || index >= args.length) return undefined;
  return args[index];
};

export const getPath = (relativePath: string): string => {
  return resolve(process.cwd(), relativePath);
};

export const compareVersion = (version: string, compareTo: string): "higher" | "lower" | "same" => {
  fieldValidators.isValidVersion(version, "version");
  fieldValidators.isValidVersion(compareTo, "compareTo");

  const current = version.split(".").map(BigInt);
  const target = compareTo.split(".").map(BigInt);

  for (let index = 0; index < 3; index++) {
    if (current[index] !== target[index]) {
      return current[index] > target[index] ? "higher" : "lower";
    }
  }

  return "same";
};

export const ThrowError = {
  fileError: (file: string, message: string) => {
    throw new Error(`[${file}]: ${message}`);
  },
  IOError: (path: string, message: string) => {
    throw new Error(`[${path}]: ${message}`);
  },
  actionError: (id: string, message: string) => {
    throw new Error(`[${id}]: ${message}`);
  },
};

export const IO = {
  fileExists: (path: string): boolean => {
    try {
      return statSync(path).isFile();
    } catch {
      return false;
    }
  },
  isEntryJsonFile: (entry: Dirent): boolean => {
    return entry.isFile() && entry.name.slice(-5) === ".json";
  },
  directoryExists: (path: string): boolean => {
    try {
      return statSync(path).isDirectory();
    } catch {
      return false;
    }
  },
  loadDefaultExport: (path: string): any => {
    if (!IO.fileExists(path)) {
      ThrowError.IOError(path, `File does not exist.`);
    }
    return require(path).default;
  },
  loadJsonFile: (path: string): any => {
    if (!IO.fileExists(path)) {
      ThrowError.IOError(path, `File does not exist.`);
    }

    const contents = readFileSync(path, "utf8");
    let json: any;
    try {
      json = JSON.parse(contents);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ThrowError.IOError(path, `File must contain valid JSON: ${message}`);
    }
    return json;
  },
  loadJsonFileIfExists: <T>(path: string): T | null => {
    if (!IO.fileExists(path)) return null;
    return IO.loadJsonFile(path) as T;
  },
  loadEntriesFromDirectory: (path: string): Dirent[] => {
    if (!IO.directoryExists(path)) {
      ThrowError.IOError(path, `Directory does not exist.`);
    }

    return readdirSync(path, { withFileTypes: true });
  },
  writeJsonFile: (path: string, data: any): void => {
    try {
      writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ThrowError.IOError(path, `Failed to write JSON file: ${message}`);
    }
  },
};
