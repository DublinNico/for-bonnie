# Test results — raw output

Saved from the full test run on **2026-11-08**, commit `c5beffb`, on Windows 11 (ARM64), Node.js v24.19.0, Python 3.12.10 (see `environment.txt`). Colour codes were stripped; nothing else was edited. These are the source of every number in [`../TestingReport.md`](../TestingReport.md).

| File | What it is |
|---|---|
| `environment.txt` | when, where and on which commit the tests ran |
| `build.txt` | `npm run build` output |
| `python-tests.txt` | `pytest -v` with branch coverage (`--cov-report=term-missing`) |
| `python-coverage.json` | pytest-cov data (statements and branches per line) |
| `python-function-coverage.txt` | per-function statements and branch paths, computed from the JSON |
| `unit-tests.txt` | `vitest run --reporter=verbose --coverage` |
| `unit-coverage.json` | Vitest/V8 coverage data (istanbul format) |
| `unit-coverage-by-file-and-function.txt` | full per-file table and per-function branches, computed from the JSON |
| `integration-tests.txt` | `vitest run -c vitest.integration.config.mts --reporter=verbose` |
| `security-tests.txt` | `vitest run -c vitest.security.config.mts --reporter=verbose` |
| `e2e-tests.txt` | `playwright test --reporter=list` |
| `load-tests.txt` | full Artillery output for the four scenarios |
| `load-summary.txt` | one line per scenario, extracted from `load-tests.txt` |
| `manual-test-cases.txt` | observed results of the 14 manual test cases |
