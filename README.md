# PR Helper - GitHub Action

> GitHub Action that automates some common PR operations like validating PR description, changelog, and credits.

[![Support Level](https://img.shields.io/badge/support-beta-blueviolet.svg)](#support-level) [![Release Version](https://img.shields.io/github/release/10up/action-pr-helper.svg)](https://github.com/10up/action-pr-helper/releases/latest) [![License](https://img.shields.io/github/license/10up/action-pr-helper.svg)](https://github.com/10up/action-pr-helper/blob/develop/LICENSE.md) [![CodeQL](https://github.com/10up/action-pr-helper/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/10up/action-pr-helper/actions/workflows/codeql-analysis.yml)

## Overview

@TODO

## Configuration

### Required secrets

* `GITHUB_TOKEN` 

### Other optional configurations

| Key | Default | Description |
| --- | ------- | ----------- |
| assign-pr | true | Wether assign PR to reporter |
| fail-label | `needs:feedback` | The label to be added to PR if the pull request doesn't pass the validation |
| pass-label | `needs:code-review` | The label to be added to PR if the pull request pass the validation |
| comment-template | `{author} thanks for the PR! Could you please fill out the PR template with description, changelog, and credits information so that we can properly review and merge this?` | Comment template for adding comment on PR if it doesn't pass the validation |
| reviewer | `team:open-source-practice` | Reviewer to request review after passing all validation checks. Add prefix `team:` if you want to assign PR to team.

## Example Workflow File

To get started, you will want to copy the contents of the given example into `.github/workflows/pr-helper.yml` and push that to your repository. You are welcome to name the file something else.

```yml
name: 'PR Helper'
on:
  pull_request:
    types:
      - opened
      - edited
      - converted_to_draft
      - ready_for_review
    branches:
      - develop

jobs:
  Validate:
    runs-on: ubuntu-latest
    steps:
      - uses: 10up/action-pr-helper@trunk
        with:
          fail-label: 'needs:feedback'
          pass-label: 'needs:code-review'
          reviewer: GITHUB_USERNAME
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

## Changelog

A complete listing of all notable changes to PR Helper - GitHub Action are documented in [CHANGELOG.md](https://github.com/10up/action-pr-helper/blob/develop/CHANGELOG.md).

## Contributing

Please read [CODE_OF_CONDUCT.md](https://github.com/10up/action-pr-helper/blob/develop/CODE_OF_CONDUCT.md) for details on our code of conduct, [CONTRIBUTING.md](https://github.com/10up/action-pr-helper/blob/develop/CONTRIBUTING.md) for details on the process for submitting pull requests to us, and [CREDITS.md](https://github.com/10up/action-pr-helper/blob/develop/CREDITS.md) for a list of maintainers, contributors, and libraries used in this repository.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850" alt="Work with us at 10up"></a>
