import { readFileSync } from "fs";
import { resolve } from "node:path";

export const getProcessArg = (index: number): string | undefined => {
  const args = process.argv.slice(2);
  if (index < 0 || index >= args.length) return undefined;
  return args[index];
};

export const getPath = (relativePath: string): string => {
  return resolve(process.cwd(), relativePath);
};

export const loadJsonFile = (path: string): any => {
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
