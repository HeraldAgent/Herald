# Suggested Commit Sequence

1. `feat(types): add surprise half-life and contamination fields to trade signals`
2. `feat(filter): score catalyst contamination and category half-life`
3. `feat(agent): prompt for catalyst-tape logic instead of sentiment classification`
4. `feat(tracker): print half-life and contamination in active tape output`
5. `feat(index): surface lead catalyst diagnostics each cycle`
6. `fix(feeds): map governance unlock and integration headlines into supported categories`
7. `test: cover contamination penalties and half-life helpers`
8. `docs(readme): add technical spec for catalyst ranking`
9. `design(svg): add catalyst board and terminal ticket visuals`
10. `chore(audit): add issue drafts and commit notes`

Operational note: keep tape logic, feed parsing, and presentation changes in separate commits so the repo reads like an actual desk workflow.
