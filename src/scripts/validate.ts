import Action from "../action/Action";
import { getProcessArg } from "../utils/misc";

function Run() {
  try {
    const actionId = getProcessArg(0);
    if (!actionId) throw new Error("Missing action ID. Use: npm run validate <action-id>");

    console.log(`\n⏳ Validating "${actionId}".`);

    const action = new Action(actionId);
    action.validate();

    console.log(`✅ Action "${actionId}" is valid.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed: ${message}`);
    process.exitCode = 1;
  }
}

Run();
