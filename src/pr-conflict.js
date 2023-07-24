const core = require("@actions/core");

import GitHub from "./github";
const { wait, getInputs } = require("./utils.js");

export default class PRConflict {
  constructor(owner, repo) {
    this.repo = repo;
    this.owner = owner;
    this.inputs = getInputs();
    this.gh = new GitHub({
      owner: this.owner,
      repo: this.repo,
    });
  }

  async run(prNumber = null) {
    let tries = 0;
    const { waitMS, maxRetries, conflictLabel, conflictComment } = this.inputs;

    if (!conflictLabel && !conflictComment) {
      core.info("Skipping PR conflict operations");
      return;
    }

    // Only process a single PR if a PR number is passed in.
    if (prNumber) {
      let pullRequest;
      do {
        if (pullRequest) {
          tries++;
          core.info(`Try: ${tries}`);
          await wait(Number(waitMS));
        }
        pullRequest = await this.gh.getPullRequest(prNumber);
        console.log(pullRequest);
      } while (
        tries < Number(maxRetries) &&
        pullRequest.mergeable === "UNKNOWN"
      );

      if (pullRequest.mergeable === "UNKNOWN") {
        core.error(`Unable to determine mergeable state for PR: ${prNumber}`);
        return;
      }

      await this.processPullRequest(pullRequest);
      return;
    }

    let pullRequests;
    let unknownMergeablePRs;

    do {
      if (pullRequests) {
        tries++;
        core.info(`Try: ${tries}`);
        core.info(
          `${unknownMergeablePRs?.length || ""} PRs has unknown mergeable state`
        );
        await wait(Number(waitMS));
      }
      pullRequests = await this.gh.getAllPullRequests();
      unknownMergeablePRs = pullRequests.filter(
        (pr) => pr.mergeable === "UNKNOWN"
      );
    } while (tries < Number(maxRetries) && unknownMergeablePRs.length > 0);

    if (unknownMergeablePRs.length > 0) {
      // Stop processing, Mark Job as failed.
      core.error(
        `Unable to determine mergeable state for PRs: ${unknownMergeablePRs
          .map((pr) => pr.number)
          .join(", ")}`
      );
      core.setFailed("Unable to determine mergeable state for PRs");
      return;
    }

    for (const pullRequest of pullRequests) {
      await this.processPullRequest(pullRequest);
    }
  }

  async processPullRequest(pullRequest) {
    const { number, mergeable, locked, author, comments, labels } = pullRequest;

    const { conflictLabel, conflictComment } = this.inputs;
    const commentBody = conflictComment
      ? conflictComment.replace("{author}", `@${author.login}`)
      : "";

    if (
      locked ||
      mergeable === "UNKNOWN" ||
      author.login === "dependabot[bot]"
    ) {
      // Skip locked PRs, PRs with unknown mergeable state, and dependabot PRs
      return;
    }

    switch (mergeable) {
      case "CONFLICTING": {
        // Check if PR has conflict label. If not, add conflict label
        if (
          conflictLabel &&
          !labels?.nodes?.some((label) => label.name === conflictLabel)
        ) {
          await this.gh.addLabel(number, conflictLabel);
        }

        // Check if PR has conflict comment. If not, add conflict comment
        if (
          commentBody &&
          !comments?.nodes?.some((comment) => comment.body === commentBody)
        ) {
          await this.gh.addComment(number, commentBody);
        }
        break;
      }

      case "MERGEABLE": {
        // Check if PR has conflict label. If yes, remove conflict label
        if (
          conflictLabel &&
          labels?.nodes?.some((label) => label.name === conflictLabel)
        ) {
          await this.gh.removeLabel(number, labels.nodes, conflictLabel);
        }

        // Check if PR has conflict comment. If yes, remove conflict comment
        if (
          commentBody &&
          comments?.nodes?.some((comment) => comment.body === commentBody)
        ) {
          const commentIds = comments?.nodes
            ?.filter((comment) => comment.body === commentBody)
            .map((comment) => comment.databaseId);
          if (commentIds.length > 0) {
            await this.gh.removeComment(commentIds[0]);
          }
        }

        // Update PR branch to latest base branch if PR is not up to date'
        if (pullRequest.baseRefOid !== pullRequest?.baseRef?.target?.oid) {
          await this.gh.updateBranch(number);
        }
        break;
      }

      default:
        break;
    }
  }
}
