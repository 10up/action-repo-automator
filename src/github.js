const core = require("@actions/core");
const { Octokit } = require("@octokit/action");

const { versionCompare } = require("./utils");

export default class GitHub {
  constructor({ owner, repo }) {
    this.owner = owner;
    this.repo = repo;
    this.octokit = new Octokit();
  }

  /**
   * Assign PR to given user.
   *
   * @param {object} prAuthor
   * @returns void
   */
  async assignPR(prNumber, prAuthor) {
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
        issue_number: prNumber,
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
  async addLabel(prNumber, name) {
    try {
      if (!name) {
        return;
      }
      core.info(`Adding label (${name}) to PR...`);
      let addLabelResponse = await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        labels: [name],
      });
      core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`);
    } catch (error) {
      core.error(error);
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
  async removeLabel(prNumber, labels, name) {
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
        issue_number: prNumber,
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
  async addComment(prNumber, message) {
    try {
      if (!message) {
        return;
      }
      // Check if comment is already there.
      const { data: comments } = await this.octokit.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
      });

      const isExist = comments.some(({ body }) => {
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
        issue_number: prNumber,
        body: message,
      });
      core.info(`Comment Added - ${addCommentResponse.status}`);
    } catch (error) {
      core.info(`Failed to create comment on PR: ${error}`);
    }
  }

  /**
   * Remove comment from PR/Issue.
   *
   * @param {string} commentId Comment ID to remove.
   * @returns
   */
  async removeComment(commentId) {
    try {
      if (!commentId) {
        return;
      }

      core.info("Removing comment...");
      let removeCommentResponse = await this.octokit.issues.deleteComment({
        owner: this.owner,
        repo: this.repo,
        comment_id: commentId,
      });
      core.info(`Comment Removed - ${removeCommentResponse.status}`);
    } catch (error) {
      core.error(error);
      core.info(`Failed to remove comment: ${error}`);
    }
  }

  /**
   * Request review on PR.
   *
   * @param {string[]|boolean} prReviewers
   */
  async requestPRReview(prNumber, prReviewers) {
    try {
      if (!prReviewers) {
        return;
      }

      const reviewers = {};
      prReviewers.forEach((prReviewer) => {
        const isTeam = prReviewer.startsWith("team:");
        const reviewer = prReviewer.replace("team:", "");
        if (isTeam) {
          reviewers.team_reviewers = [
            ...(reviewers.team_reviewers || []),
            reviewer,
          ];
        } else {
          reviewers.reviewers = [...(reviewers.reviewers || []), reviewer];
        }
      });

      // Skip if no reviewers to request review.
      if (!reviewers.reviewers?.length && !reviewers.team_reviewers?.length) {
        return;
      }

      // Request Review.
      core.info("Requesting review...");
      let requestReviewResponse = await this.octokit.pulls.requestReviewers({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
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
   * @param {string[]|boolean} prReviewers
   */
  async removePRReviewer(prNumber, prReviewers, requestedReviewers) {
    try {
      if (!prReviewers) {
        return;
      }

      const reviewers = {};
      prReviewers.forEach((prReviewer) => {
        const isTeam = prReviewer.startsWith("team:");
        const reviewer = prReviewer.replace("team:", "");

        if (
          !requestedReviewers
            ?.map((ele) =>
              isTeam ? ele.slug?.toLowerCase() : ele.login?.toLowerCase()
            )
            ?.includes(reviewer.toLowerCase())
        ) {
          // Skip if review not requested from given team/users.
          return;
        }

        if (isTeam) {
          reviewers.team_reviewers = [
            ...(reviewers.team_reviewers || []),
            reviewer,
          ];
        } else {
          reviewers.reviewers = [...(reviewers.reviewers || []), reviewer];
        }
      });

      // Skip if no reviewers to remove.
      if (!reviewers.reviewers?.length && !reviewers.team_reviewers?.length) {
        return;
      }

      // Remove reviewer from PR
      core.info("Removing reviewer...");
      let removeReviewerResponse =
        await this.octokit.pulls.removeRequestedReviewers({
          owner: this.owner,
          repo: this.repo,
          pull_number: prNumber,
          ...reviewers,
        });
      core.info(`Reviewer Removed - ${removeReviewerResponse.status}`);
    } catch (error) {
      core.info(`Failed to remove reviewer from PR: ${error}`);
    }
  }

  /**
   * Assign Issue connected to PR to given user.
   *
   * @param {object} prAuthor
   * @returns void
   */
  async assignIssues(prNumber, prAuthor) {
    try {
      if ("User" !== prAuthor.type) {
        core.info(
          `PR author(${prAuthor.login}) is not user. Skipping assign PR.`
        );
        return;
      }

      // Get Issues connected to PR.
      const issues = await this.getClosingIssues(prNumber);
      if (!issues.length) {
        core.info(`No issues connected to PR.`);
        return;
      }

      // Assign Issues to PR author.
      core.info(`Assigning issues to author(${prAuthor.login})...`);
      for (const issue of issues) {
        let addAssigneesResponse = await this.octokit.issues.addAssignees({
          owner: this.owner,
          repo: this.repo,
          issue_number: issue.number,
          assignees: [prAuthor.login],
        });
        core.info(
          `Issue(#${issue.number}) assigned to (${prAuthor.login}) - ${addAssigneesResponse.status}`
        );
      }
    } catch (error) {
      core.info(`Failed assign issues to (${prAuthor.login}) : ${error}`);
    }
  }

  /**
   * Add Milestone to PR
   */
  async addMilestone(prNumber) {
    try {
      core.info("Adding milestone to PR...");
      const closingIssues = await this.getClosingIssues(prNumber);
      core.info(
        `Closing Issues for PR - ${JSON.stringify(closingIssues, null, 2)}`
      );

      // Get milestone from closing issues.
      let milestone;
      const issues = closingIssues
        ?.filter((issue) => issue.milestone)
        .sort((a, b) => versionCompare(a.milestone?.title, b.milestone?.title));

      if (issues.length) {
        milestone = issues[0]?.milestone;
        // Ignore milestone lower than current plugin version.
        const version = await this.getPluginVersion();
        if (version) {
          milestone = issues.find(
            (issue) => versionCompare(issue.milestone.title, version) > 0
          )?.milestone;
        }
        core.info(`Milestone found for closing issues: ${milestone?.number}`);
      } else {
        core.info(`No milestone found for closing issues`);
        core.info(`Find next milestone from open milestones in repo.`);
        // Get next milestone from open milestones in repo.
        milestone = await this.getNextMilestone();
      }

      if (milestone?.number) {
        core.info(`Adding milestone - ${milestone.number}`);
        const addMilestoneResponse = await this.octokit.issues.update({
          owner: this.owner,
          repo: this.repo,
          issue_number: prNumber,
          milestone: milestone.number,
        });
        core.info(`Milestone Added - ${addMilestoneResponse.status}`);
      }
    } catch (error) {
      core.info(`Failed to Add Milestone to PR: ${error}`);
    }
  }

  /**
   * Get Issues connected to PR.
   *
   * @returns array of issues
   */
  async getClosingIssues(prNumber) {
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
                  title
                }
              }
            }
          }
        }
      }
    }`;

    const issuesResponse = await this.octokit.graphql(query, {
      headers: {},
      prNumber,
      owner: this.owner,
      repo: this.repo,
    });

    const {
      repository: {
        pullRequest: {
          closingIssuesReferences: { edges: closingIssues },
        },
      },
    } = issuesResponse;
    core.debug(JSON.stringify(closingIssues, null, 2));

    if (closingIssues.length === 0) {
      return [];
    }

    return closingIssues.map(({ node }) => node);
  }

  /**
   * Get next milestone.
   * - Get all milestones.
   * - Sort milestones (Version Compare)
   * - return first milestone which is greater than current version.
   *
   * @returns {object} next milestone
   */
  async getNextMilestone() {
    const version = await this.getPluginVersion();
    const milestones = [];
    const responses = this.octokit.paginate.iterator(
      this.octokit.issues.listMilestones,
      {
        owner: this.owner,
        repo: this.repo,
        state: "open",
        sort: "due_on",
        direction: "desc",
      }
    );

    for await (const response of responses) {
      milestones.push(...response.data);
    }

    if (milestones.length === 0) {
      return null;
    }

    if (version) {
      return milestones
        .sort((a, b) => versionCompare(a.title, b.title))
        .find((milestone) => versionCompare(milestone.title, version) > 0);
    }

    return milestones.sort((a, b) => versionCompare(a.title, b.title))[0];
  }

  /**
   * Get Plugin version from package.json
   *
   * @returns {string} current version of plugin
   */
  async getPluginVersion() {
    const {
      data: { content, encoding },
    } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: "package.json",
    });
    // Current version of plugin.
    const { version } = JSON.parse(Buffer.from(content, encoding).toString());
    return version;
  }

  /**
   * Get all OPEN pull requests of repo.
   *
   * @returns {array} array of pull requests
   */
  async getAllPullRequests() {
    let cursor = null;
    let hasNextPage = true;
    const pullRequests = [];

    while (hasNextPage) {
      try {
        core.info(`Getting pull requests page ${cursor}`);
        core.info(`Has NextPage: ${hasNextPage}`);

        const response = await this.getPullRequestPages(cursor);

        const {
          errors,
          repository: {
            pullRequests: { nodes: prs, pageInfo },
          },
        } = response;

        if (errors) {
          core.info(errors);
          core.info("Unable to get pull requests");
          let errorMessage = "Unable to get pull requests";
          if (errors.length > 0 && errors[0].message) {
            errorMessage = errors[0].message;
          }
          throw new Error(`Unable to get pull requests: ${errorMessage}`);
        }

        if (prs.length > 0) {
          core.info(`Found ${prs.length} pull requests`);
          pullRequests.push(...prs);
        }
        cursor = pageInfo.endCursor;
        hasNextPage = pageInfo.hasNextPage;
      } catch (error) {
        core.info(`Failed to get pull requests: ${error}`);
        throw new Error(`Failed to get pull requests: ${error}`);
      }
    }

    return pullRequests;
  }

  /**
   * Get pull requests in pages.
   *
   * @param {string}  cursor  cursor for pagination
   * @returns {array} array of pull requests
   */
  async getPullRequestPages(cursor = null) {
    const query = `query ($owner: String!, $repo: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 100, states: OPEN, after: $after) {
            nodes {
              id
              number
              mergeable
              locked
              author {
                login
              }
              baseRefOid
              baseRef {
                target{
                  oid
                }
              }
              comments(last: 100) {
                nodes {
                  id
                  body
                  databaseId
                }
              }
              labels(last: 100) {
                nodes {
                  id
                  name
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }`;

    return this.octokit.graphql(query, {
      owner: this.owner,
      repo: this.repo,
      after: cursor,
    });
  }

  /**
   * Get pull request by number.
   *
   * @param {number} prNumber PR number
   * @returns {object} pull request
   */
  async getPullRequest(prNumber) {
    const query = `query ($owner: String!, $repo: String!, $prNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $prNumber) {
          id
          number
          mergeable
          locked
          author {
            login
          }
          baseRefOid
          baseRef {
            target{
              oid
            }
          }
          comments(last: 100) {
            nodes {
              id
              body
              databaseId
            }
          }
          labels(last: 100) {
            nodes {
              id
              name
            }
          }
        }
      }
    }`;

    const response = await this.octokit.graphql(query, {
      owner: this.owner,
      repo: this.repo,
      prNumber: Number(prNumber),
    });
    return response?.repository?.pullRequest;
  }

  /**
   * Update branch to latest base branch.
   *
   * @param {string} prNumber PR number
   */
  async updateBranch(prNumber) {
    const response = await this.octokit.pulls.updateBranch({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return response;
  }

  /**
   * Run GraphQL query.
   * @param {string} query
   * @param {object} variables
   * @returns {object} response
   */
  async graphql(query, variables) {
    return this.octokit.graphql(query, variables);
  }

  /**
   * Get team members.
   * @param {string} teamSlug
   * @returns {array} array of team members
   */
  async getTeamMembers(teamSlug) {
    const response = await this.octokit.teams.listMembersInOrg({
      org: this.owner,
      team_slug: teamSlug,
    });

    const members = response.data?.map((member) => member.login);
    return members;
  }

  /**
   * Parse users by replacing team with team members.
   *
   * @param {string[]} users
   * @returns {string[]} parsed users
   */
  async parseUsers(users) {
    const parsedUsers = [];
    for (const user of users) {
      if (user.startsWith("team:")) {
        const teamUsers = await this.getTeamMembers(user.replace("team:", ""));
        if (teamUsers?.length) {
          parsedUsers.push(...teamUsers);
        }
      } else {
        parsedUsers.push(user);
      }
    }
    return parsedUsers;
  }
}
