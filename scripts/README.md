# Development & Maintenance Scripts

This directory contains standalone developer scripts, utilities, and testing harnesses.

## Scripts Overview

### `test_github_invite.ts`
Tests the GitHub Collaborator invitation API integration (`inviteCollaborator`) against a live repository.

**Prerequisites:**
Ensure `.env.local` contains:
```env
GITHUB_ACCESS_TOKEN=your_github_personal_access_token
TEST_GITHUB_REPO=owner/repo_name
TEST_GITHUB_USER=target_github_username
```

**Running the test:**
```bash
npx tsx scripts/test_github_invite.ts
```
