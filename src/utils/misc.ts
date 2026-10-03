import { resolve } from "node:path";

export const getProcessArg = (index: number): string | undefined => {
  const args = process.argv.slice(2);
  if (index < 0 || index >= args.length) return undefined;
  return args[index];
};

export const getFilePath = (relativePath: string): string => {
  return resolve(process.cwd(), relativePath);
};
