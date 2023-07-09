---
"@stevent-team/react-zoom-form": minor
---

Introduce `errors` helper fn.

This is a breaking change that removes the `errors` object from the return of `useForm`, and instead introduces a global function `errors()` that takes a field and returns an array of ZodIssues.
