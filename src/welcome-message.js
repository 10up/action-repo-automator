import * as core from "@actions/core";
import * as github from "@actions/github";

import GitHub from "./github";
const { getInputs } = require("./utils.js");

export default class WelcomeMessage {
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
    const { issueWelcomeMessage, prWelcomeMessage } = this.inputs;
    if (!isPR && !isIssue) {
      core.info("Not a pull request or Issue! Skipping...");
      return;
    }

    console.log("isPR", isPR);
    console.log("isIssue", isIssue);

    if (isIssue && !issueWelcomeMessage) {
      core.info("Issue welcome message is not provided! Skipping...");
      return;
    }

    if (isPR && !prWelcomeMessage) {
      core.info("PR welcome message is not provided! Skipping...");
      return;
    }

    const { issue, pull_request } = context.payload;
    const { number } = issue || pull_request;
    const author = context.payload?.sender?.login;
    if (!author) {
      core.info("No author found! Skipping...");
      return;
    }

    let isFirst = false;
    if (isIssue) {
      isFirst = await this.isFirstIssue(author, number);
    } else if (isPR) {
      isFirst = await this.isFirstPR(author, number);
    }

    if (!isFirst) {
      core.info("Not first issue or PR! Skipping...");
      return;
    }

    // Add welcome message
    core.info("Adding welcome message...");
    const welcomeMessage = isIssue ? issueWelcomeMessage : prWelcomeMessage;
    const comment = welcomeMessage.replace("{author}", `@${author}`);

    await this.gh.addComment(number, comment);
  }

  /**
   * Check if PR is first PR of user.
   *
   * @param {string} prAuthor
   * @param {number} prNumber
   * @returns
   */
  async isFirstPR(prAuthor, prNumber) {
    try {
      const query = `query ($queryString: String!) {
        search(query: $queryString, first: 10, type: ISSUE) {
          edges {
            node {
              ... on PullRequest {
                number
              }
            }
          }
        }
      }`;

      const response = await this.gh.graphql(query, {
        queryString: `is:pr author:${prAuthor} repo:${this.owner}/${this.repo}`,
      });

      const {
        search: { edges },
      } = response;
      if (edges.length === 0) {
        return true;
      }
      console.log(edges);
      return !edges.some(({ node }) => node.number < prNumber);
    } catch (error) {
      core.info(`Failed to check if PR is first PR: ${error}`);
      return false;
    }
  }

  async isFirstIssue(createdBy, issueNumber) {
    try {
      const query = `query query($owner: String!, $repo: String!, $createdBy: String!) {
        repository(owner: $owner, name: $repo) {
          issues(
            filterBy: {createdBy: $createdBy}
            first: 10
            orderBy: {field: CREATED_AT, direction: ASC}
          ) {
            edges {
              node {
                number
              }
            }
          }
        }
      }`;

      const response = await this.gh.graphql(query, {
        owner: this.owner,
        repo: this.repo,
        createdBy: createdBy,
      });

      const issues = response?.repository?.issues?.edges;
      if (issues.length === 0) {
        return true;
      }
      return !issues.some(({ node }) => node.number < issueNumber);
    } catch (error) {
      core.info(`Failed to check if issue is first issue: ${error}`);
      return false;
    }
  }
}
