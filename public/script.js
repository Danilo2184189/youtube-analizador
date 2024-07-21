document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analysisForm');
    const addUrlBtn = document.getElementById('addUrlBtn');
    const videoUrlInputs = document.getElementById('videoUrlInputs');
    const results = document.getElementById('results');
    const analysisContent = document.getElementById('analysisContent');
    const loading = document.getElementById('loading');

    addUrlBtn.addEventListener('click', () => {
        if (videoUrlInputs.children.length < 5) {
            const input = document.createElement('div');
            input.classList.add('form-group');
            input.innerHTML = '<input type="url" name="videoUrl" placeholder="Enter YouTube URL">';
            videoUrlInputs.appendChild(input);
        }
        if (videoUrlInputs.children.length === 5) {
            addUrlBtn.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productInfo = document.getElementById('productInfo').value;
        const videoUrls = Array.from(form.querySelectorAll('input[name="videoUrl"]'))
            .map(input => input.value)
            .filter(url => url.trim() !== '');

        if (videoUrls.length === 0) {
            alert('Please enter at least one YouTube URL.');
            return;
        }

        loading.classList.remove('hidden');
        results.classList.add('hidden');

        try {
            const analyses = await Promise.all(videoUrls.map(async (url) => {
                const startResponse = await fetch('/start-analysis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ videoUrl: url, productInfo }),
                });

                if (!startResponse.ok) {
                    throw new Error(`HTTP error! status: ${startResponse.status}`);
                }

                const { runId } = await startResponse.json();
                let analysisData;

                while (!analysisData) {
                    const statusResponse = await fetch(`/check-analysis/${runId}`);
                    if (!statusResponse.ok) {
                        throw new Error(`HTTP error! status: ${statusResponse.status}`);
                    }
                    const statusData = await statusResponse.json();
                    if (statusData.status === 'SUCCEEDED') {
                        analysisData = statusData.data;
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
                    }
                }

                return analysisData;
            }));

            const formattedAnalysis = analyses.map((data, index) => `
                <h2>Analysis for Video ${index + 1}:</h2>
                ${formatMarkdown(data.analysis)}
                <h2>Transcriptions:</h2>
                ${Object.entries(data.transcriptions).map(([key, value]) => `
                    <h3>${key}:</h3>
                    <p><strong>URL:</strong> ${value.url}</p>
                    <div class="transcript">${formatMarkdown(value.transcript)}</div>
                `).join('')}
            `).join('');

            analysisContent.innerHTML = formattedAnalysis;

            // Agregar botón de copiar
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy Results';
            copyBtn.className = 'copy-btn';
            copyBtn.addEventListener('click', () => copyResults());
            results.appendChild(copyBtn);

            results.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            analysisContent.innerHTML = `<p style="color: red;">An error occurred: ${error.message}</p>`;
            results.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    });

    function formatMarkdown(text) {
        text = text.replace(/^### (.*$)/gim, '<h4>$1</h4>');
        text = text.replace(/^## (.*$)/gim, '<h3>$1</3>');
        text = text.replace(/^# (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
        text = text.replace(/^(\d+)\. (.*$)/gim, '<ol><li>$2</li></ol>');
        text = text.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
        text = text.replace(/\*(.*)\*/gim, '<em>$1</em>');
        text = text.replace(/\n$/gim, '<br>');
        return text.trim();
    }

    function copyResults() {
        const textToCopy = analysisContent.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Results copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
});
