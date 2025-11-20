async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        const html = await response.text();
        document.getElementById(id).innerHTML = html;
    } catch (e) {
        console.error(`Erro ao carregar ${file}:`, e);
    }
}

// --- Função para carregar scripts ---
function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
}

// --- Lógica de inicialização ---
async function initializePage() {
    // Espera os componentes HTML terminarem de carregar
    await Promise.all([
        loadComponent("header", "/components/header.html"),
        loadComponent("footer", "/components/footer.html")
    ]);

    // SÓ DEPOIS de carregar o HTML, carrega o script
}

initializePage(); // Executa a inicialização