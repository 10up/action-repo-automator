# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/), and will adhere to [Semantic Versioning](http://semver.org/).

## [Unreleased] - TBD

## [2.1.1] - 2024-02-29
### Changed
- Disabled dependabot version updates for GitHub Actions and npm dependencies (props [@iamdharmesh](https://github.com/iamdharmesh), [@jeffpaul](https://github.com/jeffpaul) via [#113](https://github.com/10up/action-repo-automator/pull/113))
- Updated pull request validation input to accept true/false instead of a regex expression (props [@iamdharmesh](https://github.com/iamdharmesh), [@dkotter](https://github.com/dkotter) via [#114](https://github.com/10up/action-repo-automator/pull/114))

### Security
- Bump `eslint` from 8.53.0 to 8.54.0 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#112](https://github.com/10up/action-repo-automator/pull/112))

## [2.1.0] - 2023-11-14
### Changed
- Skip merge conflict check and auto-sync on pull requests from bots (props [@iamdharmesh](https://github.com/iamdharmesh), [@peterwilsoncc](https://github.com/peterwilsoncc) via [#100](https://github.com/10up/action-repo-automator/pull/100))

### Fixed
- Ensure we properly remove all HTML comments from input strings (props [@dkotter](https://github.com/dkotter), [@iamdharmesh](https://github.com/iamdharmesh) via [#108](https://github.com/10up/action-repo-automator/pull/108))

### Security
- Bump `actions/setup-node` from 3.8.0 to 4.0.0 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#90](https://github.com/10up/action-repo-automator/pull/90), [#107](https://github.com/10up/action-repo-automator/pull/107))
- Bump `eslint` from 8.47.0 to 8.53.0 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#92](https://github.com/10up/action-repo-automator/pull/92), [#95](https://github.com/10up/action-repo-automator/pull/95), [#99](https://github.com/10up/action-repo-automator/pull/99), [#101](https://github.com/10up/action-repo-automator/pull/101), [#106](https://github.com/10up/action-repo-automator/pull/106), [#110](https://github.com/10up/action-repo-automator/pull/110))
- Bump `actions/checkout` from 3 to 4 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#93](https://github.com/10up/action-repo-automator/pull/93))
- Bump `@vercel/ncc` from 0.36.1 to 0.38.1 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#94](https://github.com/10up/action-repo-automator/pull/94), [#104](https://github.com/10up/action-repo-automator/pull/104))
- Bump `@actions/core` from 1.10.0 to 1.10.1 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#96](https://github.com/10up/action-repo-automator/pull/96))
- Bump `@octokit/action` from 6.0.5 to 6.0.6 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#98](https://github.com/10up/action-repo-automator/pull/98))
- Bump `@actions/github` from 5.1.1 to 6.0.0 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#102](https://github.com/10up/action-repo-automator/pull/102))
- Bump `undici` from 5.25.4 to 5.26.4 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@iamdharmesh](https://github.com/iamdharmesh) via [#105](https://github.com/10up/action-repo-automator/pull/105))

## [2.0.0] - 2023-08-21
**Note that this release renames action to "Repo Automator"**

### Added
- Support for automatically add a milestone. (props [@iamdharmesh](https://github.com/iamdharmesh), [@jeffpaul](https://github.com/jeffpaul), [@faisal-alvi](https://github.com/faisal-alvi) via [#47](https://github.com/10up/action-pr-automator/pull/47))
- Support for request PR review from multiple reviewers. (props [@iamdharmesh](https://github.com/iamdharmesh), [@faisal-alvi](https://github.com/faisal-alvi), [@jeffpaul](https://github.com/jeffpaul) via [#48](https://github.com/10up/action-pr-automator/pull/48))
- Support for auto-assigning issues to PR author. (props [@iamdharmesh](https://github.com/iamdharmesh), [@jeffpaul](https://github.com/jeffpaul), [@faisal-alvi](https://github.com/faisal-alvi) via [#49](https://github.com/10up/action-pr-automator/pull/49))
- Support for notify merge conflict (props [@iamdharmesh](https://github.com/iamdharmesh), [@dkotter](https://github.com/dkotter) via [#72](https://github.com/10up/action-pr-automator/pull/72))
- Support for welcome first-time contributors (props [@iamdharmesh](https://github.com/iamdharmesh), [@jeffpaul](https://github.com/jeffpaul), [@ravinderk](https://github.com/ravinderk) via [#82](https://github.com/10up/action-pr-automator/pull/82))
- Support auto-comment on new issues and pull requests (props [@iamdharmesh](https://github.com/iamdharmesh), [@jeffpaul](https://github.com/jeffpaul), [@ravinderk](https://github.com/ravinderk) via [#83](https://github.com/10up/action-pr-automator/pull/83))
- Support for auto-sync PR branch. (props [@iamdharmesh](https://github.com/iamdharmesh), [@ravinderk](https://github.com/ravinderk) via [#81](https://github.com/10up/action-pr-automator/pull/81))
- Support for passing pull request validation regex from workflow file. (props [@senhordaluz](https://github.com/senhordaluz), [@iamdharmesh](https://github.com/iamdharmesh), [@Sidsector9](https://github.com/Sidsector9) via [#84](https://github.com/10up/action-pr-automator/pull/84))

### Changed
- Renamed `reviewer` configuration field to `reviewers`. (props [@iamdharmesh](https://github.com/iamdharmesh), [@faisal-alvi](https://github.com/faisal-alvi), [@jeffpaul](https://github.com/jeffpaul) via [#48](https://github.com/10up/action-pr-automator/pull/48))
- Rename action to "Repo Automator" (props [@iamdharmesh](https://github.com/iamdharmesh), [@jeffpaul](https://github.com/jeffpaul) via [#87](https://github.com/10up/action-repo-automator/pull/87))

### Security
- Bump `@octokit/action` from 4.0.9 to 6.0.5 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@jeffpaul](https://github.com/jeffpaul), [@iamdharmesh](https://github.com/iamdharmesh) via [#30](https://github.com/10up/action-pr-automator/pull/30), [#40](https://github.com/10up/action-pr-automator/pull/40), [#60](https://github.com/10up/action-pr-automator/pull/60), [#62](https://github.com/10up/action-pr-automator/pull/62), [#64](https://github.com/10up/action-pr-automator/pull/64), [#66](https://github.com/10up/action-pr-automator/pull/66), [#69](https://github.com/10up/action-pr-automator/pull/69), [#78](https://github.com/10up/action-pr-automator/pull/78))
- Bump `@vercel/ncc` from 0.34.0 to 0.36.1 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@jeffpaul](https://github.com/jeffpaul), [@iamdharmesh](https://github.com/iamdharmesh) via [#35](https://github.com/10up/action-pr-automator/pull/35), [#41](https://github.com/10up/action-pr-automator/pull/41))
- Bump `actions/setup-node` from 3.5.1 to 3.8.0 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@jeffpaul](https://github.com/jeffpaul), [@iamdharmesh](https://github.com/iamdharmesh) via [#38](https://github.com/10up/action-pr-automator/pull/38), [#71](https://github.com/10up/action-pr-automator/pull/71), [#89](https://github.com/10up/action-pr-automator/pull/89))
- Bump `eslint` from 8.25.0 to 8.47.0 (props [@dependabot[bot]](https://github.com/apps/dependabot), [@jeffpaul](https://github.com/jeffpaul), [@iamdharmesh](https://github.com/iamdharmesh) via [#31](https://github.com/10up/action-pr-automator/pull/31), [#32](https://github.com/10up/action-pr-automator/pull/32), [#33](https://github.com/10up/action-pr-automator/pull/33), [#34](https://github.com/10up/action-pr-automator/pull/34), [#36](https://github.com/10up/action-pr-automator/pull/36), [#37](https://github.com/10up/action-pr-automator/pull/37), [#39](https://github.com/10up/action-pr-automator/pull/39), [#42](https://github.com/10up/action-pr-automator/pull/42), [#50](https://github.com/10up/action-pr-automator/pull/50), [#53](https://github.com/10up/action-pr-automator/pull/53), [#54](https://github.com/10up/action-pr-automator/pull/54), [#55](https://github.com/10up/action-pr-automator/pull/55), [#56](https://github.com/10up/action-pr-automator/pull/56), [#57](https://github.com/10up/action-pr-automator/pull/57), [#58](https://github.com/10up/action-pr-automator/pull/58), [#61](https://github.com/10up/action-pr-automator/pull/61), [#65](https://github.com/10up/action-pr-automator/pull/65), [#67](https://github.com/10up/action-pr-automator/pull/67), [#70](https://github.com/10up/action-pr-automator/pull/70), [#75](https://github.com/10up/action-pr-automator/pull/75), [#86](https://github.com/10up/action-pr-automator/pull/86), [#88](https://github.com/10up/action-pr-automator/pull/88))

## [1.0.1] - 2022-10-14
### Changed
- Rename action to "PR Automator" (props [@iamdharmesh](https://github.com/iamdharmesh), [@jeffpaul](https://github.com/jeffpaul) via [#27](https://github.com/10up/action-repo-automator/pull/27))

### Security
- Bump `@octokit/action` from 4.0.8 to 4.0.9 (props [@dependabot](https://github.com/apps/dependabot) via [#25](https://github.com/10up/action-repo-automator/pull/25)).
- Bump `actions/setup-node` from 3.5.0 to 3.5.1 (props [@dependabot](https://github.com/apps/dependabot) via [#26](https://github.com/10up/action-repo-automator/pull/26)).

## [1.0.0] - 2022-10-14
### Added
- Initial project release 🎉

[Unreleased]: https://github.com/10up/action-repo-automator/compare/trunk...develop
[2.1.1]: https://github.com/10up/action-repo-automator/compare/2.1.0..2.1.1
[2.1.0]: https://github.com/10up/action-repo-automator/compare/2.0.0..2.1.0
[2.0.0]: https://github.com/10up/action-repo-automator/compare/1.0.1..2.0.0
[1.0.1]: https://github.com/10up/action-repo-automator/compare/1.0.0..1.0.1
[1.0.0]: https://github.com/10up/action-repo-automator/releases/tag/1.0.0
