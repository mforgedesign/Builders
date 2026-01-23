/**
 * AutoBuilder v4.0 - GitHub Adapter
 * =================================
 * Handles direct interactions with GitHub API from the client side.
 * Supports multiple repositories.
 */

(function () {
    'use strict';

    const REPO_CONFIG = {
        'Convites': {
            owner: 'mforgedesign',
            branch: 'recuperaçãohoje',
            domain: 'convites.mforge.com.br'
        },
        'convite': {
            owner: 'mforgedesign',
            branch: 'main',
            domain: 'convite.mforge.com.br'
        }
    };

    // Default repo for backward compatibility or initial state
    const DEFAULT_REPO = 'convite';

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
         * Get configuration for a specific repo
         */
        getConfig(repoKey) {
            return REPO_CONFIG[repoKey] || REPO_CONFIG[DEFAULT_REPO];
        }

        /**
         * Deploys invitation files using Atomic Subtree Replacement
         * @param {string} slug - The invitation slug
         * @param {object} filesMap - Map of "path" => "base64 content"
         * @param {string} message - Commit message
         * @param {string} repoKey - Repository key ('Convites' or 'convite')
         */
        async deployBatch(slug, filesMap, message, repoKey = DEFAULT_REPO) {
            if (!await this.ensureAuth()) throw new Error('Autenticação falhou');

            const config = this.getConfig(repoKey);
            const { owner, branch } = config;

            console.log(`[GitHubAdapter] Starting Atomic Batch Deploy for ${slug} to ${repoKey} (${branch})...`);

            window.dispatchEvent(new CustomEvent('gh-deploy-status', {
                detail: { status: 'start', slug, message: `Iniciando deploy em ${repoKey}...` }
            }));

            if (!filesMap || typeof filesMap !== 'object') {
                throw new Error('filesMap inválido ou vazio para deploy.');
            }

            // 1. Prepare Blobs and Subtree Items
            const subtreeItems = [];
            let processed = 0;
            const total = Object.entries(filesMap).length;

            for (const [path, contentBase64] of Object.entries(filesMap)) {
                const blobSha = await this.createBlob(contentBase64, repoKey);
                subtreeItems.push({
                    path: path,
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
            const treeUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/trees`;
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

            // 3. Get Latest Commit SHA
            const branchEncoded = encodeURIComponent(branch);
            const refUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/refs/heads/${branchEncoded}`;
            const refRes = await fetch(refUrl, { headers: this.getHeaders() });

            if (!refRes.ok) {
                // Handle case where branch might not exist (shouldn't happen if configured correctly)
                throw new Error(`Failed to get branch reference for ${branch}`);
            }

            const refData = await refRes.json();
            const latestCommitSha = refData.object.sha;

            // 4. Get Base Tree SHA of the latest commit
            const commitUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/commits/${latestCommitSha}`;
            const commitRes = await fetch(commitUrl, { headers: this.getHeaders() });
            const commitData = await commitRes.json();
            const baseTreeSha = commitData.tree.sha;

            // 5. Create New Root Tree
            const fullPath = slug;

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
            const newCommitUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/commits`;
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

            // 7. Update Reference
            const updateRefRes = await fetch(refUrl, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    sha: newCommitSha,
                    force: false
                })
            });
            if (!updateRefRes.ok) throw new Error('Failed to update branch reference');

            console.log(`[GitHubAdapter] Atomic Batch Deploy Success to ${repoKey}! Commit: ${newCommitSha}`);

            const deployUrl = `https://${config.domain}/${slug}/`;

            window.dispatchEvent(new CustomEvent('gh-deploy-status', {
                detail: { status: 'success', slug, url: deployUrl, sha: newCommitSha, repo: repoKey }
            }));

            return {
                success: true,
                sha: newCommitSha,
                url: deployUrl,
                repo: repoKey
            };
        }

        async createBlob(base64Content, repoKey = DEFAULT_REPO) {
            const config = this.getConfig(repoKey);
            const url = `${API_BASE}/repos/${config.owner}/${repoKey}/git/blobs`;
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
            const currentToken = this.token || localStorage.getItem('github_pat');
            if (!currentToken) {
                console.warn('[GitHubAdapter] No token available for request');
            }
            return {
                'Authorization': `token ${currentToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            };
        }

        /**
         * Checks if a folder (slug) exists in the repository
         */
        async checkFolderExists(slug, repoKey = DEFAULT_REPO) {
            if (!this.token) return false;
            const config = this.getConfig(repoKey);

            try {
                const url = `${API_BASE}/repos/${config.owner}/${repoKey}/contents/${slug}?ref=${config.branch}`;
                const res = await fetch(url, { headers: this.getHeaders() });
                return res.ok;
            } catch (e) {
                console.warn('Check folder failed', e);
                return false;
            }
        }

        /**
         * Deletes a folder (invitation) from the repository
         */
        async deleteFolder(slug, repoKey = DEFAULT_REPO) {
            const token = localStorage.getItem('github_pat');
            if (!token) {
                throw new Error('Token GitHub não encontrado.');
            }
            this.token = token;

            const config = this.getConfig(repoKey);
            const { owner, branch } = config;

            console.log(`[GitHubAdapter] Deleting folder: ${slug} from ${repoKey}`);

            try {
                const branchEncoded = encodeURIComponent(branch);
                const refUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/refs/heads/${branchEncoded}`;
                const refRes = await fetch(refUrl, { headers: this.getHeaders() });
                if (!refRes.ok) {
                    throw new Error(`Falha ao obter referência do branch: ${branch}`);
                }
                const refData = await refRes.json();
                const latestCommitSha = refData.object.sha;

                const commitUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/commits/${latestCommitSha}`;
                const commitRes = await fetch(commitUrl, { headers: this.getHeaders() });
                if (!commitRes.ok) throw new Error('Failed to get commit data');
                const commitData = await commitRes.json();
                const baseTreeSha = commitData.tree.sha;

                const treeUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/trees/${baseTreeSha}?recursive=1`;
                const treeRes = await fetch(treeUrl, { headers: this.getHeaders() });
                if (!treeRes.ok) throw new Error('Failed to get tree data');
                const treeData = await treeRes.json();

                const slugPrefix = `${slug}/`;
                const newTreeItems = treeData.tree.filter(item => {
                    return item.path !== slug && !item.path.startsWith(slugPrefix);
                });

                if (newTreeItems.length === treeData.tree.length) {
                    console.warn(`[GitHubAdapter] Folder ${slug} not found in tree`);
                    return false;
                }

                const createTreeUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/trees`;
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

                const newCommitUrl = `${API_BASE}/repos/${owner}/${repoKey}/git/commits`;
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

                const updateRefRes = await fetch(refUrl, {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        sha: newCommitData.sha,
                        force: false
                    })
                });
                if (!updateRefRes.ok) throw new Error('Failed to update branch');

                console.log(`[GitHubAdapter] Successfully deleted ${slug} from ${repoKey}.`);
                return true;

            } catch (error) {
                console.error(`[GitHubAdapter] Delete failed:`, error);
                throw error;
            }
        }

        async uploadFile(path, content, message, repoKey = DEFAULT_REPO) {
            if (!await this.ensureAuth()) throw new Error('Autenticação falhou');

            const config = this.getConfig(repoKey);

            let contentBase64;
            if (content instanceof Blob) {
                contentBase64 = await this.blobToBase64(content);
            } else {
                contentBase64 = btoa(unescape(encodeURIComponent(content)));
            }

            if (contentBase64.includes('base64,')) {
                contentBase64 = contentBase64.split('base64,')[1];
            }

            const url = `${API_BASE}/repos/${config.owner}/${repoKey}/contents/${path}`;

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
            } catch (ignored) { }

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
                    branch: config.branch,
                    ...(sha ? { sha } : {})
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub Upload Error: ${errorData.message}`);
            }

            return await response.json();
        }

        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        async getLatestWorkflowStatus(commitSha, repoKey = DEFAULT_REPO) {
            if (!this.token) return null;
            const config = this.getConfig(repoKey);
            const { owner } = config;

            try {
                // Fetch runs for the specific commit SHA
                const url = `${API_BASE}/repos/${owner}/${repoKey}/actions/runs?head_sha=${commitSha}`;
                const res = await fetch(url, { headers: this.getHeaders() });

                if (!res.ok) {
                    console.warn(`[GitHubAdapter] Failed to fetch workflows: ${res.status}`);
                    return null;
                }

                const data = await res.json();
                if (data.workflow_runs && data.workflow_runs.length > 0) {
                    // Return the relevant run (usually Pages or Build)
                    // We prioritize 'pages-build-deployment' if multiple exist, or just the latest
                    const run = data.workflow_runs[0];
                    return {
                        status: run.status,         // queued, in_progress, completed
                        conclusion: run.conclusion, // success, failure, neutral, cancelled
                        html_url: run.html_url
                    };
                }
                return null;

            } catch (e) {
                console.warn('[GitHubAdapter] Workflow check error:', e);
                return null;
            }
        }
    }

    window.githubAdapter = new GitHubAdapter();
    window.REPO_CONFIG = REPO_CONFIG; // Expose config for History module
    console.log('[GitHubAdapter] Initialized with Multi-Repo Support');

})();
