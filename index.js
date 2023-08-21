const core = require("@actions/core");
const github = require("@actions/github");

import { run as runPush } from "./src/push";
import { run as runPullRequest } from "./src/pull-request";
import { run as runIssues } from "./src/issues";

async function run() {
  try {
    const eventName = github.context.eventName;
    core.debug(`Event Name: ${eventName}`);

    switch (eventName) {
      case "push": {
        await runPush();
        break;
      }

      case "pull_request": {
        await runPullRequest();
        break;
      }

      case "issues": {
        await runIssues();
        break;
      }

      default: {
        core.info(`Skipping operations on ${eventName} event`);
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
