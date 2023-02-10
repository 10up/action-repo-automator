const core = require("@actions/core");

/**
 * Get PR description.
 *
 * @param {object} payload Pull request payload
 * @returns string
 */
export function getInputs() {
  const assignIssues =
    core.getInput("assign-issues") === "false" ? false : true;
  const assignPullRequest =
    core.getInput("assign-pr") === "false" ? false : true;
  const failLabel =
    core.getInput("fail-label") === "false"
      ? false
      : core.getInput("fail-label") || "needs:feedback";
  const passLabel =
    core.getInput("pass-label") === "false"
      ? false
      : core.getInput("pass-label") || "needs:code-review";
  const commentTemplate =
    core.getInput("comment-template") === "false"
      ? false
      : core.getInput("comment-template") ||
        "{author} thanks for the PR! Could you please fill out the PR template with description, changelog, and credits information so that we can properly review and merge this?";
  const prReviewer =
    core.getInput("reviewer") === "false"
      ? false
      : core.getInput("reviewer") || "team:open-source-practice";

  // Add debug log of some information.
  core.debug(`Assign Issues: ${assignIssues} (${typeof assignIssues})`);
  core.debug(`Assign PR: ${assignPullRequest} (${typeof assignPullRequest})`);
  core.debug(`Fail Label: ${failLabel} (${typeof failLabel})`);
  core.debug(`Pass Label: ${passLabel} (${typeof passLabel})`);
  core.debug(
    `Comment Template: ${commentTemplate} (${typeof commentTemplate})`
  );
  core.debug(`PR reviewer: ${prReviewer} (${typeof prReviewer})`);

  return {
    assignIssues,
    assignPullRequest,
    failLabel,
    passLabel,
    commentTemplate,
    prReviewer,
  };
}

/**
 * Get PR description.
 *
 * @param {object} payload Pull request payload
 * @returns string
 */
export function getDescription(payload) {
  let description = "";
  const cleanBody = payload?.body?.replace(/<!--.*?-->/gs, "");
  const matches = /#\s*Description of the Change.*\r?\n([^#]+)/.exec(cleanBody);
  if (matches !== null) {
    description = matches[1]
      .replace(/\r?\n|\r/g, "")
      .replace("Closes", "")
      .trim();
  }

  return description;
}

/**
 * Get Credits
 *
 * @param {object} payload Pull request payload
 * @returns array
 */
export function getCredits(payload) {
  const cleanBody = payload?.body?.replace(/<!--.*?-->/gs, "");
  let credits = [];
  const matches = /#\s*Credits.*\r?\n([^#]+)/.exec(cleanBody);
  if (matches !== null) {
    credits = matches[1].match(/@([\w-]+)/g);
    if (credits !== null) {
      return credits
        .map((item) => {
          return item.trim().replace("@", "");
        })
        .filter((username) => {
          return username.match(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i);
        });
    }
  }

  return [];
}

/**
 * Get Changelog
 *
 * @param {object} payload Pull request payload
 * @returns array
 */
export function getChangelog(payload) {
  let entries = [];
  const cleanBody = payload?.body?.replace(/<!--.*?-->/gs, "");
  const matches = /#\s*Changelog.*\r?\n([^#]+)/.exec(cleanBody);
  if (matches !== null) {
    const changelog = matches[1];
    entries = changelog.split(/\r?\n/);
  }

  return entries.filter((entry) => entry.length > 0);
}
