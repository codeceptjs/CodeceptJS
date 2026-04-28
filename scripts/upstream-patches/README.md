# Upstream patches

Two CodeceptJS companion packages — `@codeceptjs/configure` and
`@codeceptjs/expect-helper` — currently do top-level `import 'codeceptjs'`.
Inside the codeceptjs repo's own CI that import fails because the project
**is** the codeceptjs package, so npm doesn't drop a `node_modules/codeceptjs/`
to resolve to. We currently work around it with a one-line CI step:

```sh
ln -sfn .. node_modules/codeceptjs
```

These two patches replace the bare `import 'codeceptjs'` in each package with
a lazy lookup against `globalThis.codeceptjs` — the same in-process registry
that CodeceptJS sets up in `lib/host.js`. Once both patches ship as new
betas of their packages and the version bumps land in `package.json`, the CI
symlink can be removed.

Both patches are **purely additive for end-user projects** — `globalThis.codeceptjs`
is set in either case (the framework writes it during startup), so the
runtime behavior in a normal user setup is unchanged.

## Apply

- `configure-codeceptjs.js` → `@codeceptjs/configure/codeceptjs.js`
- `expect-helper-index.js.diff` → patch for `@codeceptjs/expect-helper/index.js`
  (the file is large; only the import block changes).
