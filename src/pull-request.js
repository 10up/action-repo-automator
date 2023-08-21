const core = require("@actions/core");
const github = require("@actions/github");

import AutoComment from "./auto-comment";
import GitHub from "./github";
import PRConflict from "./pr-conflict";
import PRValidation from "./pr-validation";
import WelcomeMessage from "./welcome-message";

const { getInputs } = require("./utils");

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

export async function run() {
  // Bail if not a pull request.
  if ("pull_request" !== github.context.eventName) {
    core.info("Skipping operations on pull_request event");
    return;
  }

  try {
    const gh = new GitHub({
      owner,
      repo,
    });
    const pullRequest = github.context.payload?.pull_request || {};
    const issueNumber = github.context.issue.number;
    const {
      labels,
      requested_reviewers: requestedReviewers,
      draft: isDraft,
      assignees,
      user: author,
      milestone,
    } = pullRequest;

    const {
      assignIssues,
      addMilestone,
      assignPullRequest,
      failLabel,
      passLabel,
      prComment,
      prReviewers,
      prWelcomeMessage,
    } = getInputs(pullRequest);
    core.debug(`Pull Request: ${JSON.stringify(pullRequest)}`);
    core.debug(`Is Draft: ${JSON.stringify(isDraft)}`);

    // Handle Bot User
    if ("Bot" === author?.type) {
      // Skip validation against bot user.
      await gh.addLabel(issueNumber, passLabel);
      await gh.requestPRReview(issueNumber, prReviewers);
      return;
    }

    // Assign PR to author
    if (
      (!assignees || !Array.isArray(assignees) || !assignees.length) &&
      assignPullRequest
    ) {
      core.info("PR is unassigned, assigning PR");
      await gh.assignPR(issueNumber, author);
    }

    // Assign Issues to author
    if (assignIssues) {
      core.info("Assigning issues to PR author");
      await gh.assignIssues(issueNumber, author);
    }

    // Add milestone to PR
    if (!milestone && addMilestone) {
      await gh.addMilestone(issueNumber);
    }

    // Add welcome message to PR if first time contributor.
    if (prWelcomeMessage && github.context.payload.action === "opened") {
      const welcomeMessage = new WelcomeMessage(owner, repo);
      await welcomeMessage.run();
    }

    // Add comment to PR if provided.
    if (prComment && github.context.payload.action === "opened") {
      const autoComment = new AutoComment(owner, repo);
      await autoComment.run();
    }

    // Check for conflicts.
    const conflictFinder = new PRConflict(owner, repo);
    await conflictFinder.run(pullRequest.number);

    // Skip Draft PR
    if (isDraft) {
      // Remove labels and review to handle case of switch PR back draft.
      await gh.removeLabel(issueNumber, labels, failLabel);
      await gh.removeLabel(issueNumber, labels, passLabel);
      await gh.removePRReviewer(issueNumber, prReviewers, requestedReviewers);

      core.info("Skipping DRAFT PR validation!");
      return;
    }

    // Start validation.
    const prValidation = new PRValidation(owner, repo);
    await prValidation.run(pullRequest);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
