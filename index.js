const core = require("@actions/core");
const github = require("@actions/github");

import GitHub from "./src/github";
const {
  getChangelog,
  getCredits,
  getDescription,
  getInputs,
} = require("./src/utils");

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issueNumber = github.context.issue.number;


async function run() {
  try {
    const gh = new GitHub({
      owner,
      repo,
      issueNumber,
    });
    const pullRequest = github.context.payload?.pull_request || {};
    const {
      labels,
      requested_reviewers: requestedReviewers,
      draft: isDraft,
      assignees,
      user: author,
      milestone
    } = pullRequest;

    const {
      addMilestone,
      assignPullRequest,
      failLabel,
      passLabel,
      commentTemplate,
      prReviewer,
    } = getInputs();
    core.debug(`Pull Request: ${JSON.stringify(pullRequest)}`);
    core.debug(`Is Draft: ${JSON.stringify(isDraft)}`);

    // Handle Bot User
    if ("Bot" === author.type) {
      // Skip validation against bot user.
      await gh.addLabel(passLabel);
      await gh.requestPRReview(prReviewer);
      return;
    }

    // Assign PR to author
    if (
      (!assignees || !Array.isArray(assignees) || !assignees.length) &&
      assignPullRequest
    ) {
      core.info("PR is unassigned, assigning PR");
      await gh.assignPR(author);
    }

    // Skip Draft PR
    if (isDraft) {
      // Remove labels and review to handle case of switch PR back draft.
      await gh.removeLabel(labels, failLabel);
      await gh.removeLabel(labels, passLabel);
      await gh.removePRReviewer(prReviewer, requestedReviewers);

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
      await gh.removeLabel(labels, passLabel);

      // Add Fail Label.
      await gh.addLabel(failLabel);

      // Add Comment to for author to fill out the PR template.
      const commentBody = commentTemplate.replace(
        "{author}",
        `@${author.login}`
      );
      await gh.addComment(commentBody);

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
    // 4. Add Milestone
    await gh.removeLabel(labels, failLabel);
    await gh.addLabel(passLabel);
    if ( requestedReviewers.length === 0 ) {
      await gh.requestPRReview(prReviewer);
    }
    if ( ! milestone && addMilestone) {
      await gh.addMilestone();
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
