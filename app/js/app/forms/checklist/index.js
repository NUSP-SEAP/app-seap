(function () {
    "use strict";

    // ====== Variáveis de Estado ======
    let _inicioTestes = null;
    let _terminoTestes = null;
    let _timerInterval = null;

    // ====== UI Helpers ======
    const $ = (id) => document.getElementById(id);

    const pad2 = (n) => String(n).padStart(2, '0');

    // Formata Date -> HH:MM:SS
    const hhmmss = (d) => {
        if (!d) return null;
        return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    };

    // Atualiza o display do cronômetro
    function updateCronometro() {
        if (!_inicioTestes) return;
        const now = new Date();
        const diff = Math.floor((now - _inicioTestes) / 1000); // segundos

        const m = Math.floor(diff / 60);
        const s = diff % 60;

        const el = $("cronometro");
        if (el) el.textContent = `${pad2(m)}:${pad2(s)}`;
    }

    // ====== Lógica de Dados ======

    // Busca Salas
    async function loadSalas() {
        const url = AppConfig.apiUrl(AppConfig.endpoints.lookups.salas);
        const sel = $("sala_id");
        sel.innerHTML = '<option value="">Carregando...</option>';
        try {
            let resp;
            if (window.Auth && Auth.authFetch) resp = await Auth.authFetch(url, { method: 'GET' });
            else {
                // Fallback sem auth module (raro)
                resp = await fetch(url, { method: 'GET' });
            }
            const json = await resp.json().catch(() => ({}));
            const rows = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);

            const opts = ['<option value="">Selecione...</option>'].concat(
                rows.map(r => `<option value="${r.id}">${r.nome}</option>`)
            ).join('');

            sel.innerHTML = opts;
            sel.disabled = false;
        } catch (e) {
            console.error(e);
            sel.innerHTML = '<option value="">Falha ao carregar</option>';
        }
    }

    // Busca Tipos de Item (NOVO)
    async function loadItensTipo() {
        const url = AppConfig.apiUrl(AppConfig.endpoints.forms.checklistItensTipo);
        try {
            let resp;
            if (window.Auth && Auth.authFetch) resp = await Auth.authFetch(url, { method: 'GET' });
            else resp = await fetch(url, { method: 'GET' });

            const json = await resp.json();
            return Array.isArray(json.data) ? json.data : [];
        } catch (e) {
            console.error("Erro ao carregar itens de checklist:", e);
            return [];
        }
    }

    // Renderiza os itens na tela
    function renderItens(listaItens) {
        const container = $("itens-container");
        container.innerHTML = "";

        if (!listaItens.length) {
            container.innerHTML = '<div class="muted">Nenhum item configurado no sistema.</div>';
            return;
        }

        // Ordena por ordem definida no banco
        listaItens.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        listaItens.forEach(item => {
            // Cria ID único para os radios
            // Ex: item_1_ok, item_1_falha
            const groupName = `item_${item.id}`;

            const div = document.createElement("div");
            div.className = "check-item";

            div.innerHTML = `
                <span class="check-item-label">${item.nome}</span>
                <div class="check-item-controls">
                    <label class="radio">
                        <input type="radio" name="${groupName}" value="Ok"> Ok
                    </label>
                    <label class="radio">
                        <input type="radio" name="${groupName}" value="Falha"> Falha
                    </label>
                </div>
                <textarea class="falha-descricao" name="${groupName}_falha" placeholder="Descreva a falha..."></textarea>
            `;

            container.appendChild(div);

            // Listener para mostrar/esconder textarea
            const radios = div.querySelectorAll(`input[name="${groupName}"]`);
            const area = div.querySelector("textarea");

            radios.forEach(r => {
                r.addEventListener("change", (e) => {
                    if (e.target.value === "Falha") {
                        area.style.display = "block";
                        area.focus();
                    } else {
                        area.style.display = "none";
                        area.value = "";
                    }
                });
            });
        });
    }

    // Lê o status dos itens da tela para enviar
    function readItensValues() {
        const itens = [];
        const blocks = document.querySelectorAll("#itens-container .check-item");

        blocks.forEach(block => {
            const labelEl = block.querySelector(".check-item-label");
            const nomeItem = labelEl ? labelEl.textContent.trim() : null;

            const radio = block.querySelector("input[type=radio]:checked");
            const status = radio ? radio.value : null;

            const textarea = block.querySelector(".falha-descricao");
            const desc = textarea && textarea.value.trim() ? textarea.value.trim() : null;

            // Só adiciona se tiver nome (segurança)
            if (nomeItem) {
                itens.push({
                    nome: nomeItem,
                    status: status, // pode ser null se não marcado
                    descricao_falha: desc
                });
            }
        });
        return itens;
    }

    function buildPayload() {
        const val = (id) => ($(id)?.value || "").trim();
        const toNull = (v) => v || null;

        return {
            data_operacao: toNull(val('data_operacao')),
            sala_id: parseInt(val('sala_id'), 10) || null,
            hora_inicio_testes: _inicioTestes ? hhmmss(_inicioTestes) : null,
            hora_termino_testes: _terminoTestes ? hhmmss(_terminoTestes) : null,
            usb_01: toNull(val('usb_01')),
            usb_02: toNull(val('usb_02')),
            observacoes: toNull(val('observacoes')),
            itens: readItensValues()
        };
    }

    // ====== Inicialização ======
    document.addEventListener("DOMContentLoaded", async () => {
        // 1. Data Padrão
        $("data_operacao").valueAsDate = new Date();

        // 2. Carregar Dados
        await loadSalas();
        const itensConfig = await loadItensTipo();
        renderItens(itensConfig);

        // 3. Cronômetro
        const btnIniciar = $("btn-iniciar-testes");
        const btnFinalizar = $("btn-finalizar-testes");

        btnIniciar.addEventListener("click", () => {
            if (_inicioTestes) return;
            _inicioTestes = new Date();

            btnIniciar.disabled = true;
            btnIniciar.classList.remove("btn-primary");
            btnIniciar.classList.add("btn-secondary");

            btnFinalizar.disabled = false;
            btnFinalizar.classList.remove("btn-secondary");
            btnFinalizar.classList.add("btn-danger"); // Destaque visual

            _timerInterval = setInterval(updateCronometro, 1000);
        });

        btnFinalizar.addEventListener("click", () => {
            if (!_inicioTestes || _terminoTestes) return;
            _terminoTestes = new Date();

            clearInterval(_timerInterval);
            updateCronometro(); // Última atualização

            btnFinalizar.disabled = true;
            btnFinalizar.textContent = "Testes Finalizados";
        });

        // 4. Submit
        $("form-checklist").addEventListener("submit", async (ev) => {
            ev.preventDefault();

            // Validações de Fluxo
            if (!_inicioTestes) {
                alert("Você precisa clicar em 'Iniciar Testes' antes de salvar.");
                return;
            }
            if (!_terminoTestes) {
                alert("Você precisa clicar em 'Finalizar Testes' antes de salvar.");
                return;
            }

            // Validação de Itens (Pelo menos um marcado)
            const itensValores = readItensValues();
            const algumMarcado = itensValores.some(it => it.status === "Ok" || it.status === "Falha");

            if (!algumMarcado) {
                alert("Marque o status (Ok ou Falha) de pelo menos um item antes de salvar.");
                return;
            }

            // Se algum estiver marcado como Falha mas sem descrição (opcional, mas boa prática)
            const falhaSemDesc = itensValores.find(it => it.status === "Falha" && !it.descricao_falha);
            if (falhaSemDesc) {
                alert(`O item "${falhaSemDesc.nome}" está marcado como Falha. Por favor, descreva o problema.`);
                return;
            }

            // Envio
            const btn = ev.target.querySelector('button[type="submit"]');
            const originalTxt = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Salvando...";

            try {
                const url = AppConfig.apiUrl(AppConfig.endpoints.forms.checklist);
                const payload = buildPayload();

                let resp;
                if (window.Auth && Auth.authFetch) {
                    resp = await Auth.authFetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // fallback
                    const h = { 'Content-Type': 'application/json' };
                    const t = localStorage.getItem('auth_token');
                    if (t) h['Authorization'] = 'Bearer ' + t;
                    resp = await fetch(url, { method: 'POST', headers: h, body: JSON.stringify(payload) });
                }

                if (resp.status === 401 || resp.status === 403) {
                    alert("Sessão expirada.");
                    window.location.href = "/index.html";
                    return;
                }

                const json = await resp.json().catch(() => ({}));

                if (resp.ok && json.ok) {
                    alert("Checklist salvo com sucesso!");
                    window.location.href = "/home.html";
                } else {
                    const msg = json.message || json.error || "Erro ao salvar.";
                    alert("Não foi possível salvar: " + msg);
                }

            } catch (e) {
                console.error(e);
                alert("Erro de conexão ao salvar.");
            } finally {
                btn.disabled = false;
                btn.textContent = originalTxt;
            }
        });
    });

})();