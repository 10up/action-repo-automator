const core = require("@actions/core");

import GitHub from "./github";
const {
  getChangelog,
  getCredits,
  getDescription,
  getInputs,
} = require("./utils.js");

export default class PRValidation {
  constructor(owner, repo) {
    this.repo = repo;
    this.owner = owner;
    this.gh = new GitHub({
      owner: this.owner,
      repo: this.repo,
    });
  }

  async run(pullRequest) {
    const {
      labels,
      requested_reviewers: requestedReviewers,
      user: author,
      number: issueNumber,
    } = pullRequest;

    const {
      passLabel,
      failLabel,
      prReviewers,
      commentTemplate,
      validateChangelog,
      validateCredits,
      validateDescription,
    } = getInputs();

    if (!validateChangelog && !validateCredits && !validateDescription) {
      core.info("PR validation is disabled");
      return;
    }

    let failed = false;
    const errors = [];
    if (validateChangelog) {
      core.info("Running changelog validation");
      const changelog = getChangelog(pullRequest);
      core.debug(`Changelog: ${JSON.stringify(changelog)}`);
      if (!changelog.length) {
        failed = true;
        errors.push("Please fill out the changelog information");
      }
    }

    if (validateCredits) {
      core.info("Running credits validation");
      const props = getCredits(pullRequest);
      core.debug(`Credits: ${JSON.stringify(props)}`);
      if (!props.length) {
        failed = true;
        errors.push("Please fill out the credits information");
      }
    }

    if (validateDescription) {
      core.info("Running description validation");
      const description = getDescription(pullRequest);
      core.debug(`Description: ${description}`);
      if (!description.length) {
        failed = true;
        errors.push("Please add some description about the changes made in PR");
      }
    }

    if (failed) {
      // Remove Pass Label if already there.
      await this.gh.removeLabel(issueNumber, labels, passLabel);

      // Add Fail Label.
      await this.gh.addLabel(issueNumber, failLabel);

      // Add Comment to for author to fill out the PR template.
      if (commentTemplate) {
        const commentBody = commentTemplate.replace(
          "{author}",
          `@${author.login}`
        );

        await this.gh.addComment(issueNumber, commentBody);
      }

      // setFailed to stop the workflow.
      errors.forEach((error) => core.setFailed(error));
      return;
    }

    // All good to go.
    // 1. Remove fail label
    // 2. Add Pass label
    // 3. Request Review.
    await this.gh.removeLabel(issueNumber, labels, failLabel);
    await this.gh.addLabel(issueNumber, passLabel);
    if (requestedReviewers.length === 0) {
      await this.gh.requestPRReview(issueNumber, prReviewers);
    }
  }
}
