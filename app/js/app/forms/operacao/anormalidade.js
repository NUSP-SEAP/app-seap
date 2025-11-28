// Endpoints que o front usa
const REGISTRO_LOOKUP_URL = AppConfig.apiUrl(
    AppConfig.endpoints.forms.lookup.registroOperacao
);
const SALAS_URL = AppConfig.apiUrl(
    AppConfig.endpoints.forms.lookup.salas
);
const REGISTRO_ANORMALIDADE_URL = AppConfig.apiUrl(
    AppConfig.endpoints.forms.anormalidade.registro
);

// ----------------------------------------------------------------------------
// Helpers de auth / fetch
// ----------------------------------------------------------------------------
function getToken() {
    try {
        if (window.Auth && typeof Auth.loadToken === "function") {
            return Auth.loadToken();
        }
    } catch (e) {
        console.error("Erro ao obter token JWT:", e);
    }
    return localStorage.getItem("auth_token") || "";
}

async function authFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getToken();
    if (token) {
        headers.set("Authorization", "Bearer " + token);
    }
    return fetch(url, { ...options, headers });
}

// ----------------------------------------------------------------------------
// Helpers de querystring
// ----------------------------------------------------------------------------
function getRegistroIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("registro_id");
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
}

function getEntradaIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("entrada_id");
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
}

// ----------------------------------------------------------------------------
// Lookups
// ----------------------------------------------------------------------------
async function loadSalas(prefSalaId) {
    try {
        const resp = await fetch(SALAS_URL, {
            method: "GET",
        });

        if (!resp.ok) {
            console.error("Falha ao carregar salas", resp.status);
            return;
        }

        const json = await resp.json();
        const salas = json.data || [];

        const select = document.getElementById("sala_id_display");
        const hidden = document.getElementById("sala_id");
        if (!select) return;

        select.innerHTML = "";

        const optEmpty = document.createElement("option");
        optEmpty.value = "";
        optEmpty.textContent = "Selecione...";
        select.appendChild(optEmpty);

        salas.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = String(s.id);
            opt.textContent = s.nome;
            if (prefSalaId && String(prefSalaId) === String(s.id)) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        if (hidden && prefSalaId) {
            hidden.value = String(prefSalaId);
        }

        select.addEventListener("change", () => {
            if (!hidden) return;
            hidden.value = select.value || "";
        });
    } catch (e) {
        console.error("Erro ao carregar salas:", e);
    }
}

async function loadRegistroOperacao(registroId) {
    if (!registroId) return null;

    try {
        const url = `${REGISTRO_LOOKUP_URL}?registro_id=${encodeURIComponent(
            registroId
        )}`;
        const resp = await authFetch(url, {
            method: "GET",
        });

        if (!resp.ok) {
            console.error(
                "Falha ao buscar registro de operação para anormalidade:",
                resp.status
            );
            return null;
        }

        const json = await resp.json().catch(() => ({}));
        if (!json || json.ok === false || !json.data) {
            console.error("Resposta inesperada em lookup de registro:", json);
            return null;
        }

        return json.data;
    } catch (e) {
        console.error("Erro ao carregar registro de operação:", e);
        return null;
    }
}

// ----------------------------------------------------------------------------
// Busca RAOA existente (GET /operacao/anormalidade/registro?entrada_id=...)
// ----------------------------------------------------------------------------
async function loadAnormalidadeExistente(entradaId) {
    if (!entradaId) return null;

    try {
        const url = `${REGISTRO_ANORMALIDADE_URL}?entrada_id=${encodeURIComponent(
            entradaId
        )}`;
        const resp = await authFetch(url, { method: "GET" });

        if (resp.status === 404) {
            // Não existe RAOA para essa entrada → trata como "novo"
            return null;
        }

        const json = await resp.json().catch(() => ({}));

        if (!resp.ok || json.ok === false) {
            console.error("Falha ao buscar anormalidade existente:", json);
            return null;
        }

        return json.data || null;
    } catch (e) {
        console.error("Erro ao buscar anormalidade existente:", e);
        return null;
    }
}

// ----------------------------------------------------------------------------
// Preenche o form com um RAOA existente (edição)
// ----------------------------------------------------------------------------
function preencherFormularioAnormalidade(data) {
    if (!data || typeof data !== "object") return;

    const getEl = (id) => document.getElementById(id);

    const setVal = (id, value) => {
        const el = getEl(id);
        if (!el) return;
        if (value === undefined || value === null) return;
        el.value = String(value);
    };

    const setRadioFromBoolLike = (name, value) => {
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        if (!radios.length) return;

        const v = (value === true || value === false)
            ? (value ? "sim" : "nao")
            : (String(value || "").toLowerCase() === "sim" ? "sim" : "nao");

        let matched = false;
        radios.forEach((r) => {
            if (r.value === v) {
                r.checked = true;
                matched = true;
            } else {
                r.checked = false;
            }
        });

        if (!matched) {
            const nao = Array.from(radios).find((r) => r.value === "nao");
            if (nao) nao.checked = true;
        }

        // dispara change para atualizar visibilidade dos grupos
        const evt = new Event("change", { bubbles: true });
        radios.forEach((r) => r.dispatchEvent(evt));
    };

    // Cabeçalho (corrige se backend devolver algo diferente)
    setVal("registro_id", data.registro_id);
    setVal("entrada_id", data.entrada_id);
    setVal("data", data.data);
    setVal("sala_id", data.sala_id);
    setVal("nome_evento", data.nome_evento);
    setVal("nome_evento_display", data.nome_evento);

    // Campos principais
    setVal("hora_inicio_anormalidade", data.hora_inicio_anormalidade);
    setVal("descricao_anormalidade", data.descricao_anormalidade);

    // Bools + dependentes
    setRadioFromBoolLike("houve_prejuizo", data.houve_prejuizo);
    setVal("descricao_prejuizo", data.descricao_prejuizo);

    setRadioFromBoolLike("houve_reclamacao", data.houve_reclamacao);
    setVal("autores_conteudo_reclamacao", data.autores_conteudo_reclamacao);

    setRadioFromBoolLike("acionou_manutencao", data.acionou_manutencao);
    setVal("hora_acionamento_manutencao", data.hora_acionamento_manutencao);

    setRadioFromBoolLike("resolvida_pelo_operador", data.resolvida_pelo_operador);
    setVal("procedimentos_adotados", data.procedimentos_adotados);

    // Solução da anormalidade
    setRadioFromBoolLike("anormalidade_solucionada", data.anormalidade_solucionada);
    setVal("data_solucao", data.data_solucao);
    setVal("hora_solucao", data.hora_solucao);

    setVal("responsavel_evento", data.responsavel_evento);

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

// ----------------------------------------------------------------------------
// Regras de exibição condicional dos grupos (radios "Sim/Não")
// ----------------------------------------------------------------------------
function bindToggles() {
    const toggles = [
        {
            name: "houve_prejuizo",
            target: "grp_descricao_prejuizo",
            required: ["descricao_prejuizo"],
        },
        {
            name: "houve_reclamacao",
            target: "grp_autores_conteudo_reclamacao",
            required: ["autores_conteudo_reclamacao"],
        },
        {
            name: "acionou_manutencao",
            target: "grp_hora_acionamento", // id do HTML
            required: ["hora_acionamento_manutencao"],
        },
        {
            name: "resolvida_pelo_operador",
            target: "grp_procedimentos_adotados",
            required: ["procedimentos_adotados"],
        },
        {
            name: "anormalidade_solucionada",
            target: "grp_solucao",
            required: ["data_solucao", "hora_solucao"],
        },
    ];

    toggles.forEach((cfg) => {
        const radios = document.querySelectorAll(`input[name="${cfg.name}"]`);
        const groupEl = document.getElementById(cfg.target);
        const requiredIds = cfg.required || [];

        const update = () => {
            let value = "nao";
            radios.forEach((r) => {
                if (r.checked) value = r.value;
            });
            const show = value === "sim";

            if (groupEl) {
                // Usa a classe .hidden do CSS, igual ao restante do sistema
                groupEl.classList.toggle("hidden", !show);
            }

            requiredIds.forEach((id) => {
                const el = document.getElementById(id);
                if (!el) return;
                if (show) {
                    el.setAttribute("required", "required");
                } else {
                    el.removeAttribute("required");
                }
            });
        };

        radios.forEach((r) => r.addEventListener("change", update));
        // estado inicial
        update();
    });
}

// ----------------------------------------------------------------------------
// Inicialização da página RAOA
// ----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    bindToggles();

    const registroId = getRegistroIdFromQuery();
    const entradaId = getEntradaIdFromQuery();

    // Hidden de vínculo
    const registroIdInput = document.getElementById("registro_id");
    const entradaIdInput = document.getElementById("entrada_id");
    if (registroIdInput && registroId) registroIdInput.value = registroId;
    if (entradaIdInput && entradaId) entradaIdInput.value = entradaId;

    // Texto "Vinculado ao registro..."
    const registroRef = document.getElementById("registro-ref"); // <<< corrigido (era registro_ref)
    if (registroId && registroRef) {
        registroRef.textContent =
            "Vinculado ao registro de operação nº " + registroId;
    }

    // Cabeçalho
    const dataInput = document.getElementById("data");
    const salaDisplay = document.getElementById("sala_id_display");
    const salaHidden = document.getElementById("sala_id");
    const nomeEventoDisplay = document.getElementById("nome_evento_display");
    const nomeEventoHidden = document.getElementById("nome_evento");

    let prefSalaId = null;

    if (registroId) {
        const registro = await loadRegistroOperacao(registroId);
        if (registro) {
            if (dataInput && registro.data) {
                dataInput.value = registro.data;
            }

            if (nomeEventoDisplay) {
                nomeEventoDisplay.value = registro.nome_evento || "";
            }
            if (nomeEventoHidden) {
                nomeEventoHidden.value = registro.nome_evento || "";
            }

            prefSalaId = registro.sala_id || null;
            if (salaHidden && prefSalaId) {
                salaHidden.value = String(prefSalaId);
            }
        }
    }

    await loadSalas(prefSalaId);

    // Bloqueia edição dos campos de cabeçalho
    if (dataInput) dataInput.readOnly = true;
    if (nomeEventoDisplay) nomeEventoDisplay.disabled = true;
    if (salaDisplay) salaDisplay.disabled = true;

    const form = document.getElementById("form-raoa");
    if (!form) {
        console.error("Formulário RAOA não encontrado (#form-raoa).");
        return;
    }

    // Descobre se é "novo" ou "edição" pela existência de RAOA para a entrada
    let modo = "novo";
    let registroAnormalidade = null;

    if (entradaId) {
        registroAnormalidade = await loadAnormalidadeExistente(entradaId);
        if (registroAnormalidade && registroAnormalidade.id) {
            modo = "edicao";
            preencherFormularioAnormalidade(registroAnormalidade);
        }
    }

    // Ajusta texto do botão
    const submitBtn = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );
    if (submitBtn) {
        const novoTxt = "Salvar registro de anormalidade";
        const editTxt = "Salvar alterações do registro de anormalidade";

        if (submitBtn.tagName === "BUTTON") {
            submitBtn.textContent = modo === "edicao" ? editTxt : novoTxt;
        } else if (submitBtn.tagName === "INPUT") {
            submitBtn.value = modo === "edicao" ? editTxt : novoTxt;
        }
    }

    // Submit
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

            const json = await resp
                .clone()
                .json()
                .catch(() => ({}));

            if (!resp.ok || json.ok === false) {
                const errors = (json && json.errors) || {};
                const msgs = Object.values(errors);
                if (msgs.length) {
                    alert(
                        "Não foi possível salvar o registro de anormalidade:\n\n" +
                        msgs.join("\n")
                    );
                } else {
                    alert(
                        "Erro ao salvar o registro de anormalidade. Verifique os dados e tente novamente."
                    );
                }
                return;
            }

            const msgSucesso =
                modo === "edicao"
                    ? "Registro de anormalidade atualizado com sucesso!"
                    : "Registro de anormalidade criado com sucesso!";

            alert(msgSucesso);

            // Após salvar RAOA → ir para a home (como você pediu)
            window.location.href = "/home.html";
        } catch (e) {
            console.error("Erro ao enviar RAOA:", e);
            alert(
                "Erro inesperado ao salvar o registro de anormalidade. Tente novamente em instantes."
            );
        }
    });

    // Botão Voltar
    const btnVoltar = document.getElementById("btn-voltar");
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (ev) => {
            ev.preventDefault();
            if (document.referrer) {
                window.history.back();
            } else {
                window.location.href = "/home.html";
            }
        });
    }
});
