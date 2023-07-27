const core = require("@actions/core");
const github = require("@actions/github");

import WelcomeMessage from "./welcome-message";

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

export async function run() {
  // Bail if not a on issues event.
  if ("issues" !== github.context.eventName) {
    core.info("Skipping operations on issues event");
    return;
  }

  // Welcome new Users.
  try {
    const welcomeMessage = new WelcomeMessage(owner, repo);
    await welcomeMessage.run();
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    core.setFailed(errorMessage);
  }
}
