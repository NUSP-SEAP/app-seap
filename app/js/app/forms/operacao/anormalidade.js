// === Lookups ===
const SALAS_URL = "https://senado-nusp.cloud/webhook/forms/lookup/salas"; // mesmo usado em Operação
const REGISTRO_ANORMALIDADE_URL = "https://senado-nusp.cloud/webhook/operacao/anormalidade/registro";
const REGISTRO_LOOKUP_URL = "https://senado-nusp.cloud/webhook/forms/lookup/registro-operacao";

function getToken() {
    return localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
}
async function authFetch(url, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    const tok = getToken();
    if (tok) headers["Authorization"] = "Bearer " + tok;
    return fetch(url, Object.assign({}, options, { headers }));
}

function getRegistroIdFromQuery() {
    try {
        const params = new URLSearchParams(window.location.search);
        const rid = params.get("registro_id");
        if (!rid) return null;
        const n = Number(rid);
        if (!Number.isFinite(n) || n <= 0) return null;
        return String(n);
    } catch (e) {
        console.error("Erro ao ler registro_id da URL:", e);
        return null;
    }
}

async function loadSalas(prefId = null) {
    const sel = document.getElementById("sala_id");
    sel.innerHTML = '<option value="">Carregando...</option>';
    try {
        const r = await authFetch(SALAS_URL, { method: "GET" });
        const json = await r.json().catch(() => ({}));
        const rows = Array.isArray(json?.data) ? json.data
            : Array.isArray(json?.salas) ? json.salas
                : Array.isArray(json) ? json : [];
        if (!rows.length) throw new Error("lista vazia");
        sel.innerHTML = '<option value="">Selecione...</option>' +
            rows.map(s => `<option value="${s.id}">${s.nome}</option>`).join("");
        sel.disabled = false;
        if (prefId) sel.value = String(prefId);
    } catch (e) {
        console.error("Falha ao carregar salas:", e);
        sel.innerHTML = '<option value="">[Erro ao carregar]</option>';
    }
}

async function loadRegistroOperacao(registroId) {
    try {
        const resp = await authFetch(`${REGISTRO_LOOKUP_URL}?id=${encodeURIComponent(registroId)}`, {
            method: "GET",
        });

        const json = await resp.json().catch(() => ({}));

        if (!resp.ok || json.ok === false) {
            console.error("Falha ao buscar registro de operação para anormalidade:", json);
            return null;
        }

        if (!json.data) {
            return null;
        }

        return json.data; // { id, data, sala_id, nome_evento }
    } catch (e) {
        console.error("Erro inesperado ao buscar registro de operação:", e);
        return null;
    }
}

// === Regras de exibição condicional (mantidas) ===
function bindToggles() {
    const toggles = [
        { name: "houve_prejuizo", target: "grp_descricao_prejuizo" },
        { name: "houve_reclamacao", target: "grp_autores_conteudo_reclamacao" },
        { name: "acionou_manutencao", target: "grp_hora_acionamento" },
        { name: "resolvida_pelo_operador", target: "grp_procedimentos_adotados" },
    ];
    toggles.forEach(t => {
        document.querySelectorAll(`input[name="${t.name}"]`).forEach(r => {
            r.addEventListener("change", () => {
                const show = document.querySelector(`input[name="${t.name}"][value="sim"]`).checked;
                document.getElementById(t.target).classList.toggle("hidden", !show);
            });
        });
        // estado inicial
        const show = document.querySelector(`input[name="${t.name}"][value="sim"]`).checked;
        document.getElementById(t.target).classList.toggle("hidden", !show);
    });
}

// === Inicialização mínima (somente visual/obrigatoriedade neste passo) ===
document.addEventListener("DOMContentLoaded", async () => {
    bindToggles();

    const registroId = getRegistroIdFromQuery();
    const registroIdInput = document.getElementById("registro_id");
    const registroRef = document.getElementById("registro-ref");
    const dataInput = document.getElementById("data");
    const salaSelect = document.getElementById("sala_id");
    const nomeEventoInput = document.getElementById("nome_evento");

    // Texto de referência no topo
    if (registroId && registroRef) {
        registroRef.textContent = "Vinculado ao registro de operação nº " + registroId;
    }

    let prefSalaId = null;

    // Se veio registro_id na URL, tenta buscar dados da operação para pré-preencher
    if (registroId) {
        const info = await loadRegistroOperacao(registroId);
        if (info) {
            if (registroIdInput) {
                registroIdInput.value = String(info.id);
            }
            if (dataInput && info.data) {
                dataInput.value = info.data; // formato YYYY-MM-DD aceito pelo input[type=date]
            }
            if (nomeEventoInput && typeof info.nome_evento === "string") {
                nomeEventoInput.value = info.nome_evento;
            }
            if (typeof info.sala_id !== "undefined" && info.sala_id !== null) {
                prefSalaId = info.sala_id;
            }
        } else if (registroIdInput) {
            // fallback: ainda assim guarda o registro_id da URL
            registroIdInput.value = registroId;
        }
    }

    // Carrega salas, tentando já selecionar a da operação (se veio do backend)
    await loadSalas(prefSalaId);

    // Enviar para o backend Django
    const form = document.getElementById("form-raoa");
    form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const resp = await authFetch(REGISTRO_ANORMALIDADE_URL, {
                method: "POST",
                body: new FormData(form),
            });

            let data = {};
            try {
                data = await resp.json();
            } catch (e) {
                data = {};
            }

            if (!resp.ok || data.ok === false) {
                let msg = "Erro ao salvar o formulário de anormalidade.";
                if (data && data.errors) {
                    msg += "\n\nDetalhes:\n" + JSON.stringify(data.errors, null, 2);
                } else if (data && data.error) {
                    msg += "\n\n" + data.error;
                }
                alert(msg);
                return;
            }

            alert("Formulário enviado com sucesso!");
            window.location.href = "/home.html";
        } catch (e) {
            console.error("Falha inesperada ao salvar registro de anormalidade:", e);
            alert("Erro inesperado ao salvar o formulário. Tente novamente.");
        }
    });

    // Botão Voltar — por enquanto sem ação (deixado propositalmente em branco)
    document.getElementById("btn-voltar").addEventListener("click", () => { /* reservado */ });
});