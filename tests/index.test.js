import "./setup";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { beforeEach, describe, it } = require("node:test");

import GitHub from "../src/github";
import PRValidation, { VALIDATION_COMMENT_MARKER } from "../src/pr-validation";
const { getSectionContent, isPullRequestEvent } = require("../src/utils");

// The bundled test file runs from the repository root (see the "test" npm script).
const template = fs.readFileSync(
  path.join(process.cwd(), "tests/fixtures/wordpress-ai-pr-template.md"),
  "utf8"
);

const SECTIONS = [
  "What?",
  "Why?",
  "Use of AI Tools",
  "Testing Instructions",
  "Changelog Entry",
];

const PLAYGROUND_BUTTON = [
  "<!-- wp-playground-preview:start -->",
  '<a href="https://playground.wordpress.net?blueprint-url=https://example.com/blueprint.json">',
  '<img src="https://example.com/button.svg" alt="Open WordPress Playground Preview" width="220" height="51" />',
  "</a>",
  "<!-- wp-playground-preview:end -->",
].join("\n");

/**
 * Build a PR body from the template, filling in the given sections.
 *
 * @param {object} filled Map of heading text to the content written under it.
 * @param {object} options
 * @param {boolean} options.keepSamples Leave the template's sample lines in place.
 */
function fillTemplate(filled = {}, { keepSamples = false } = {}) {
  const lines = [];
  let skip = false;
  for (const line of template.split("\n")) {
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      skip = false;
      lines.push(line);
      if (heading[1].trim() in filled) {
        lines.push(filled[heading[1].trim()], "");
        skip = !keepSamples;
      }
      continue;
    }
    if (!skip) {
      lines.push(line);
    }
  }
  return lines.join("\n");
}

function setInputs(inputs) {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("INPUT_") && key !== "INPUT_SYNC-PR-BRANCH") {
      delete process.env[key];
    }
  }
  for (const [name, value] of Object.entries(inputs)) {
    process.env[`INPUT_${name.toUpperCase()}`] = value;
  }
}

describe("getSectionContent", () => {
  it("treats every section of an untouched template as empty", () => {
    const payload = { body: template };
    for (const heading of SECTIONS) {
      assert.equal(getSectionContent(payload, heading, template), "", heading);
    }
  });

  it("treats a section left as a bare closing keyword as empty", () => {
    const payload = { body: fillTemplate({ "Why?": "Because." }) };
    assert.equal(getSectionContent(payload, "What?", template), "");
  });

  it("counts a filled in closing keyword as content", () => {
    const payload = { body: template.replace("Closes <!--", "Closes #12 <!--") };
    assert.equal(getSectionContent(payload, "What?", template), "Closes #12");
  });

  it("counts a changelog entry written as a blockquote, like the template samples", () => {
    const payload = {
      body: fillTemplate({
        "Changelog Entry": "> Developer - Add Repo Automator workflow file.",
      }),
    };
    assert.equal(
      getSectionContent(payload, "Changelog Entry", template),
      "> Developer - Add Repo Automator workflow file."
    );
  });

  it("ignores template sample lines left next to a real entry", () => {
    const payload = {
      body: fillTemplate(
        { "Changelog Entry": "> Fixed - A real bug." },
        { keepSamples: true }
      ),
    };
    assert.equal(
      getSectionContent(payload, "Changelog Entry", template),
      "> Fixed - A real bug."
    );
  });

  it("ignores blocks that other tools append between start and end markers", () => {
    const payload = { body: `${template}\n\n${PLAYGROUND_BUTTON}\n` };
    assert.equal(getSectionContent(payload, "Changelog Entry", template), "");
  });

  it("handles Windows line endings in the PR body", () => {
    const payload = { body: template.replace(/\n/g, "\r\n") };
    for (const heading of SECTIONS) {
      assert.equal(getSectionContent(payload, heading, template), "", heading);
    }
  });

  it("keeps ignoring blockquotes when the repository has no PR template", () => {
    const payload = { body: "## Changelog Entry\n> Added - New feature.\n" };
    assert.equal(getSectionContent(payload, "Changelog Entry"), "");
    assert.equal(getSectionContent(payload, "Changelog Entry", ""), "");
  });

  it("counts everything in a section the template does not have", () => {
    const payload = { body: "## Notes\n> Quoted note.\n" };
    assert.equal(getSectionContent(payload, "Notes", template), "> Quoted note.");
  });
});

describe("isPullRequestEvent", () => {
  it("accepts pull_request and pull_request_target", () => {
    assert.equal(isPullRequestEvent("pull_request"), true);
    assert.equal(isPullRequestEvent("pull_request_target"), true);
    assert.equal(isPullRequestEvent("issues"), false);
    assert.equal(isPullRequestEvent("push"), false);
  });
});

describe("PRValidation", () => {
  const commentTemplate =
    "{author} thanks for the PR!  Could you please fill out the PR template?";
  const legacyComment =
    "@octocat thanks for the PR!  Could you please fill out the PR template?";

  let calls;
  let validation;

  function pullRequest(body, overrides = {}) {
    return {
      number: 765,
      body,
      labels: [],
      requested_reviewers: [],
      user: { login: "octocat", type: "User" },
      base: { ref: "develop" },
      ...overrides,
    };
  }

  beforeEach(() => {
    process.exitCode = undefined;
    setInputs({
      "fail-label": "Needs Feedback",
      "pass-label": "Needs Code Review",
      "comment-template": commentTemplate,
      reviewers: "octo-reviewer",
      "validate-description": "false",
      "validate-changelog": "false",
      "validate-credits": "false",
      "validate-pr-template-sections": SECTIONS.join("\n"),
    });

    calls = [];
    const record =
      (name, result) =>
      async (...args) => {
        calls.push([name, ...args]);
        return typeof result === "function" ? result(...args) : result;
      };

    validation = new PRValidation("octo-org", "octo-repo");
    validation.gh = {
      addLabel: record("addLabel"),
      removeLabel: record("removeLabel"),
      requestPRReview: record("requestPRReview"),
      getPullRequestTemplate: record("getPullRequestTemplate", template),
      upsertComment: record("upsertComment"),
      removeComments: record("removeComments"),
    };
  });

  const callsTo = (name) => calls.filter(([call]) => call === name);

  it("lists every failed check in the PR comment", async () => {
    const body = fillTemplate({
      "What?": "Adds a workflow.",
      "Use of AI Tools": "AI assistance: none.",
      "Changelog Entry": "> Developer - Add Repo Automator workflow file.",
    });

    await validation.run(pullRequest(`${body}\n${PLAYGROUND_BUTTON}`));
    assert.equal(process.exitCode, 1);
    process.exitCode = undefined;

    const [[, number, comment]] = callsTo("upsertComment");
    assert.equal(number, 765);
    assert.equal(
      comment,
      [
        legacyComment,
        "",
        "- Please fill out the **Why?** section of the PR template",
        "- Please fill out the **Testing Instructions** section of the PR template",
        "",
        VALIDATION_COMMENT_MARKER,
      ].join("\n")
    );
    assert.deepEqual(callsTo("addLabel"), [["addLabel", 765, "Needs Feedback"]]);
    assert.deepEqual(callsTo("getPullRequestTemplate"), [
      ["getPullRequestTemplate", "develop"],
    ]);
  });

  it("recognises its own earlier comments, including ones posted before the marker existed", async () => {
    await validation.run(pullRequest(template));
    process.exitCode = undefined;

    const [[, , , isValidationComment]] = callsTo("upsertComment");
    assert.equal(isValidationComment({ body: legacyComment }), true);
    assert.equal(
      isValidationComment({ body: `anything\n${VALIDATION_COMMENT_MARKER}` }),
      true
    );
    assert.equal(isValidationComment({ body: `> ${legacyComment}` }), false);
    assert.equal(isValidationComment({ body: "LGTM" }), false);
    assert.equal(isValidationComment({ body: null }), false);
  });

  it("removes the comment and requests review once the PR passes", async () => {
    const body = fillTemplate({
      "What?": "Adds a workflow.",
      "Why?": "Maintainers need help.",
      "Use of AI Tools": "AI assistance: none.",
      "Testing Instructions": "Open a PR.",
      "Changelog Entry": "> Developer - Add Repo Automator workflow file.",
    });

    await validation.run(pullRequest(body));

    assert.equal(process.exitCode, undefined);
    assert.equal(callsTo("upsertComment").length, 0);
    const [[, number, isValidationComment]] = callsTo("removeComments");
    assert.equal(number, 765);
    assert.equal(isValidationComment({ body: legacyComment }), true);
    assert.deepEqual(callsTo("addLabel"), [
      ["addLabel", 765, "Needs Code Review"],
    ]);
    assert.equal(callsTo("requestPRReview").length, 1);
  });

  it("leaves comments alone when the comment template is disabled", async () => {
    process.env["INPUT_COMMENT-TEMPLATE"] = "false";

    await validation.run(pullRequest(template));
    assert.equal(process.exitCode, 1);
    process.exitCode = undefined;

    assert.equal(callsTo("upsertComment").length, 0);
    assert.equal(callsTo("removeComments").length, 0);
  });

  it("does not look up the PR template when section validation is off", async () => {
    setInputs({
      "comment-template": commentTemplate,
      "validate-changelog": "false",
      "validate-credits": "false",
    });

    await validation.run(pullRequest("Nothing useful."));
    process.exitCode = undefined;

    assert.equal(callsTo("getPullRequestTemplate").length, 0);
    const [[, , comment]] = callsTo("upsertComment");
    assert.match(
      comment,
      /\n- Please add some description about the changes made in PR\n/
    );
  });
});

describe("GitHub", () => {
  let gh;
  let requests;
  let comments;
  let files;

  const isMatch = ({ body }) => body.includes("<!-- marker -->");

  beforeEach(() => {
    requests = [];
    comments = [];
    files = {};
    gh = new GitHub({ owner: "octo-org", repo: "octo-repo" });

    const record = (name, result) => {
      const endpoint = async (params) => {
        requests.push([name, params]);
        return { status: 200, data: await result?.(params) };
      };
      endpoint.endpointName = name;
      return endpoint;
    };

    gh.octokit = {
      // The real client follows pagination; hand back every comment like it does.
      paginate: async (endpoint, params) => {
        requests.push([`paginate:${endpoint.endpointName}`, params]);
        return comments;
      },
      issues: {
        listComments: record("listComments", () => comments.slice(0, 30)),
        createComment: record("createComment"),
        updateComment: record("updateComment"),
        deleteComment: record("deleteComment"),
      },
      repos: {
        getContent: record("getContent", ({ path: filePath }) => {
          if (!(filePath in files)) {
            throw Object.assign(new Error("Not Found"), { status: 404 });
          }
          return files[filePath];
        }),
      },
    };
  });

  const requestsTo = (name) => requests.filter(([request]) => request === name);

  describe("upsertComment", () => {
    it("creates the comment when there is none", async () => {
      comments = [{ id: 1, body: "LGTM" }];
      await gh.upsertComment(7, "new <!-- marker -->", isMatch);

      assert.deepEqual(requestsTo("createComment"), [
        [
          "createComment",
          {
            owner: "octo-org",
            repo: "octo-repo",
            issue_number: 7,
            body: "new <!-- marker -->",
          },
        ],
      ]);
      assert.equal(requestsTo("updateComment").length, 0);
    });

    it("updates the existing comment when its text is out of date", async () => {
      comments = [
        { id: 1, body: "LGTM" },
        { id: 2, body: "old <!-- marker -->" },
      ];
      await gh.upsertComment(7, "new <!-- marker -->", isMatch);

      assert.deepEqual(requestsTo("updateComment"), [
        [
          "updateComment",
          {
            owner: "octo-org",
            repo: "octo-repo",
            comment_id: 2,
            body: "new <!-- marker -->",
          },
        ],
      ]);
      assert.equal(requestsTo("createComment").length, 0);
    });

    it("does nothing when the existing comment is already current", async () => {
      comments = [{ id: 2, body: "new <!-- marker -->" }];
      await gh.upsertComment(7, "new <!-- marker -->", isMatch);

      assert.equal(requestsTo("createComment").length, 0);
      assert.equal(requestsTo("updateComment").length, 0);
    });

    it("finds the existing comment on a PR with more than one page of comments", async () => {
      comments = Array.from({ length: 45 }, (_, i) => ({
        id: i + 1,
        body: i === 40 ? "new <!-- marker -->" : `comment ${i}`,
      }));
      await gh.upsertComment(7, "new <!-- marker -->", isMatch);

      assert.equal(requestsTo("createComment").length, 0);
    });
  });

  describe("addComment", () => {
    it("does not repeat a comment that sits past the first page", async () => {
      comments = Array.from({ length: 45 }, (_, i) => ({
        id: i + 1,
        body: i === 40 ? "Welcome!" : `comment ${i}`,
      }));
      await gh.addComment(7, "Welcome!");

      assert.equal(requestsTo("createComment").length, 0);
    });
  });

  describe("removeComments", () => {
    it("deletes only the matching comments", async () => {
      comments = [
        { id: 1, body: "LGTM" },
        { id: 2, body: "old <!-- marker -->" },
      ];
      await gh.removeComments(7, isMatch);

      assert.deepEqual(requestsTo("deleteComment"), [
        ["deleteComment", { owner: "octo-org", repo: "octo-repo", comment_id: 2 }],
      ]);
    });
  });

  describe("getPullRequestTemplate", () => {
    const file = (text) => ({
      type: "file",
      encoding: "base64",
      content: Buffer.from(text).toString("base64"),
    });

    it("reads the template from the .github directory of the given branch", async () => {
      files[".github"] = [
        { type: "dir", name: "workflows", path: ".github/workflows" },
        {
          type: "file",
          name: "PULL_REQUEST_TEMPLATE.md",
          path: ".github/PULL_REQUEST_TEMPLATE.md",
        },
      ];
      files[".github/PULL_REQUEST_TEMPLATE.md"] = file("## What?\n");

      assert.equal(await gh.getPullRequestTemplate("develop"), "## What?\n");
      assert.ok(requestsTo("getContent").every(([, { ref }]) => ref === "develop"));
    });

    it("finds a lowercase template in the repository root", async () => {
      files[""] = [
        { type: "file", name: "README.md", path: "README.md" },
        {
          type: "file",
          name: "pull_request_template.md",
          path: "pull_request_template.md",
        },
      ];
      files["pull_request_template.md"] = file("## Why?\n");

      assert.equal(await gh.getPullRequestTemplate("trunk"), "## Why?\n");
    });

    it("returns an empty string when the repository has no template", async () => {
      files[""] = [{ type: "file", name: "README.md", path: "README.md" }];

      assert.equal(await gh.getPullRequestTemplate("trunk"), "");
    });
  });
});
