const core = require("@actions/core");
const { Octokit } = require("@octokit/action");

export default class GitHub {
  constructor({ owner, repo, issueNumber }) {
    this.owner = owner;
    this.repo = repo;
    this.issueNumber = issueNumber;
    this.octokit = new Octokit();
  }

  /**
   * Assign PR to given user.
   *
   * @param {object} prAuthor
   * @returns void
   */
  async assignPR(prAuthor) {
    try {
      if ("User" !== prAuthor.type) {
        core.info(
          `PR author(${prAuthor.login}) is not user. Skipping assign PR.`
        );
        return;
      }

      core.info(`Assigning PR to author(${prAuthor.login})...`);
      let addAssigneesResponse = await this.octokit.issues.addAssignees({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.issueNumber,
        assignees: [prAuthor.login],
      });
      core.info(
        `PR assigned to (${prAuthor.login}) - ${addAssigneesResponse.status}`
      );
    } catch (error) {
      core.info(`Failed assigned PR to (${prAuthor.login}) : ${error}`);
    }
  }

  /**
   * Add Label to PR.
   *
   * @param {string} name
   */
  async addLabel(name) {
    try {
      if ( !name ) {
        return;
      }      
      core.info(`Adding label (${name}) to PR...`);
      let addLabelResponse = await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.issueNumber,
        labels: [name],
      });
      core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`);
    } catch (error) {
      core.info(`Failed to add label (${name}) to PR: ${error}`);
    }
  }

  /**
   * Remove Label from PR if exists.
   *
   * @param {object[]} labels
   * @param {string} name
   * @returns void
   */
  async removeLabel(labels, name) {
    try {
      if (
        !name ||
        !labels
          .map((label) => label.name.toLowerCase())
          .includes(name.toLowerCase())
      ) {
        return;
      }

      core.info("Removing label...");
      let removeLabelResponse = await this.octokit.issues.removeLabel({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.issueNumber,
        name: name,
      });
      core.info(`Removed label - ${removeLabelResponse.status}`);
    } catch (error) {
      core.info(`Failed to remove label (${name}) from PR: ${error}`);
    }
  }

  /**
   * Add Comment to pull request. (Skips if comment already exists)
   *
   * @param {string} message
   * @returns void
   */
  async addComment(message) {
    try {
      if ( !message ) {
        return;
      }
      // Check if comment is already there.
      const { data: comments } = await this.octokit.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.issueNumber,
      });
      const isExist = comments.some(({ user, body }) => {
        // Check comments of Bot user only.
        if ("Bot" !== user.type) {
          return false;
        }

        return body === message;
      });

      if (isExist) {
        core.info(
          `Comment for author is already created! Skip adding new comment`
        );
        return;
      }

      // Create comment
      core.info("Adding comment...");
      let addCommentResponse = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.issueNumber,
        body: message,
      });
      core.info(`Comment Added - ${addCommentResponse.status}`);
    } catch (error) {
      core.info(`Failed to create comment on PR: ${error}`);
    }
  }

  /**
   * Request review on PR.
   *
   * @param {string} prReviewer
   */
  async requestPRReview(prReviewer) {
    try {
      if ( !prReviewer ) {
        return;
      }
      const isTeam = prReviewer.startsWith("team:");
      const reviewer = prReviewer.replace("team:", "");
      const reviewers = isTeam
        ? { team_reviewers: [reviewer] }
        : { reviewers: [reviewer] };

      // Request Review.
      core.info("Requesting review...");
      let requestReviewResponse = await this.octokit.pulls.requestReviewers({
        owner: this.owner,
        repo: this.repo,
        pull_number: this.issueNumber,
        ...reviewers,
      });
      core.info(`Review Requested - ${requestReviewResponse.status}`);
    } catch (error) {
      core.info(`Failed to request review on PR: ${error}`);
    }
  }

  /**
   * remove reviewer from PR.
   *
   * @param {string} prReviewer
   */
  async removePRReviewer(prReviewer, requestedReviewers) {
    try {
      if( !prReviewer ) {
        return;
      }

      const isTeam = prReviewer.startsWith("team:");
      const reviewer = prReviewer.replace("team:", "");
      const reviewers = isTeam
        ? { team_reviewers: [reviewer] }
        : { reviewers: [reviewer] };

      if (
        !requestedReviewers
          ?.map((ele) =>
            isTeam ? ele.slug.toLowerCase() : ele.login.toLowerCase()
          )
          ?.includes(reviewer.toLowerCase())
      ) {
        // Skip if review not requested from given team.
        return;
      }

      // Remove reviewer from PR
      core.info("Removing reviewer...");
      let removeReviewerResponse =
        await this.octokit.pulls.removeRequestedReviewers({
          owner: this.owner,
          repo: this.repo,
          pull_number: this.issueNumber,
          ...reviewers,
        });
      core.info(`Reviewer Removed - ${removeReviewerResponse.status}`);
    } catch (error) {
      core.info(`Failed to remove reviewer from PR: ${error}`);
    }
  }

  /**
   * Add Milestone to PR
   */
  async addMilestone() {
    const closingIssues = await this.getClosingIssues();
    core.info(`Clossing Issues for PR - ${closingIssues}`);
    core.info(closingIssues);
  }

  /**
   * Get Issues connected to PR.
   * 
   * @returns array of issues
   */
  async getClosingIssues() {
    const query = `query getClosingIssues($owner: String!, $repo: String!, $prNumber:  Int!) { 
      repository(owner:$owner, name: $repo) {
        pullRequest(number: $prNumber) {
          closingIssuesReferences(first: 100) {
            edges {
              node {
                id
                number
                milestone {
                  id
                  number
                }
              }
            }
          }
        }
      }
    }`;

    core.debug(query);
    const issuesResponse = await this.octokit.graphql(query, {
      headers: {},
      prNumber: this.issueNumber,
      owner: this.owner,
      repo: this.repo,
    });

    const {
      repository: {
        pullRequest: {
          closingIssuesReferences: {
            edges: closingIssues
          }
        }
      }
    } = issuesResponse;
    core.debug(JSON.stringify(closingIssues, null, 2));

    if (closingIssues.length === 0) {
      return [];
    }

    return closingIssues.map(({ node }) => node);
  }
}
