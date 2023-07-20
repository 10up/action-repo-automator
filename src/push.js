import core from "@actions/core";
import github from "@actions/github";

import PRConflict from "./src/pr-conflict";

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

export async function run() {
    // Bail if not a on push event.
    if ("push" !== github.context.eventName) {
        core.info("Skipping operations on push event");
        return;
    }

    // Handle PR Conflicts.
    const conflictFinder = new PRConflict(owner, repo);
    await conflictFinder.run();
}
