
import dotenv from 'dotenv';
import { inviteCollaborator } from './src/lib/github';

// Load environment variables for local testing
dotenv.config({ path: '.env.local' });

async function testInvite() {
    const repo = process.env.TEST_GITHUB_REPO; // e.g., "yourusername/test-repo"
    const userToInvite = process.env.TEST_GITHUB_USER; // e.g., "anotheruser"

    if (!repo || !userToInvite) {
        console.error("Please set TEST_GITHUB_REPO and TEST_GITHUB_USER in .env.local for testing.");
        return;
    }

    console.log(`Attempting to invite ${userToInvite} to ${repo}...`);
    const result = await inviteCollaborator(repo, userToInvite);
    console.log("Result:", result);
}

testInvite();
