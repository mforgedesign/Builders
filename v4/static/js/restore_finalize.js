
// ========================================
// Finalize / Publish Buttons
// ========================================

function setupFinalizeButtons() {
    const publishBtn = document.getElementById('btn-publish');
    const slugInput = document.getElementById('slug-input');

    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            const originalText = publishBtn.innerHTML;
            publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Publicando...';
            publishBtn.disabled = true;

            try {
                const slug = slugInput.value.trim();
                if (!slug) {
                    alert('Por favor, defina um nome (slug) para o convite.');
                    slugInput.focus();
                    throw new Error('Slug vazio');
                }

                // 1. Generate State
                const appState = window.generateBuilderState();

                // 2. Send to Backend to Generate ZIP and Publish
                // The backend handles asset gathering from uploads/generated paths
                const response = await fetch('/api/publish_v4', { // Use Specific v4 endpoint or generic
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        slug: slug,
                        state: appState
                    })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Erro na publicação.');

                // Success
                const liveUrl = result.url || `https://mforgedesign.github.io/${slug}/`;
                alert(`✅ Convite Publicado com Sucesso!\n\nAcesse: ${liveUrl}`);
                window.open(liveUrl, '_blank');

            } catch (error) {
                console.error('[Publish] Error:', error);
                alert('Erro ao publicar: ' + error.message);
            } finally {
                publishBtn.innerHTML = originalText;
                publishBtn.disabled = false;
            }
        });
    }
}
