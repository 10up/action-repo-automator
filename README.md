# Repo Automator - GitHub Action

> GitHub Action that automates some common repository operations like validating PR description, changelog and credits.

[![Support Level](https://img.shields.io/badge/support-beta-blueviolet.svg)](#support-level) [![Release Version](https://img.shields.io/github/release/10up/action-repo-automator.svg)](https://github.com/10up/action-repo-automator/releases/latest) [![License](https://img.shields.io/github/license/10up/action-repo-automator.svg)](https://github.com/10up/action-repo-automator/blob/develop/LICENSE.md) [![CodeQL](https://github.com/10up/action-repo-automator/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/10up/action-repo-automator/actions/workflows/codeql-analysis.yml)

## Overview

This GitHub Action Helps with the following operations:

- **Validate PR description:** It validates PR description to make sure it contains description of the change, changelog and credits. Also, you can set custom comment message for PR author to inform them about PR description requirements.
- **Add Labels:** It helps with adding label to PR when PR validation pass or fail.
- **Auto-assign Issues:** This feature helps to automatically assign issue with PR assignee when a linked PR is merged.
- **Auto-assign PR:** It helps with assigning PR to the author.
- **Auto request review:** It helps with request review from the team or GitHub user given in the configuration.
- **Add Milestone:** Automatically adds a Milestone to PRs. If the PR is connected to an issue with a milestone, the same milestone will be added to the PR. Otherwise, the next milestone from the available milestones will be assigned, sorted using version comparison.
- **Auto-label merge conflicts:** Automatically adds a label to PRs with merge conflicts, and once a conflict is resolved, the label is automatically removed.
- **Auto-comment merge conflicts:** Automatically adds a comment to PRs with merge conflicts to notify the PR author, and once a conflict is resolved, the comment is automatically removed.
- **Auto-Sync PR branch:** Automatically keeps the pull request branch up to date with the base branch.
- **Welcome first-time contributors:** Greet first-time contributors with a warm welcome message on their first issue or PR to the project.
- **Auto-comment on new Issues/PRs:** Automatically adds a comment to newly opened issues and PRs. This can be used to request users to provide as much context as possible or share links to your contributing guidelines, or anything else that suits your use case.

## Configuration

### Required secrets

- `GITHUB_TOKEN`

### Other optional configurations

| Key | Default | Description |
| --- | ------- | ----------- |
| assign-pr | true | Whether to assign PR to author |
| assign-issues | true | Whether to assign issue with PR assignee when linked PR is merged |
| add-milestone | true | Whether to automatically add a Milestone to a PR |
| fail-label | `needs:feedback` | The label to be added to PR if the pull request doesn't pass the validation. Pass `false` to skip adding the label. |
| pass-label | `needs:code-review` | The label to be added to PR if the pull request pass the validation. Pass `false` to skip adding the label. |
| conflict-label | `needs:refresh` | The label to be added to PR if the pull request has conflicts. Pass `false` to skip adding the label. |
| comment-template | `{author} thanks for the PR! Could you please fill out the PR template with description, changelog, and credits information so that we can properly review and merge this?` | Comment template for adding comment on PR if it doesn't pass the validation. Pass `false` to skip adding the comment. |
| conflict-comment | `{author} thanks for the PR! Could you please rebase your PR on top of the latest changes in the base branch?` | Comment template for adding comment on PR if it has conflicts. Pass `false` to skip adding the comment. |
| issue-welcome-message | false | Comment template for adding a welcome message on an issue for first-time issue creators |
| pr-welcome-message | false | Comment template for adding a welcome message on a PR for first-time PR creators |
| issue-comment | false | Comment template for adding a comment to a newly opened issue |
| pr-comment | false | Comment template for adding a comment to a newly opened pull request |
| comment-ignore-users | - | List of users to ignore for adding comments when the issue or PR is opened by them.  Add prefix `team:` if you want to ignore users from the team. |
| reviewers | `team:open-source-practice` | List of Reviewers to request PR review after passing all validation checks. Add prefix `team:` if you want to request review from the team.
| sync-pr-branch | false | Whether to enable automatic synchronization of the pull request branch with the base branch |
| validate-description | true | Whether to validate the pull request description. Pass `false` to disable description validation |
| validate-changelog | true | Whether to validate the pull request changelog entry. Pass `false` to disable changelog validation |
| validate-credits | true | Whether to validate the props given in pull request. Pass `false` to disable credits validation |
| wait-ms | `15000` | Time to wait in milliseconds between retries to check PR mergeable status |
| max-retries | `5` | Maximum number of retries to check PR mergeable status |

## Example Workflow File

To get started, you will want to copy the contents of the given example into `.github/workflows/repo-automator.yml` and push that to your repository. You are welcome to name the file something else.

```yml
name: 'Repo Automator'
on:
  issues:
    types:
      - opened
  push:
    branches:
      - develop
  pull_request:
    types:
      - opened
      - edited
      - synchronize
      - converted_to_draft
      - ready_for_review
    branches:
      - develop

jobs:
  Validate:
    runs-on: ubuntu-latest
    steps:
      - uses: 10up/action-repo-automator@trunk
        with:
          fail-label: 'needs:feedback'
          pass-label: 'needs:code-review'
          conflict-label: 'needs:refresh'
          issue-welcome-message: |
            Welcome {author}! 👋 Thank you for opening your first issue! We're glad to have you here and appreciate your contribution. If you need any help or have questions, feel free to ask. Happy coding! 🚀
          reviewers: |
            GITHUB_USERNAME
            team:GITHUB_TEAM_SLUG
          issue-comment: |
            Hi {author},

            Thank you for reporting this issue! We appreciate your feedback and will look into it promptly.
          comment-ignore-users: |
            GITHUB_USERNAME
            team:GITHUB_TEAM_SLUG
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### (Optional) GitHub Personal Access Token (PAT)

When the default `GITHUB_TOKEN` doesn't have the necessary permissions, you need to create a new GitHub personal access token.

For example, if you'd like to request a review from **GitHub teams**, you need to create a new PAT because the default `GITHUB_TOKEN` doesn't have the permission to request a review from a team.

The PAT needs to have the `repo` scope and the account used for create a `PAT` needs to have the write permission to the repository. Once you create a new PAT, set it as a secret in your repository.

You have to pass your `PAT` to `GITHUB_TOKEN`  environment variable, as below.

```yml
env:
  GITHUB_TOKEN: ${{ secrets.PAT }}
```

## Support Level

**Beta:** This project is quite new and we're not sure what our ongoing support level for this will be. Bug reports, feature requests, questions, and pull requests are welcome. If you like this project please let us know, but be cautious using this in a Production environment!

## Known Caveats/Issues

__Fork-based PRs__ - When creating a pull request from a fork, GitHub limits the permissions of `GITHUB_TOKEN` and other API access tokens. This means that the provided `GITHUB_TOKEN` will not have write access, and the secrets will not be accessible. As a result, some operations (such as adding labels, auto-assigning pull requests, and requesting reviews automatically) will be skipped for pull requests from forked repositories, as these operations require write access to perform successfully.

__Merge Conflicts__ - Sometimes, GitHub does not reliably compute the [`mergeable`](https://docs.github.com/en/graphql/reference/enums#mergeablestate) status, which is essential for this action to detect merge conflicts. When the base branch (like "main") is updated, the mergeable status becomes `UNKNOWN` until it is requested by someone, like this action. GitHub then tries to figure out the status with a background process. This process is usually fast and straightforward, but there's no absolute assurance, and occasional problems on GitHub's end may arise. If you need more time for the Pull Request to be processed, you can adjust the settings for `max-retries` and `wait_ms` to extend the timeout before giving up.

## Changelog

A complete listing of all notable changes to Repo Automator - GitHub Action are documented in [CHANGELOG.md](https://github.com/10up/action-repo-automator/blob/develop/CHANGELOG.md).

## Contributing

Please read [CODE_OF_CONDUCT.md](https://github.com/10up/action-repo-automator/blob/develop/CODE_OF_CONDUCT.md) for details on our code of conduct, [CONTRIBUTING.md](https://github.com/10up/action-repo-automator/blob/develop/CONTRIBUTING.md) for details on the process for submitting pull requests to us, and [CREDITS.md](https://github.com/10up/action-repo-automator/blob/develop/CREDITS.md) for a list of maintainers, contributors, and libraries used in this repository.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850" alt="Work with us at 10up"></a>
