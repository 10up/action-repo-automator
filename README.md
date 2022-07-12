# PR Helper - GitHub Action
GH Action for automate some common PR operations and validate PR description, changelog and credits.

## Configuration
### Required secrets
* `GITHUB_TOKEN` 



### Other optional configuration

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
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
