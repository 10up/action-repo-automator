import * as core from "@actions/core";
import * as github from "@actions/github";

import GitHub from "./github";
const { getInputs } = require("./utils.js");

export default class AutoComment {
  constructor(owner, repo) {
    this.repo = repo;
    this.owner = owner;
    this.inputs = getInputs();
    this.gh = new GitHub({
      owner: this.owner,
      repo: this.repo,
    });
  }

  async run() {
    const context = github.context;

    if (context.payload.action !== "opened") {
      core.info("Not an opened action! Skipping...");
      return;
    }

    const isPR =
      !!context.payload.pull_request && context.eventName === "pull_request";
    const isIssue = !!context.payload.issue && context.eventName === "issues";
    const { issueComment, prComment, ignoreUsers } = this.inputs;
    if (!isPR && !isIssue) {
      core.info("Not a pull request or Issue! Skipping...");
      return;
    }

    if (isIssue && !issueComment) {
      core.info("Issue comment is not provided! Skipping...");
      return;
    }

    if (isPR && !prComment) {
      core.info("PR comment is not provided! Skipping...");
      return;
    }

    const { issue, pull_request } = context.payload;
    const {
      number,
      user: { login: author, type: authorType },
    } = issue || pull_request;
    if (!author) {
      core.info("No author found! Skipping...");
      return;
    }

    // Handle Bot User
    if ("Bot" === authorType) {
      // Skip validation against bot user.
      core.info("Issue/PR opened by bot user. Skipping...");
      return;
    }

    const allIgnoreUsers = await this.gh.parseUsers(ignoreUsers);
    if (allIgnoreUsers.includes(author)) {
      core.info(`Skipping comment for ${author}, as it is in ignore list`);
      return;
    }

    // Add comment to newly opened issues/PRs.
    core.info("Adding comment...");
    const comment = isIssue ? issueComment : prComment;
    const commentBody = comment.replace("{author}", `@${author}`);

    // Add comment to issue.
    await this.gh.addComment(number, commentBody);
  }
}
