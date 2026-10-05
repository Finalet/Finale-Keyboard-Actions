import Action from "../action/Action";
import { getProcessArg } from "../utils/misc";

function Run() {
  try {
    const actionId = getProcessArg(0);
    if (!actionId) throw new Error("Missing action ID. Use: npm run release <action-id>");

    console.log(`\nReleasing "${actionId}".`);

    const action = new Action(actionId);
    // ValidateAction(actionId);

    console.log(`✅ Action "${actionId}" was released.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed: ${message}`);
    process.exitCode = 1;
  }
}

Run();
