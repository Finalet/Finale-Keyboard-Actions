### Submission flow

- Contributer creates a custom action inside Finale Keyboard
- Contributer clones this repo and sets up their submission: creates folder `marketplace/actions/{action-id}`, creates `manifest.json` and `README.md`, creates `marketplace/actions/{action-id}/versions/{version}.json`. Uses helper scripts to assist.
- Validates his submission with provided scripts.
- Creates a PR
- GitHub actions run validation and verifies that everything is setup properly: files are present, manifest is correct, version numbers are correct, and so on.
- Maintainer reviews and mergest the PR. A PR merge is equal to "releasing" the app into the marketplace.
- GitHub action appends release record to `marketplace/actions/{action-id}/releases.json` and commits
- GitHub action regenerates `marketplace/index.json` and commits.
