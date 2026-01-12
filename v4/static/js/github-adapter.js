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
    const BRANCH = 'main';
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
         * Uploads a file to the repository
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
