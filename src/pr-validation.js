const core = require("@actions/core");

import GitHub from "./github";
const {
  getChangelog,
  getCredits,
  getDescription,
  getInputs,
  getSectionContent,
} = require("./utils.js");

// Hidden marker to recognise the validation comment on later runs.
export const VALIDATION_COMMENT_MARKER = "<!-- repo-automator:pr-validation -->";

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
      validatePRTemplateSections,
    } = getInputs();

    if (
      !validateChangelog &&
      !validateCredits &&
      !validateDescription &&
      !validatePRTemplateSections.length
    ) {
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

    if (validatePRTemplateSections.length) {
      core.info("Running PR template section validation");
      // Content that is unchanged from the PR template does not count as filled out.
      const template = await this.gh.getPullRequestTemplate(
        pullRequest.base?.ref
      );
      for (const heading of validatePRTemplateSections) {
        const content = getSectionContent(pullRequest, heading, template);
        core.debug(`Section "${heading}": ${content}`);
        if (!content.length) {
          failed = true;
          errors.push(
            `Please fill out the **${heading}** section of the PR template`
          );
        }
      }
    }

    // The comment asking the author to fill out the PR template, without the list of errors.
    const commentIntro = commentTemplate
      ? commentTemplate.replace("{author}", `@${author.login}`)
      : "";
    // Also match the comment as it was posted before it carried a marker.
    const isValidationComment = ({ body }) =>
      !!body &&
      (body.includes(VALIDATION_COMMENT_MARKER) || body === commentIntro);

    if (failed) {
      // Remove Pass Label if already there.
      await this.gh.removeLabel(issueNumber, labels, passLabel);

      // Add Fail Label.
      await this.gh.addLabel(issueNumber, failLabel);

      // Add Comment for author with what is missing, or update it if that has changed.
      if (commentTemplate) {
        const commentBody = [
          commentIntro,
          "",
          ...errors.map((error) => `- ${error}`),
          "",
          VALIDATION_COMMENT_MARKER,
        ].join("\n");

        await this.gh.upsertComment(
          issueNumber,
          commentBody,
          isValidationComment
        );
      }

      // setFailed to stop the workflow.
      errors.forEach((error) => core.setFailed(error));
      return;
    }

    // All good to go.
    // 1. Remove fail label and the comment listing what was missing
    // 2. Add Pass label
    // 3. Request Review.
    await this.gh.removeLabel(issueNumber, labels, failLabel);
    if (commentTemplate) {
      await this.gh.removeComments(issueNumber, isValidationComment);
    }
    await this.gh.addLabel(issueNumber, passLabel);
    if (requestedReviewers.length === 0) {
      await this.gh.requestPRReview(issueNumber, prReviewers);
    }
  }
}
