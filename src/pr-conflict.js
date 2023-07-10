const core = require("@actions/core");

import GitHub from "./github";
const { wait } = require("./utils.js");

export default class PRConflict {
  constructor(owner, repo) {
    this.repo = repo;
    this.owner = owner;
    this.gh = new GitHub({
      owner: this.owner,
      repo: this.repo,
    });
  }

  async run() {
    let tries = 0;
    const maxTries = 5;
    const waitTime = 15000;

    let pullRequests = await this.gh.getAllPullRequests();
    let unknownMergeablePRs = pullRequests.filter(
      (pr) => pr.mergeable === "UNKNOWN"
    );

    while (tries < maxTries && unknownMergeablePRs.length > 0) {
      tries++;
      core.info(`Try: ${tries}`);
      core.info(`${unknownMergeablePRs.length} PRs has unknown mergeable state`);
      await wait(waitTime);
      pullRequests = await this.gh.getAllPullRequests();
      unknownMergeablePRs = pullRequests.filter(
        (pr) => pr.mergeable === "UNKNOWN"
      );      
    }

    if (unknownMergeablePRs.length > 0) {
      // Stop processing, @todo: handle this case
      core.info("Unable to determine mergeable state for PRs");
      return;
    }

    for (const pullRequest of pullRequests) {
      await this.processPullRequest(pullRequest);
    }
  }

  async processPullRequest(pullRequest) {
    const { number, mergeable, locked, author, comments, labels } = pullRequest;

    const conflictLabel = "needs: refresh";
    const conflictComment =
      "{author} This PR has conflicts that must be resolved before it can be merged.";
    const commentBody = conflictComment.replace("{author}", `@${author.login}`);

    if (
      locked ||
      mergeable === "UNKNOWN" ||
      author.login === "dependabot[bot]"
    ) {
      // Skip locked PRs, PRs with unknown mergeable state, and dependabot PRs
      return;
    }
    console.log(comments);
    console.log(labels);
    switch (mergeable) {
      case "CONFLICTING": {
        // Check if PR has conflict label. If not, add conflict label
        if (!labels?.nodes?.some((label) => label.name === conflictLabel)) {
          await this.gh.addLabel(number, conflictLabel);
        }

        // Check if PR has conflict comment. If not, add conflict comment
        if (!comments?.nodes?.some((comment) => comment.body === commentBody)) {
          await this.gh.addComment(number, commentBody);
        }
        break;
      }

      case "MERGEABLE": {
        // Check if PR has conflict label. If yes, remove conflict label
        if (labels?.nodes?.some((label) => label.name === conflictLabel)) {
          await this.gh.removeLabel(number, labels.nodes, conflictLabel);
        }

        // Check if PR has conflict comment. If yes, remove conflict comment
        if (comments?.nodes?.some((comment) => comment.body === commentBody)) {
          const commentIds = comments?.nodes
            ?.filter((comment) => comment.body === commentBody)
            .map((comment) => comment.databaseId);
          if (commentIds.length > 0) {
            await this.gh.removeComment(commentIds[0]);
          }
        }
        break;
      }

      default:
        break;
    }
  }
}
