# VisionFit P1.7 — Automated CI and Security Testing

## What this patch adds

Adds `.github/workflows/visionfit-ci.yml`. GitHub Actions runs on every push, pull request, and manual dispatch. It does not modify application code or dependency versions.

The workflow includes:

- Backend P1.4 validation unit tests and P1.5 abuse-limiter tests.
- JavaScript syntax checks across `backend/src` and `backend/scripts`.
- Lint and production builds for `admin-web` and `staff-web`.
- An Android JavaScript bundle export for the Expo mobile app.
- Python AI-service dependency installation, syntax compilation, and import checks.
- `npm audit --audit-level=high` for backend, frontend, admin-web, and staff-web.
- `pip-audit` for `ai-service/requirements.txt`.

## Apply

1. Commit or back up your current working tree.
2. Extract this patch into the VisionFit repository root, preserving the `.github/workflows/visionfit-ci.yml` path.
3. Review the added workflow with:

   ```powershell
   git status
   git diff -- .github/workflows/visionfit-ci.yml
   ```

4. Commit and push the workflow to GitHub. Actions runs only after the workflow is present in the repository.

## Local pre-checks

From the repository root on Windows PowerShell:

```powershell
npm ci --prefix backend
npm run --prefix backend test:validation
npm run --prefix backend test:abuse-protection
npm ci --prefix admin-web
npm run --prefix admin-web lint
npm run --prefix admin-web build
npm ci --prefix staff-web
npm run --prefix staff-web lint
npm run --prefix staff-web build
npm ci --prefix frontend
Set-Location frontend
npx expo export --platform android --output-dir "$env:TEMP\visionfit-expo-export"
Set-Location ..
py -3.11 -m pip install -r ai-service/requirements.txt
py -3.11 -m compileall -q ai-service/main.py
py -3.11 -m pip install --upgrade pip-audit
py -3.11 -m pip_audit -r ai-service/requirements.txt
```

For npm audit locally, from each of `backend`, `frontend`, `admin-web`, and `staff-web`, run `npm audit --audit-level=high`.

## Expected behavior and troubleshooting

- A failing test, lint/build, mobile bundle, install, or audit check makes that job fail. Open the failed job in the GitHub Actions run, fix the underlying issue, then push again.
- An audit failure means the registry reports at least one high/critical npm issue or a Python package vulnerability, or the audit could not complete. Review the specific package, dependency path, advisory, and fixed version before changing dependencies.
- Do not run `npm audit fix --force` as a blanket fix. Update dependencies deliberately, preserve lockfiles, and rerun tests.
- The AI-service job needs wheels and dependencies compatible with Python 3.11 and the pinned requirements.
- The Expo job bundles JavaScript for Android; it is not a signed native Android build or an iOS build.
- These jobs do not run end-to-end API tests that require a running MongoDB/backend and test credentials. Those remain a separate local or staging verification step.

## Verification boundary

The workflow YAML and patch archive were validated locally. The full GitHub Actions workflow has not been executed against your repository, and registry audits/builds must be reviewed in the actual Actions run. Do not claim P1.7 verified until the first run completes and any failures are resolved or explicitly documented.
