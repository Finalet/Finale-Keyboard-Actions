# Finale Keyboard Actions Marketplace

This repository acts as a public marketplace for distributing user-created actions for Finale Keyboard - a custom iOS keyboard.

User flow to install actions:

- Finale Keyboard loads actions from `marketplace/index.json`.
- Sser selects and action
- Finale Keyboard loads `marketplace/actions/{action-id}/manifest.json` and `marketplace/actions/{action-id}/releases.json` to display action information
- User install actions
- Finale Keyboard downloads `marketplace/actions/{action-id}/versions/{lastest-version}.json` and installs it

### State

This repo is populated with mock data.
