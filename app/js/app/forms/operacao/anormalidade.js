// === Lookups ===
const SALAS_URL = AppConfig.apiUrl(AppConfig.endpoints.lookups.salas);
const REGISTRO_ANORMALIDADE_URL = AppConfig.apiUrl(AppConfig.endpoints.forms.anormalidade);
const REGISTRO_LOOKUP_URL = AppConfig.apiUrl(AppConfig.endpoints.lookups.registroOperacao);

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

function getEntradaIdFromQuery() {
    try {
        const params = new URLSearchParams(window.location.search);
        const eid = params.get("entrada_id");
        if (!eid) return null;

        // entrada_id hoje é bigint, mas se um dia mudar (ex.: UUID),
        // devolvemos a string mesmo assim
        const n = Number(eid);
        if (Number.isFinite(n) && n > 0) {
            return String(n);
        }
        return eid;
    } catch (e) {
        console.error("Erro ao ler entrada_id da URL:", e);
        return null;
    }
}

async function loadSalas(prefId = null) {
    const sel = document.getElementById("sala_id_display");
    const hidden = document.getElementById("sala_id");

    if (!sel) return;

    sel.innerHTML = '<option value="">Carregando...</option>';

    try {
        const r = await authFetch(SALAS_URL, { method: "GET" });
        const json = await r.json().catch(() => ({}));
        const rows = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.salas)
                ? json.salas
                : Array.isArray(json)
                    ? json
                    : [];

        if (!rows.length) throw new Error("lista vazia");

        sel.innerHTML =
            '<option value="">Selecione...</option>' +
            rows.map((s) => `<option value="${s.id}">${s.nome}</option>`).join("");

        if (prefId) {
            sel.value = String(prefId);
            if (hidden) hidden.value = String(prefId);
        } else {
            if (hidden) hidden.value = sel.value || "";
        }

        sel.disabled = true;
    } catch (e) {
        console.error("Falha ao carregar salas:", e);
        sel.innerHTML = '<option value="">[Erro ao carregar]</option>';
        sel.disabled = true;
        if (hidden) hidden.value = "";
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
        // Impactos / Reclamações / Manutenção
        {
            name: "houve_prejuizo",
            target: "grp_descricao_prejuizo",
            required: ["descricao_prejuizo"],       // requerido quando "Sim"
        },
        {
            name: "houve_reclamacao",
            target: "grp_autores_conteudo_reclamacao",
            required: ["autores_conteudo_reclamacao"], // requerido quando "Sim"
        },
        {
            name: "acionou_manutencao",
            target: "grp_hora_acionamento",
            required: ["hora_acionamento_manutencao"], // requerido quando "Sim"
        },
        {
            name: "resolvida_pelo_operador",
            target: "grp_procedimentos_adotados",
            required: [],                             // opcional mesmo quando "Sim"
        },
        // Nova pergunta: A anormalidade foi solucionada?
        {
            name: "anormalidade_solucionada",
            target: "grp_solucao",
            required: ["data_solucao", "hora_solucao"], // obrigatórios quando "Sim"
        },
    ];

    toggles.forEach((t) => {
        const groupEl = document.getElementById(t.target);
        if (!groupEl) return;

        const radios = document.querySelectorAll(`input[name="${t.name}"]`);
        if (!radios.length) return;

        const apply = () => {
            const yes = document.querySelector(
                `input[name="${t.name}"][value="sim"]`
            );
            const show = !!yes && yes.checked;

            groupEl.classList.toggle("hidden", !show);

            (t.required || []).forEach((fieldId) => {
                const field = document.getElementById(fieldId);
                if (!field) return;

                if (show) {
                    field.setAttribute("required", "required");
                } else {
                    field.removeAttribute("required");
                    if ("value" in field) {
                        field.value = "";
                    }
                }
            });
        };

        radios.forEach((r) => {
            r.addEventListener("change", apply);
        });

        // Estado inicial
        apply();
    });
}


// === Inicialização mínima (somente visual/obrigatoriedade neste passo) ===
document.addEventListener("DOMContentLoaded", async () => {
    bindToggles();

    const params = new URLSearchParams(window.location.search);
    const registroId = params.get("registro_id");
    const entradaId = params.get("entrada_id");

    const registroIdInput = document.getElementById("registro_id");
    const entradaIdInput = document.getElementById("entrada_id");
    const registroRef = document.getElementById("registro-ref");
    const dataInput = document.getElementById("data");
    const salaHidden = document.getElementById("sala_id");
    const salaDisplay = document.getElementById("sala_id_display");
    const nomeEventoDisplay = document.getElementById("nome_evento_display");
    const nomeEventoHidden = document.getElementById("nome_evento");

    // Guarda ids ocultos
    if (registroIdInput && registroId) registroIdInput.value = registroId;
    if (entradaIdInput && entradaId) entradaIdInput.value = entradaId;

    // Texto de referência
    if (registroId && registroRef) {
        registroRef.textContent =
            "Vinculado ao registro de operação nº " + registroId;
    }

    let prefSalaId = null;

    // Busca dados do registro de operação para preencher cabeçalho
    if (registroId) {
        try {
            const info = await loadRegistroOperacao(registroId);
            console.log("Registro de operação carregado na RAOA:", info);

            if (info) {
                if (dataInput && info.data) {
                    // espera-se formato YYYY-MM-DD
                    dataInput.value = info.data;
                }
                if (typeof info.nome_evento === "string") {
                    if (nomeEventoDisplay) nomeEventoDisplay.value = info.nome_evento;
                    if (nomeEventoHidden) nomeEventoHidden.value = info.nome_evento;
                }
                if (typeof info.sala_id !== "undefined" && info.sala_id !== null) {
                    prefSalaId = info.sala_id;
                    if (salaHidden) salaHidden.value = String(info.sala_id);
                }
            }
        } catch (e) {
            console.error("Erro ao carregar registro de operação:", e);
        }
    }

    // Carrega lista de salas e seleciona a sala da operação
    await loadSalas(prefSalaId);

    // Garante travamento visual
    if (dataInput) dataInput.readOnly = true;
    if (nomeEventoDisplay) nomeEventoDisplay.disabled = true;
    if (salaDisplay) salaDisplay.disabled = true;

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

    // Botão Voltar — volta para a tela anterior (Operação) ou, se não houver histórico, para a Home
    const btnVoltar = document.getElementById("btn-voltar");
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (ev) => {
            ev.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "/home.html";
            }
        });
    }
});