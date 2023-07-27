const core = require("@actions/core");
const github = require("@actions/github");

import AutoComment from "./auto-comment";
import WelcomeMessage from "./welcome-message";

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

export async function run() {
  // Bail if not a on issues event.
  if ("issues" !== github.context.eventName) {
    core.info("Skipping operations on issues event");
    return;
  }

  // Add a Welcome Message to issue created by first-time contributors.
  try {
    const welcomeMessage = new WelcomeMessage(owner, repo);
    await welcomeMessage.run();
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    core.setFailed(errorMessage);
  }

  // Add comment to newly opened issues.
  try {
    const autoComment = new AutoComment(owner, repo);
    await autoComment.run();
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    core.setFailed(errorMessage);
  }
}
