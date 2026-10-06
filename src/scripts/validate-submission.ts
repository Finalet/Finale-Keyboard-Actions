import { execFileSync } from "node:child_process";
import Action from "../action/Action";
import fieldValidators from "../utils/fieldValidators";
import { getProcessArg } from "../utils/misc";

const git = (...args: string[]): string => execFileSync("git", args, { encoding: "utf8" });

function Run() {
  try {
    const base = getProcessArg(0);
    const head = getProcessArg(1);
    if (!base || !head || !/^[a-f0-9]{40}$/.test(base) || !/^[a-f0-9]{40}$/.test(head)) {
      throw new Error("Use: node --import tsx src/scripts/validate-submission.ts <base-sha> <head-sha>");
    }
    if (git("rev-parse", "HEAD").trim() !== base) {
      throw new Error("Submission checks must run from a checkout of the base commit.");
    }

    // Compare the entire PR, including both sides of renames and deletions.
    const mergeBase = git("merge-base", base, head).trim();
    const changes = git("diff", "--name-status", "--no-renames", "-z", mergeBase, head, "--").split("\0").slice(0, -1);
    let actionId: string | undefined;
    const paths: string[] = [];
    const versionPaths: string[] = [];

    for (let index = 0; index < changes.length; index += 2) {
      const status = changes[index];
      const path = changes[index + 1];
      const match = path.match(/^marketplace\/actions\/([^/]+)\/(manifest\.ts|README\.md|versions\/([^/]+)\.json)$/);
      if (!match) throw new Error(`Forbidden submission path: "${path}". Only manifest.ts, README.md, and the latest version JSON are allowed.`);
      fieldValidators.isLowercaseEnglishHyphenated(match[1], "Action ID");
      if (match[3] !== undefined) fieldValidators.isValidVersion(match[3], "Version filename");
      if (actionId && actionId !== match[1]) throw new Error("A submission can change only one action folder.");
      actionId = match[1];

      if (status !== "A" && status !== "M") throw new Error(`Submission cannot delete or change the file type of "${path}".`);
      if (!/^100(?:644|755) blob /.test(git("ls-tree", head, "--", path))) {
        throw new Error(`Submission file "${path}" must be a regular file.`);
      }

      if (match[2].startsWith("versions/")) {
        // Every version already on the base branch is immutable, even the latest.
        if (git("ls-tree", base, "--", path) !== "") {
          throw new Error(`Version "${path}" already exists. Add a new version file instead.`);
        }
        versionPaths.push(path);
      }
      paths.push(path);
    }

    if (!actionId) throw new Error("Submission must contain changes to an action.");

    // Overlay only permitted changes; keep validators and release history from the base.
    git("restore", `--source=${head}`, "--worktree", "--", ...paths);
    const action = new Action(actionId);

    for (const path of versionPaths) {
      const version = path.slice(path.lastIndexOf("/") + 1, -5);
      if (action.releases?.releases.some((release) => release.version === version)) {
        throw new Error(`Version "${version}" has already been released. Add a new version instead.`);
      }
    }

    const latestVersionPath = `marketplace/actions/${actionId}/versions/${action.manifest.version}.json`;
    if (versionPaths.some((path) => path !== latestVersionPath)) {
      throw new Error(`Only the latest version JSON "${latestVersionPath}" can be submitted.`);
    }

    action.Validate();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed: ${message}`);
    process.exitCode = 1;
  }
}

Run();
