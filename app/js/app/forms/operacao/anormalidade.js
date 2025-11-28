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
        const resp = await authFetch(
            `${REGISTRO_LOOKUP_URL}?id=${encodeURIComponent(registroId)}`,
            { method: "GET" }
        );

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

/**
 * Tenta carregar uma anormalidade existente para a entrada_id informada.
 * - 404 => não existe ainda (modo "novo")
 * - 200 + data => preenche o formulário e devolve o objeto
 */
async function loadAnormalidadeExistente(entradaId) {
    if (!entradaId) return null;

    try {
        const url = `${REGISTRO_ANORMALIDADE_URL}?entrada_id=${encodeURIComponent(entradaId)}`;
        const resp = await authFetch(url, { method: "GET" });

        if (resp.status === 404) {
            // Não há registro ainda para esta entrada
            return null;
        }

        const json = await resp.json().catch(() => ({}));

        if (!resp.ok || json.ok === false) {
            console.error("Falha ao buscar anormalidade existente:", json);
            return null;
        }

        const data = json.data || json;
        if (!data || typeof data !== "object") {
            return null;
        }

        preencherFormularioAnormalidade(data);
        return data;
    } catch (e) {
        console.error("Erro inesperado ao carregar anormalidade existente:", e);
        return null;
    }
}

/**
 * Preenche o formulário da RAOA com os dados retornados do backend
 * (modo edição) e injeta o hidden "id" para UPDATE.
 */
function preencherFormularioAnormalidade(data) {
    const setVal = (id, value) => {
        if (typeof value === "undefined" || value === null) return;
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
            el.value = String(value);
        }
    };

    const setRadioFromBoolLike = (name, value) => {
        if (typeof value === "undefined" || value === null || value === "") return;

        let v = value;
        if (typeof v === "boolean") {
            v = v ? "sim" : "nao";
        } else {
            const s = String(v).toLowerCase();
            if (s === "sim" || s === "nao") {
                v = s;
            } else if (s === "true" || s === "t" || s === "1") {
                v = "sim";
            } else if (s === "false" || s === "f" || s === "0") {
                v = "nao";
            } else {
                // fallback conservador
                v = "nao";
            }
        }

        const radio = document.querySelector(`input[name="${name}"][value="${v}"]`);
        if (radio) {
            radio.checked = true;
            // dispara change para atualizar os grupos condicionais (bindToggles)
            radio.dispatchEvent(new Event("change", { bubbles: true }));
        }
    };

    // Cabeçalho — se o backend devolver esses campos, mantemos coerência com o que está salvo
    setVal("data", data.data);
    setVal("sala_id", data.sala_id);
    setVal("sala_id_display", data.sala_id);
    setVal("nome_evento_display", data.nome_evento);
    setVal("nome_evento", data.nome_evento);

    // Campos principais
    setVal("hora_inicio_anormalidade", data.hora_inicio_anormalidade);
    setVal("descricao_anormalidade", data.descricao_anormalidade);

    // Radios + condicionais
    setRadioFromBoolLike("houve_prejuizo", data.houve_prejuizo);
    setVal("descricao_prejuizo", data.descricao_prejuizo);

    setRadioFromBoolLike("houve_reclamacao", data.houve_reclamacao);
    setVal("autores_conteudo_reclamacao", data.autores_conteudo_reclamacao);

    setRadioFromBoolLike("acionou_manutencao", data.acionou_manutencao);
    setVal("hora_acionamento_manutencao", data.hora_acionamento_manutencao);

    setRadioFromBoolLike("resolvida_pelo_operador", data.resolvida_pelo_operador);
    setVal("procedimentos_adotados", data.procedimentos_adotados);

    setRadioFromBoolLike("anormalidade_solucionada", data.anormalidade_solucionada);
    setVal("data_solucao", data.data_solucao);
    setVal("hora_solucao", data.hora_solucao);

    setVal("responsavel_evento", data.responsavel_evento);
    setVal("operador_responsavel_id", data.operador_responsavel_id);

    // id da anormalidade (para UPDATE)
    const form = document.getElementById("form-raoa");
    if (form && data.id) {
        let hid = form.querySelector('input[name="id"]');
        if (!hid) {
            hid = document.createElement("input");
            hid.type = "hidden";
            hid.name = "id"; // backend trata como chave para UPDATE
            hid.id = "registro_anormalidade_id";
            form.appendChild(hid);
        }
        hid.value = String(data.id);
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


// === Inicialização ===
document.addEventListener("DOMContentLoaded", async () => {
    bindToggles();

    const registroId = getRegistroIdFromQuery();
    const entradaId = getEntradaIdFromQuery();

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

    // Garante travamento visual do cabeçalho
    if (dataInput) dataInput.readOnly = true;
    if (nomeEventoDisplay) nomeEventoDisplay.disabled = true;
    if (salaDisplay) salaDisplay.disabled = true;

    const form = document.getElementById("form-raoa");
    if (!form) {
        console.error("Formulário de anormalidade não encontrado (id=form-raoa).");
        return;
    }

    // Detecta se já há anormalidade para esta entrada (modo edição)
    let modo = "novo";
    let registroAnormalidade = null;

    if (entradaId) {
        registroAnormalidade = await loadAnormalidadeExistente(entradaId);
        if (registroAnormalidade && registroAnormalidade.id) {
            modo = "edicao";
        }
    }

    // Ajusta texto do botão de submit (se existir)
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
        const novoTxt = "Salvar registro de anormalidade";
        const editTxt = "Salvar alterações do registro de anormalidade";

        if (submitBtn.tagName === "BUTTON") {
            submitBtn.textContent = modo === "edicao" ? editTxt : novoTxt;
        } else if (submitBtn.tagName === "INPUT") {
            submitBtn.value = modo === "edicao" ? editTxt : novoTxt;
        }
    }

    // Enviar para o backend Django (INSERT ou UPDATE dependendo da presença de id)
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

            const msgSucesso = modo === "edicao"
                ? "Registro de anormalidade atualizado com sucesso!"
                : "Registro de anormalidade criado com sucesso!";

            alert(msgSucesso);

            // Preferência: voltar para a tela de Operação da qual o usuário veio
            if (document.referrer) {
                window.history.back();
            } else if (registroId) {
                window.location.href =
                    "/forms/operacao/index.html?registro_id=" + encodeURIComponent(registroId);
            } else {
                window.location.href = "/home.html";
            }
        } catch (e) {
            console.error("Falha inesperada ao salvar registro de anormalidade:", e);
            alert("Erro inesperado ao salvar o formulário. Tente novamente.");
        }
    });

    // Botão Voltar — volta para a tela anterior (Operação) ou, se não houver histórico, para a tela da operação ou Home
    const btnVoltar = document.getElementById("btn-voltar");
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (ev) => {
            ev.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else if (registroId) {
                window.location.href =
                    "/forms/operacao/index.html?registro_id=" + encodeURIComponent(registroId);
            } else {
                window.location.href = "/home.html";
            }
        });
    }
});
