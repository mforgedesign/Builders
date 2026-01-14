/**
 * AutoBuilder v4.0 - GitHub Adapter
 * =================================
 * Handles direct interactions with GitHub API from the client side.
 * Requires a Personal Access Token (PAT) provided by the user.
 */

(function () {
    'use strict';

    const REPO_OWNER = 'mforgedesign';
    const REPO_NAME = 'Convites';
    const BRANCH = 'recuperaçãohoje';
    const API_BASE = 'https://api.github.com';

    class GitHubAdapter {
        constructor() {
            this.token = this.loadToken();
        }

        /**
         * Loads token from localStorage or returns null
         */
        loadToken() {
            return localStorage.getItem('github_pat') || null;
        }

        /**
         * Saves token to localStorage
         */
        saveToken(token) {
            if (token && token.startsWith('ghp_')) {
                localStorage.setItem('github_pat', token);
                this.token = token;
                return true;
            }
            return false;
        }

        /**
         * Prompts the user for a token if one isn't available
         */
        async ensureAuth() {
            if (this.token) return true;

            const token = prompt(
                '🔐 Autenticação Requerida\n\n' +
                'Para publicar convites, precisamos do seu Token de Acesso Pessoal (PAT) do GitHub.\n' +
                'Este token será salvo no seu navegador.\n\n' +
                'Insira seu token (começa com ghp_...):'
            );

            if (token && this.saveToken(token.trim())) {
                return true;
            }

            alert('Token inválido ou não fornecido. A publicação não pode continuar.');
            return false;
        }

        /**
         * Deploys multiple files in a single commit (Batch Deploy)
         * Solves the "multiple workflow runs" issue.
         * @param {string} slug - The invitation slug
         * @param {object} filesMap - Map of "path" => "base64 content"
         * @param {string} message - Commit message
         */
        async deployBatch(slug, filesMap, message) {
            if (!await this.ensureAuth()) throw new Error('Autenticação falhou');

            console.log(`[GitHubAdapter] Starting Batch Deploy for ${slug}...`);

            // 1. Get latest commit SHA of the branch
            const refUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`;
            const refRes = await fetch(refUrl, { headers: this.getHeaders() });
            if (!refRes.ok) throw new Error('Failed to get branch reference');
            const refData = await refRes.json();
            const latestCommitSha = refData.object.sha;
            console.log('[GitHubAdapter] Base SHA:', latestCommitSha);

            // 2. Get the tree of the latest commit
            const commitUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${latestCommitSha}`;
            const commitRes = await fetch(commitUrl, { headers: this.getHeaders() });
            const commitData = await commitRes.json();
            const baseTreeSha = commitData.tree.sha;

            // 3. Create Blobs for each file and prepare Tree structure
            const treeItems = [];

            for (const [path, contentBase64] of Object.entries(filesMap)) {
                // Determine mode (100644 for file)
                // path is like "convites/slug/index.html"
                // API expects full path relative to repo root
                const fullPath = `convites/${slug}/${path}`;

                // Create Blob
                const blobSha = await this.createBlob(contentBase64);
                treeItems.push({
                    path: path, // relative to the tree we are creating? No, git trees are recursive. 
                    // To keep it simple, we can update the root tree?
                    // "path": The file referenced in the tree.
                    // If we use base_tree, we can specify full paths.
                    path: path, // keys in filesMap seem to be relative to slug folder?
                    // Wait, windows.js passes: filesMap["assets/capa..."] etc. 
                    // AND filesMap["index.html"]
                    // The payload in windows.js was "files": { "path/to/file": "base64" }
                    // Let's verify what windows.js sends.
                    // filesMap['assets/filename'] = ...
                    // filesMap['index.html'] = ...
                    // All relative to the SLUG folder.
                    // So we should prefix them with `convites/${slug}/`.
                    mode: '100644',
                    type: 'blob',
                    sha: blobSha
                });
            }

            // Note: filesMap keys in windows.js are like "index.html" or "assets/foo.png"
            // We need to map these to "convites/{slug}/index.html" etc.
            // BUT wait, windows.js logs: filesMap['index.html'] = ...
            // Correct.

            const finalTreeItems = treeItems.map(item => ({
                ...item,
                path: `convites/${slug}/${item.path}`
            }));

            // 4. Create New Tree
            const treeUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`;
            const treeRes = await fetch(treeUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    base_tree: baseTreeSha,
                    tree: finalTreeItems
                })
            });
            if (!treeRes.ok) throw new Error('Failed to create tree');
            const treeData = await treeRes.json();
            const newTreeSha = treeData.sha;

            // 5. Create Commit
            const newCommitUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`;
            const newCommitRes = await fetch(newCommitUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message: message,
                    tree: newTreeSha,
                    parents: [latestCommitSha]
                })
            });
            if (!newCommitRes.ok) throw new Error('Failed to create commit');
            const newCommitData = await newCommitRes.json();
            const newCommitSha = newCommitData.sha;

            // 6. Update Reference (The Push)
            const updateRefRes = await fetch(refUrl, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    sha: newCommitSha,
                    force: false // Safe push
                })
            });
            if (!updateRefRes.ok) throw new Error('Failed to update branch reference');

            console.log('[GitHubAdapter] Batch Deploy Success! Commit:', newCommitSha);

            return {
                success: true,
                sha: newCommitSha,
                url: `https://mforgedesign.github.io/${REPO_NAME}/convites/${slug}/`
            };
        }

        async createBlob(base64Content) {
            const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`;
            const res = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    content: base64Content,
                    encoding: 'base64'
                })
            });
            if (!res.ok) throw new Error('Failed to create blob');
            const data = await res.json();
            return data.sha;
        }

        getHeaders() {
            return {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            };
        }

        /**
         * Checks the workflow status for a specific commit
         * @param {string} sha - The commit SHA
         */
        async getLatestWorkflowStatus(sha) {
            if (!await this.ensureAuth()) return null;

            // List runs for this commit
            const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?head_sha=${sha}`;
            try {
                const res = await fetch(url, { headers: this.getHeaders() });
                if (!res.ok) return null;

                const data = await res.json();
                if (data.workflow_runs && data.workflow_runs.length > 0) {
                    // Get the most recent one
                    return data.workflow_runs[0]; // { status: 'queued'|'in_progress'|'completed', conclusion: 'success'|'failure'|null }
                }
                return null; // No run found yet
            } catch (e) {
                console.warn('Failed to check workflow status', e);
                return null;
            }
        }

        // ... existing uploadFile (keep for backward compatibility if needed) ...
        // (Keeping the rest of the file structure intact is handled by replace_file_content logic if we are careful)

        // REPLACING uploadFile to blobToBase64 helper with the new methods + original helpers.
        // Since I'm replacing from line 61 to end, I need to include uploadFile if I want to keep it?
        // The user instruction said "Add ... methods".
        // I will implement them inside the class.

        /**
         * Uploads a file to the repository (Old Single File Method)
         * @param {string} path - Relative path (e.g., 'convites/slug/index.html')
         * @param {Blob|string} content - File content
         * @param {string} message - Commit message
         */
        async uploadFile(path, content, message) {
            if (!await this.ensureAuth()) throw new Error('Autenticação falhou');

            // Convert Blob to Base64 if necessary
            let contentBase64;
            if (content instanceof Blob) {
                contentBase64 = await this.blobToBase64(content);
            } else {
                contentBase64 = btoa(unescape(encodeURIComponent(content))); // Simple string to base64
            }

            // Remove data URL prefix if present (e.g., "data:image/png;base64,")
            if (contentBase64.includes('base64,')) {
                contentBase64 = contentBase64.split('base64,')[1];
            }

            const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

            // Check if file exists to get SHA (needed for updates)
            let sha = null;
            try {
                const checkRes = await fetch(url, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (checkRes.ok) {
                    const data = await checkRes.json();
                    sha = data.sha;
                }
            } catch (ignored) {
                // File doesn't exist, proceed w/o SHA
            }

            // Upload
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    content: contentBase64,
                    branch: BRANCH,
                    ...(sha ? { sha } : {})
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub Upload Error: ${errorData.message}`);
            }

            return await response.json();
        }

        /**
         * Helper: Convert Blob to Base64
         */
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
    }

    // Expose globally
    window.githubAdapter = new GitHubAdapter();
    console.log('[GitHubAdapter] Initialized');

})();
