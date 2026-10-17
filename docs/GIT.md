# Create the repository and publish the solution

Use one repository for the frontend, both APIs, database initialization, tests and documentation. Testers run independent local databases through Docker; do not upload database volumes, passwords or real order records.

## 1. Create an empty GitHub repository

1. Sign in to your GitHub account and select **+ > New repository**.
2. Choose the account that should own it.
3. Enter a name, for example `hebrew-shopping-list`.
4. Choose the visibility appropriate to your assignment. For a private repository, invite the testers after publishing.
5. Leave **Add a README file**, **Add .gitignore**, and **Choose a license** unselected. The source already contains README.md and .gitignore. An empty remote avoids unrelated initial history.
6. Select **Create repository**, then copy its HTTPS URL. It has the form `https://github.com/YOUR_USERNAME/hebrew-shopping-list.git`.

You may use another Git host instead. Copy that host's empty-repository HTTPS clone URL.

## 2. Extract the prepared source

Extract the source ZIP completely. Open PowerShell in the `shopping-list` folder containing `compose.yaml`, `package.json` and README.md. Keep your existing working installation separately if you want to preserve its local database configuration. Do not copy its `.env` into the source to be published.

The generated `.env` files, node_modules, build output and test coverage are ignored. The safe `.env.example` templates must be included.

## 3. Initialize Git and inspect the commit contents

For this new project folder, run:

```powershell
git init
git branch -M main
git add .
git status --short
git diff --cached --name-only
```

Before committing, check that all three apps, root package files, lockfile, compose.yaml, scripts, infra and docs are listed. `.env.example` files should be included. Actual `.env` files and generated folders must not be listed. Confirm exclusions with:

```powershell
git check-ignore .env apps/orders-api/.env apps/web/.env.local
```

The three paths should be printed. Never force-add these files. If an excluded file was previously tracked in another repository, ignore rules alone do not remove it from history.

## 4. Commit and push

If Git requests your identity, configure it for this repository. Replace the email placeholder with the address you want associated with your commits (a GitHub-provided private commit email also works):

```powershell
git config user.name "Dmitry Fridman"
git config user.email "YOUR_COMMIT_EMAIL"
```

In SUBMISSION.md, replace the repository placeholder with the real repository URL. Then run:

```powershell
git add SUBMISSION.md
git commit -m "Add Hebrew shopping list solution and reviewer setup guide"
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_REPOSITORY_URL` with the URL copied in step 1. Authenticate on your computer using GitHub's browser/credential-manager flow. Do not send passwords or access tokens in chat. If `origin` already exists, inspect it with `git remote -v` before changing it. Do not force-push to solve unrelated-history or permission errors.

## 5. Verify the handoff as a tester

Clone into a different empty directory and follow README.md from the beginning. Do not reuse your original `.env`, node_modules or database files. A private repository requires granting testers access through **Settings > Collaborators** (or your organization's access settings).

Confirm that README.md is visible on the repository homepage and that the frontend, .NET, NestJS and test folders are present. Give testers the repository page URL and point them to README.md. They can clone or use **Code > Download ZIP**.

## Later updates

```powershell
git status
git add README.md docs apps scripts infra compose.yaml package.json package-lock.json .gitignore
git diff --cached --stat
git commit -m "Describe the actual change"
git push
```

Only commit files belonging to the change. Existing repositories should use their normal branch/review workflow. A public hosted deployment is separate from this local Docker handoff and needs its own infrastructure and HTTPS configuration.
