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
         * Deploys invitation files using Atomic Subtree Replacement
         * 1. Creates a NEW Tree for the invitation folder (convites/slug) containing ONLY the new files.
         * 2. Updates the Root Tree to point 'convites/slug' to this new Tree.
         * This effectively REPLACES the folder content (deleting old files) in a single commit.
         * @param {string} slug - The invitation slug
         * @param {object} filesMap - Map of "path" (e.g. index.html) => "base64 content"
         * @param {string} message - Commit message
         */
        async deployBatch(slug, filesMap, message) {
            if (!await this.ensureAuth()) throw new Error('Autenticação falhou');

            console.log(`[GitHubAdapter] Starting Atomic Batch Deploy for ${slug}...`);
            window.dispatchEvent(new CustomEvent('gh-deploy-status', {
                detail: { status: 'start', slug, message: 'Iniciando deploy...' }
            }));

            if (!filesMap || typeof filesMap !== 'object') {
                throw new Error('filesMap inválido ou vazio para deploy.');
            }

            // 1. Prepare Blobs and Subtree Items
            // We want to create a tree structure for the content of "convites/{slug}/"
            // The items in filesMap are relative to that folder (e.g. "index.html", "assets/foo.png")
            const subtreeItems = [];
            let processed = 0;
            const total = Object.entries(filesMap).length;

            for (const [path, contentBase64] of Object.entries(filesMap)) {
                const blobSha = await this.createBlob(contentBase64);
                subtreeItems.push({
                    path: path, // e.g. "index.html" or "assets/capa.png"
                    mode: '100644',
                    type: 'blob',
                    sha: blobSha
                });
                processed++;
                if (processed % 2 === 0 || processed === total) {
                    window.dispatchEvent(new CustomEvent('gh-deploy-status', {
                        detail: { status: 'progress', step: 'upload', progress: Math.round((processed / total) * 100), message: `Enviando arquivos (${processed}/${total})...` }
                    }));
                }
            }

            // 2. Create the New Invitation Tree (Clean Slate)
            // DO NOT provide base_tree. This creates a fresh tree with ONLY our items.
            // This is what allows us to "delete" old files that are not in this list.
            const treeUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`;
            const slugTreeRes = await fetch(treeUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    tree: subtreeItems
                })
            });
            if (!slugTreeRes.ok) throw new Error('Failed to create invitation tree');
            const slugTreeData = await slugTreeRes.json();
            const slugTreeSha = slugTreeData.sha;
            console.log('[GitHubAdapter] Created Clean Tree for Slug:', slugTreeSha);

            // 3. Get Latest Commit SHA (Base for the new commit)
            const refUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`;
            const refRes = await fetch(refUrl, { headers: this.getHeaders() });
            if (!refRes.ok) throw new Error('Failed to get branch reference');
            const refData = await refRes.json();
            const latestCommitSha = refData.object.sha;

            // 4. Get Base Tree SHA of the latest commit (Root)
            const commitUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${latestCommitSha}`;
            const commitRes = await fetch(commitUrl, { headers: this.getHeaders() });
            const commitData = await commitRes.json();
            const baseTreeSha = commitData.tree.sha;

            // 5. Create New Root Tree
            // We use the base_tree (Root) and UPDATE the entry for "{slug}"
            // to point to our new slugTreeSha.
            // This places the invitation folder at the ROOT of the repository.

            const fullPath = slug; // was `convites/${slug}`

            const rootTreeRes = await fetch(treeUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    base_tree: baseTreeSha,
                    tree: [{
                        path: fullPath,
                        mode: '040000', // Directory
                        type: 'tree',
                        sha: slugTreeSha
                    }]
                })
            });

            if (!rootTreeRes.ok) {
                const err = await rootTreeRes.json();
                throw new Error(`Failed to update root tree: ${err.message}`);
            }

            const newRootTreeData = await rootTreeRes.json();
            const newRootTreeSha = newRootTreeData.sha;

            // 6. Create Commit
            const newCommitUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`;
            const newCommitRes = await fetch(newCommitUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message: message,
                    tree: newRootTreeSha,
                    parents: [latestCommitSha]
                })
            });
            if (!newCommitRes.ok) throw new Error('Failed to create commit');
            const newCommitData = await newCommitRes.json();
            const newCommitSha = newCommitData.sha;

            // 7. Update Reference (The Push)
            const updateRefRes = await fetch(refUrl, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    sha: newCommitSha,
                    force: false // Safe push
                })
            });
            if (!updateRefRes.ok) throw new Error('Failed to update branch reference');

            console.log('[GitHubAdapter] Atomic Batch Deploy Success! Commit:', newCommitSha);

            const deployUrl = `https://convites.mforge.com.br/${slug}/`;

            window.dispatchEvent(new CustomEvent('gh-deploy-status', {
                detail: { status: 'success', slug, url: deployUrl, sha: newCommitSha }
            }));

            return {
                success: true,
                sha: newCommitSha,
                url: deployUrl
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
         * Checks if a folder (slug) exists in the repository
         * @param {string} slug 
         * @returns {Promise<boolean>}
         */
        async checkFolderExists(slug) {
            if (!this.token) return false; // Can't check securely without token, assume false or handle upstream

            try {
                const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${slug}`;
                const res = await fetch(url, { headers: this.getHeaders() });
                return res.ok; // 200/2xx means it exists
            } catch (e) {
                console.warn('Check folder failed', e);
                return false;
            }
        }

        /**
         * Checks the workflow status for a specific commit
         * @param {string} sha - The commit SHA
         */
        /**
         * Checks the workflow status for a specific commit
         * @param {string} sha - The commit SHA
         */
        async getLatestWorkflowStatus(sha) {
            if (!await this.ensureAuth()) return null;

            // List runs for this commit with cache buster
            const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?head_sha=${sha}&t=${Date.now()}`;
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

        /**
         * Deletes a folder (invitation) from the repository using Tree API
         * This is an atomic operation that removes only the specified folder
         * @param {string} slug - The folder name to delete
         * @returns {Promise<boolean>} - True if successful
         */
        async deleteFolder(slug) {
            if (!await this.ensureAuth()) throw new Error('Autenticação falhou');

            console.log(`[GitHubAdapter] Deleting folder: ${slug}`);

            try {
                // 1. Get current branch reference
                const refUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`;
                const refRes = await fetch(refUrl, { headers: this.getHeaders() });
                if (!refRes.ok) throw new Error('Failed to get branch reference');
                const refData = await refRes.json();
                const latestCommitSha = refData.object.sha;

                // 2. Get current commit's tree SHA
                const commitUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${latestCommitSha}`;
                const commitRes = await fetch(commitUrl, { headers: this.getHeaders() });
                if (!commitRes.ok) throw new Error('Failed to get commit data');
                const commitData = await commitRes.json();
                const baseTreeSha = commitData.tree.sha;

                // 3. Get the full tree (recursive)
                const treeUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${baseTreeSha}?recursive=1`;
                const treeRes = await fetch(treeUrl, { headers: this.getHeaders() });
                if (!treeRes.ok) throw new Error('Failed to get tree data');
                const treeData = await treeRes.json();

                // 4. Filter out the folder to delete
                const slugPrefix = `${slug}/`;
                const newTreeItems = treeData.tree.filter(item => {
                    // Exclude the folder itself and all its contents
                    return item.path !== slug && !item.path.startsWith(slugPrefix);
                });

                // Check if anything was removed
                if (newTreeItems.length === treeData.tree.length) {
                    console.warn(`[GitHubAdapter] Folder ${slug} not found in tree`);
                    return false;
                }

                // 5. Create new tree (without base_tree to ensure clean structure)
                const createTreeUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`;
                const newTreeRes = await fetch(createTreeUrl, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        tree: newTreeItems.map(item => ({
                            path: item.path,
                            mode: item.mode,
                            type: item.type,
                            sha: item.sha
                        }))
                    })
                });
                if (!newTreeRes.ok) throw new Error('Failed to create new tree');
                const newTreeData = await newTreeRes.json();

                // 6. Create commit
                const newCommitUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`;
                const newCommitRes = await fetch(newCommitUrl, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        message: `Delete ${slug}`,
                        tree: newTreeData.sha,
                        parents: [latestCommitSha]
                    })
                });
                if (!newCommitRes.ok) throw new Error('Failed to create commit');
                const newCommitData = await newCommitRes.json();

                // 7. Update branch reference
                const updateRefRes = await fetch(refUrl, {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        sha: newCommitData.sha,
                        force: false
                    })
                });
                if (!updateRefRes.ok) throw new Error('Failed to update branch');

                console.log(`[GitHubAdapter] Successfully deleted ${slug}. Commit: ${newCommitData.sha}`);
                return true;

            } catch (error) {
                console.error(`[GitHubAdapter] Delete failed:`, error);
                throw error;
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
