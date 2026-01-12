/**
 * AutoBuilder v4.0 - Form Two-Way Binding
 * ========================================
 * Handles form input changes and syncs with backend via fetch API.
 */

(function () {
    'use strict';

    const API_BASE = '';  // Same origin
    const UPDATE_ENDPOINT = '/api/update_state';
    const STATE_ENDPOINT = '/api/state';

    // Debounce timeout for text inputs
    let debounceTimer = null;
    const DEBOUNCE_MS = 500;

    // ========================================
    // API Functions
    // ========================================

    /**
     * Updates a single field in the backend state.
     * @param {string} fieldName - The field name to update
     * @param {any} value - The new value
     * @returns {Promise<object>} The API response
     */
    async function updateField(fieldName, value) {
        try {
            const payload = {};
            payload[fieldName] = value;

            console.log(`[Form] Updating field: ${fieldName} =`, value);

            const response = await fetch(API_BASE + UPDATE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[Form] Update successful:`, data.status);

            // Dispatch event for preview updates
            document.dispatchEvent(new CustomEvent('stateUpdated', {
                detail: { field: fieldName, value: value, state: data.data }
            }));

            return data;
        } catch (error) {
            console.error(`[Form] Error updating ${fieldName}:`, error);
            throw error;
        }
    }

    /**
     * Fetches the current state from backend.
     * @returns {Promise<object>} The current state
     */
    async function fetchState() {
        try {
            const response = await fetch(API_BASE + STATE_ENDPOINT);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('[Form] Error fetching state:', error);
            throw error;
        }
    }

    /**
     * Populates form inputs with values from state.
     * @param {object} state - The state object
     */
    function populateForm(state) {
        if (!state) return;

        const inputs = document.querySelectorAll('.form-input[data-field]');
        inputs.forEach(input => {
            const fieldName = input.getAttribute('data-field');
            if (state.hasOwnProperty(fieldName)) {
                const value = state[fieldName];

                if (input.type === 'checkbox') {
                    input.checked = Boolean(value);
                } else {
                    input.value = value || '';
                }
            }
        });

        // Sync color text inputs
        syncColorInputs();

        // Update range display
        updateRangeDisplay();

        console.log('[Form] Populated form with state');
    }

    // ========================================
    // Event Handlers
    // ========================================

    /**
     * Handles input change events (immediate for non-text).
     * @param {Event} event - The change event
     */
    function handleInputChange(event) {
        const input = event.target;
        const fieldName = input.getAttribute('data-field');

        if (!fieldName) return;

        let value;
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'number') {
            value = input.value ? parseInt(input.value, 10) : null;
        } else if (input.type === 'range') {
            value = parseInt(input.value, 10);
            updateRangeDisplay();
        } else {
            value = input.value;
        }

        // MIRRORING: Update other inputs with same data-field
        const mirrors = document.querySelectorAll(`[data-field="${fieldName}"]`);
        mirrors.forEach(mirror => {
            if (mirror !== input) {
                if (mirror.type === 'checkbox') {
                    mirror.checked = value;
                } else {
                    mirror.value = value;
                }
            }
        });

        // For text inputs, use debounce
        if (input.type === 'text' || input.type === 'tel' || input.type === 'url' || input.tagName === 'TEXTAREA') {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                updateField(fieldName, value);
            }, DEBOUNCE_MS);
        } else {
            // Immediate update for selects, colors, checkboxes, dates, etc.
            updateField(fieldName, value);
        }

        // Mutual Exclusivity Logic
        if (fieldName === 'link_presentes' && value) {
            console.log('[Form] Clearing media_presentes due to link input');
            updateField('media_presentes', null);
        }
        if (fieldName === 'manual_content' && value && value.length > 0) {
            console.log('[Form] Clearing media_manual due to text input');
            updateField('media_manual', null);
        }
    }

    /**
     * Syncs color pickers with their text inputs.
     */
    function syncColorInputs() {
        // Cor dos Botões
        const btnColorPicker = document.getElementById('form-cor_botoes');
        const btnColorText = document.getElementById('form-cor_botoes_text');

        if (btnColorPicker && btnColorText) {
            btnColorPicker.addEventListener('input', () => {
                btnColorText.value = btnColorPicker.value.toUpperCase();
                updateField('cor_botoes', btnColorPicker.value);
                updatePreviewButtonColor(btnColorPicker.value);
            });

            btnColorText.addEventListener('change', () => {
                const color = btnColorText.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    btnColorPicker.value = color;
                    updateField('cor_botoes', color);
                    updatePreviewButtonColor(color);
                }
            });
        }

        // Sombra Gradiente
        const shadowColorPicker = document.getElementById('form-sombra_gradiente');
        if (shadowColorPicker) {
            shadowColorPicker.addEventListener('input', () => {
                updateField('sombra_gradiente', shadowColorPicker.value);
                updatePreviewShadow(shadowColorPicker.value);
            });
        }
    }

    /**
     * Updates the range input display value.
     */
    function updateRangeDisplay() {
        const rangeInput = document.getElementById('form-posicao_botoes');
        const display = document.getElementById('posicao-value');

        if (rangeInput && display) {
            display.textContent = rangeInput.value + 'px';
        }
    }

    // ========================================
    // Preview Updates
    // ========================================

    /**
     * Updates preview button colors.
     * @param {string} color - Hex color
     */
    function updatePreviewButtonColor(color) {
        const buttons = document.querySelectorAll('#preview-buttons .rounded-full');
        buttons.forEach(btn => {
            btn.style.backgroundColor = color;
        });
    }

    /**
     * Updates preview shadow gradient.
     * @param {string} color - Hex color
     */
    function updatePreviewShadow(color) {
        const shadow = document.getElementById('preview-shadow');
        if (shadow) {
            shadow.style.background = `linear-gradient(to top, ${color}, transparent)`;
        }
    }

    // ========================================
    // Initialization
    // ========================================

    function initForm() {
        // Add change listeners to all form inputs
        const inputs = document.querySelectorAll('.form-input[data-field]');
        inputs.forEach(input => {
            // Use 'change' for most inputs, 'input' for range
            if (input.type === 'range') {
                input.addEventListener('input', handleInputChange);
            } else {
                input.addEventListener('change', handleInputChange);
            }

            // Also listen to input for text fields (with debounce)
            if (input.type === 'text' || input.type === 'tel' || input.type === 'url' || input.tagName === 'TEXTAREA') {
                input.addEventListener('input', handleInputChange);
            }
        });

        // Setup color input syncing
        syncColorInputs();

        // Fetch and populate initial state
        fetchState()
            .then(state => populateForm(state))
            .catch(err => console.warn('[Form] Could not load initial state:', err));

        console.log('[Form] Initialized with', inputs.length, 'tracked inputs');

        // Listen for persistence updates
        document.addEventListener('stateUpdated', (e) => {
            if (e.detail.source === 'persistence' && e.detail.data && e.detail.data.formData) {
                console.log('[Form] Restoring state from persistence...');
                populateForm(e.detail.data.formData);
            }
        });
    }

    // ========================================
    // Initialize on DOM Ready
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForm);
    } else {
        initForm();
    }

    // ========================================
    // Expose to Global Scope
    // ========================================
    // Local state cache
    const localData = {};

    window.AutoBuilderForm = {
        updateField: async (field, value) => {
            localData[field] = value; // Update local cache
            return updateField(field, value);
        },
        fetchState: async () => {
            const data = await fetchState();
            Object.assign(localData, data); // Update local cache
            return data;
        },
        populateForm: (state) => {
            Object.assign(localData, state); // Update local cache
            populateForm(state);
        },
        get data() { return localData; } // Expose getter
    };

})();
