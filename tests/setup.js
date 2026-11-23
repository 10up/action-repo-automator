// Environment the action expects when it runs inside GitHub Actions.
// Imported first by the test entry point so it is set before any source module loads.
process.env.GITHUB_ACTION = "test";
process.env.GITHUB_TOKEN = "test-token";
process.env.GITHUB_REPOSITORY = "octo-org/octo-repo";
process.env["INPUT_SYNC-PR-BRANCH"] = "false";
