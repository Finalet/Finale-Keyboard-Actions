### Submission flow

- Contributer creates a custom action inside Finale Keyboard
- Contributer clones this repo and sets up their submission: creates folder `marketplace/actions/{action-id}`, creates `manifest.ts` and `marketplace/actions/{action-id}/versions/{version}.json`, and optionally adds `README.md` for more context and description. Uses helper scripts to assist.
- Validates his submission with provided scripts.
- Creates a PR with a title starting with `[SUBMISSION]`.
- A submission can change only one action folder, and only `manifest.ts`, `README.md`, and `versions/{version}.json` matching the manifest version. Existing version files cannot be edited or deleted; updates must add a new version file. `manifest.json`, `releases.json`, and the marketplace index are generated during release.
- GitHub actions run validation and verifies that everything is setup properly: files are present, manifest is correct, version numbers are correct, and so on.
- Maintainer reviews and mergest the PR. A PR merge is equal to "releasing" the app into the marketplace.
- GitHub action appends release record to `marketplace/actions/{action-id}/releases.json` and commits
- GitHub action regenerates `marketplace/index.json` and commits.
