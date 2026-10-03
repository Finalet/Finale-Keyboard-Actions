import { readFileSync, statSync } from "fs";
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

export const doesFileExist = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

export const loadJsonFile = <T = any>(path: string): T => {
  const contents = readFileSync(path, "utf8");
  let json: any;
  try {
    json = JSON.parse(contents);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`File "${path}" must contain valid JSON: ${message}`);
  }
  return json;
};

export const loadJsonIfExists = <T = any>(path: string): T | undefined => {
  if (!doesFileExist(path)) return undefined;
  return loadJsonFile<T>(path);
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

export const JSONtoString = (json: any): string => {
  return JSON.stringify(json, null, 2);
};
