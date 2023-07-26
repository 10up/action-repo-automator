const core = require("@actions/core");
const github = require("@actions/github");

import GitHub from "./github";
import WelcomeMessage from "./welcome-message";
const { getInputs } = require("./utils");

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
    const { issueComment } = getInputs({});
    if (issueComment) {
      core.info("Adding comment to issue...");
      const issue = github.context.payload?.issue || {};
      const {
        number,
        user: { login: issueUser },
      } = issue;
      const gh = new GitHub({
        owner,
        repo,
      });

      const issueCommentBody = issueComment.replace(
        "{author}",
        `@${issueUser}`
      );

      // Add comment to issue.
      await gh.addComment(number, issueCommentBody);
    }
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    core.setFailed(errorMessage);
  }
}
