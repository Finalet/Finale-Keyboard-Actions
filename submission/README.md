### Submission flow

- Contributer creates a custom action inside Finale Keyboard
- Contributer clones this repo and sets up their submission: creates folder `marketplace/actions/{action-id}`, creates `manifest.ts` and `marketplace/actions/{action-id}/versions/{version}.json`, and optionally adds `README.md` for more context and description. Uses helper scripts to assist.
- Validates his submission with provided scripts.
- Creates a PR with a title starting with `[SUBMISSION]`.
- A submission can change only one action folder, and only `manifest.ts`, `README.md`, and `versions/{version}.json` matching the manifest version. Existing version files cannot be edited or deleted; updates must add a new version file. `manifest.json`, `releases.json`, and the marketplace index are generated during release.
- GitHub actions check the submission's files, manifest, and versions, then run `npm run release <action-id>` on the temporary runner. A release error fails the `Validate marketplace submission` check. Generated files are not committed or pushed during PR validation.
- Maintainer reviews and mergest the PR. A PR merge is equal to "releasing" the app into the marketplace.
- The `Release submission` workflow runs after a PR titled `[SUBMISSION]...` is merged. It determines the action ID from the PR's changed files and runs `npm run release <action-id>`.
- The workflow commits the generated `manifest.json`, `releases.json`, and `marketplace/index.json` back to the PR's base branch. Release runs for the same branch are queued to avoid concurrent commits.
- In branch protection, require the `Validate marketplace submission` status check and require branches to be up to date before merging. This blocks merging when validation or the release test fails. Require maintainer reviews as well. These settings must be configured on GitHub; the workflow alone cannot enforce them.
- The branch's protection rules must also allow the post-merge workflow's `GITHUB_TOKEN` to push release commits.
