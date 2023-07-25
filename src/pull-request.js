const core = require("@actions/core");
const github = require("@actions/github");

import GitHub from "./github";
import PRConflict from "./pr-conflict";
import WelcomeMessage from "./welcome-message";

const {
  getChangelog,
  getCredits,
  getDescription,
  getInputs,
} = require("./utils");

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
      commentTemplate,
      prReviewers,
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
    const welcomeMessage = new WelcomeMessage(owner, repo);
    await welcomeMessage.run();

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
    const changelog = getChangelog(pullRequest);
    const props = getCredits(pullRequest);
    const description = getDescription(pullRequest);

    // Debug information.
    core.debug(`Changelog: ${JSON.stringify(changelog)}`);
    core.debug(`Credits: ${JSON.stringify(props)}`);
    core.debug(`Description: ${description}`);

    if (!changelog.length || !props.length || !description.length) {
      // Remove Pass Label if already there.
      await gh.removeLabel(issueNumber, labels, passLabel);

      // Add Fail Label.
      await gh.addLabel(issueNumber, failLabel);

      // Add Comment to for author to fill out the PR template.
      const commentBody = commentTemplate.replace(
        "{author}",
        `@${author.login}`
      );
      await gh.addComment(issueNumber, commentBody);

      if (!changelog.length) {
        core.setFailed("Please fill out the changelog information");
      }
      if (!props.length) {
        core.setFailed("Please fill out the credits information");
      }
      if (!description.length) {
        core.setFailed(
          "Please add some description about the changes made in PR"
        );
      }
      return;
    }

    // All good to go.
    // 1. Remove fail label
    // 2. Add Pass label
    // 3. Request Review.
    await gh.removeLabel(issueNumber, labels, failLabel);
    await gh.addLabel(issueNumber, passLabel);
    if (requestedReviewers.length === 0) {
      await gh.requestPRReview(issueNumber, prReviewers);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
