/**
 * AutoBuilder v4.0 - Links Extras Management
 * ===========================================
 * Handles dynamic extra links array with add/remove functionality.
 */

(function () {
    'use strict';

    const API_BASE = '';
    const UPDATE_ENDPOINT = '/api/update_state';

    // Links extras array (local state)
    let linksExtras = [];

    // ========================================
    // Core Functions
    // ========================================

    /**
     * Gets the links extras data from the DOM.
     * @returns {Array} Array of link objects
     */
    function getLinksFromDOM() {
        const container = document.getElementById('links-extras-container');
        const rows = container.querySelectorAll('.link-extra-row');

        return Array.from(rows).map((row, index) => {
            const iconSelect = row.querySelector('.link-icon');
            const iconCustom = row.querySelector('.link-icon-custom');

            // Use custom icon if 'Personalizar' is selected
            let iconValue = iconSelect.value;
            if (iconValue === 'custom' && iconCustom) {
                iconValue = iconCustom.value.trim() || 'fa-solid fa-link';
            }

            return {
                id: index,
                label: row.querySelector('.link-nome').value || '',
                url: row.querySelector('.link-url').value || '',
                icon: iconValue
            };
        });
    }

    /**
     * Updates the links_extras field in the backend.
     */
    async function saveLinksToBackend() {
        linksExtras = getLinksFromDOM();

        try {
            const response = await fetch(API_BASE + UPDATE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ links_extras: linksExtras })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('[LinksExtras] Saved:', linksExtras.length, 'links');

            // Dispatch event for preview updates
            document.dispatchEvent(new CustomEvent('linksExtrasUpdated', {
                detail: { links: linksExtras }
            }));

        } catch (error) {
            console.error('[LinksExtras] Error saving:', error);
        }
    }

    /**
     * Adds a new link row to the container.
     * @param {object} linkData - Optional pre-fill data
     */
    function addLinkRow(linkData = null) {
        const container = document.getElementById('links-extras-container');
        const template = document.getElementById('link-extra-template');
        const noLinksMessage = document.getElementById('no-links-message');

        // Clone template
        const clone = template.content.cloneNode(true);
        const row = clone.querySelector('.link-extra-row');

        // Pre-fill if data provided
        const iconSelect = row.querySelector('.link-icon');
        const iconCustomInput = row.querySelector('.link-icon-custom');

        if (linkData) {
            row.querySelector('.link-nome').value = linkData.label || '';
            row.querySelector('.link-url').value = linkData.url || '';

            // Check if icon is a preset or custom
            const presetIcons = Array.from(iconSelect.options).map(o => o.value).filter(v => v !== 'custom');
            if (linkData.icon && !presetIcons.includes(linkData.icon)) {
                // Custom icon - select 'Personalizar' and fill custom input
                iconSelect.value = 'custom';
                if (iconCustomInput) {
                    iconCustomInput.value = linkData.icon;
                    iconCustomInput.classList.remove('hidden');
                }
            } else {
                iconSelect.value = linkData.icon || 'fa-solid fa-link';
            }
        }

        // Toggle custom icon input visibility
        function toggleCustomIcon() {
            if (iconSelect.value === 'custom') {
                iconCustomInput.classList.remove('hidden');
                iconCustomInput.focus();
            } else {
                iconCustomInput.classList.add('hidden');
            }
        }

        iconSelect.addEventListener('change', () => {
            toggleCustomIcon();
            saveLinksToBackend();
        });

        // Add event listeners
        row.querySelector('.btn-remove-link').addEventListener('click', function () {
            removeLinkRow(row);
        });

        // Add change listeners for auto-save
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', saveLinksToBackend);
            input.addEventListener('input', debounce(saveLinksToBackend, 500));
        });

        // Append to container
        container.appendChild(clone);

        // Hide "no links" message
        noLinksMessage.classList.add('hidden');

        // Focus on the name input
        const lastRow = container.lastElementChild;
        if (lastRow) {
            const nameInput = lastRow.querySelector('.link-nome');
            if (nameInput) nameInput.focus();
        }

        console.log('[LinksExtras] Added new row');

        // Save to backend
        saveLinksToBackend();
    }

    /**
     * Removes a link row from the container.
     * @param {HTMLElement} row - The row to remove
     */
    function removeLinkRow(row) {
        const container = document.getElementById('links-extras-container');
        const noLinksMessage = document.getElementById('no-links-message');

        // Animate out
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        row.style.transition = 'all 0.2s ease-out';

        setTimeout(() => {
            row.remove();

            // Show "no links" message if empty
            if (container.children.length === 0) {
                noLinksMessage.classList.remove('hidden');
            }

            console.log('[LinksExtras] Removed row');

            // Save to backend
            saveLinksToBackend();
        }, 200);
    }

    /**
     * Populates the links container from backend state.
     * @param {Array} links - Array of link objects
     */
    function populateLinks(links) {
        if (!Array.isArray(links)) return;

        const container = document.getElementById('links-extras-container');
        const noLinksMessage = document.getElementById('no-links-message');

        // Clear existing
        container.innerHTML = '';

        // Add rows from data
        links.forEach(link => addLinkRow(link));

        // Update message visibility
        if (links.length === 0) {
            noLinksMessage.classList.remove('hidden');
        } else {
            noLinksMessage.classList.add('hidden');
        }

        console.log('[LinksExtras] Populated with', links.length, 'links');
    }

    // ========================================
    // Utility Functions
    // ========================================

    /**
     * Simple debounce function.
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // ========================================
    // Initialization
    // ========================================

    function initLinksExtras() {
        const addBtn = document.getElementById('btn-add-link');

        if (addBtn) {
            addBtn.addEventListener('click', () => addLinkRow());
        }

        // Load initial state from backend
        fetch(API_BASE + '/api/state')
            .then(res => res.json())
            .then(data => {
                if (data.data && data.data.links_extras) {
                    populateLinks(data.data.links_extras);
                }
            })
            .catch(err => console.warn('[LinksExtras] Could not load initial state:', err));

        console.log('[LinksExtras] Initialized');
    }

    // ========================================
    // Initialize on DOM Ready
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLinksExtras);
    } else {
        initLinksExtras();
    }

    // ========================================
    // Expose to Global Scope
    // ========================================
    window.AutoBuilderLinksExtras = {
        addLinkRow,
        removeLinkRow,
        getLinksFromDOM,
        populateLinks,
        saveLinksToBackend
    };

})();
