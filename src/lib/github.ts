
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

/**
 * Invitations a GitHub user to a repository as a collaborator.
 * @param repoFullName - The "owner/repo" string (e.g. "octocat/hello-world")
 * @param username - The GitHub username of the invitee
 * @param permission - The permission level ('pull', 'push', 'admin', 'maintain', 'triage')
 * @returns { success: boolean, message: string }
 */
export async function inviteCollaborator(
    repoFullName: string,
    username: string,
    permission: 'pull' | 'push' = 'pull'
) {
    if (!GITHUB_TOKEN) {
        console.error("GITHUB_ACCESS_TOKEN is missing in environment variables.");
        return { success: false, message: "Server configuration error: Missing GitHub Token." };
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${repoFullName}/collaborators/${username}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({ permission })
        });

        if (response.ok) {
            // 201 Created or 204 No Content (already invited)
            return { success: true, message: "Invitation sent successfully." };
        } else {
            const errorData = await response.json();
            console.error("GitHub API Error:", errorData);
            return { success: false, message: errorData.message || "Failed to invite user." };
        }
    } catch (error: any) {
        console.error("GitHub Invitation Exception:", error);
        return { success: false, message: error.message || "Network error interacting with GitHub." };
    }
}
