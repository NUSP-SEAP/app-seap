// app/js/app/forms/operacao/index.js
// Front-end do formulário "Registro de Operação de Áudio"
// Integrado aos endpoints JSON de sessão de operação de áudio.

(function () {
    "use strict";

    // ====== Endpoints ======
    const SALAS_URL = AppConfig.apiUrl(AppConfig.endpoints.lookups.salas);
    const OPERADORES_URL = AppConfig.apiUrl(AppConfig.endpoints.lookups.operadores);

    const ESTADO_SESSAO_URL = AppConfig.apiUrl(AppConfig.endpoints.operacaoAudio.estadoSessao);
    const SALVAR_ENTRADA_URL = AppConfig.apiUrl(AppConfig.endpoints.operacaoAudio.salvarEntrada);
    const FINALIZAR_SESSAO_URL = AppConfig.apiUrl(AppConfig.endpoints.operacaoAudio.finalizarSessao);

    // ====== Referências globais de DOM (preenchidas no DOMContentLoaded) ======
    let form;
    let salaSelect;
    let dataOperacaoInput;
    let horarioPautaInput;
    let horaInicioInput;
    let horaFimInput;
    let nomeEventoInput;
    let usb01Input;
    let usb02Input;
    let observacoesInput;

    let operador1Select;
    let operador2Select;
    let operador3Select;

    let btnVoltar;
    let btnCancelarEdicao;
    let btnLimpar;
    let btnSalvarRegistro;
    let btnSalvarEdicao;
    let btnEditarEntrada1;
    let btnEditarEntrada2;
    let btnFinalizarSessao;

    let sectionAnormalidade;

    // 1 = editando 1ª entrada; 2 = editando 2ª; null = não está editando
    let modoEdicaoEntradaSeq = null;

    // ====== Estado em memória ======
    let estadoSessao = null;
    const uiState = {
        situacao_operador: "sem_sessao",   // "sem_sessao" | "sem_entrada" | "uma_entrada" | "duas_entradas"
        sessaoAberta: false,
    };

    // ====== Helpers genéricos ======
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    function safeJson(resp) {
        return resp.json().catch(() => null);
    }

    function fillSelect(selectEl, rows, valueKey, labelKey, placeholder = "Selecione...") {
        if (!selectEl) return;
        const opts = ['<option value="">' + placeholder + "</option>"]
            .concat(
                (rows || []).map(
                    (r) =>
                        `<option value="${String(r[valueKey])}">${String(
                            r[labelKey]
                        )}</option>`
                )
            )
            .join("");
        selectEl.innerHTML = opts;
        selectEl.disabled = false;
    }

    function getTipoEventoSelecionado() {
        const radio = document.querySelector('input[name="tipo_evento"]:checked');
        if (!radio) return "operacao";
        return (radio.value || "operacao").toLowerCase();
    }

    function setTipoEventoSelecionado(tipo) {
        const radios = $$('input[name="tipo_evento"]');
        let found = false;
        radios.forEach((r) => {
            if ((r.value || "").toLowerCase() === (tipo || "").toLowerCase()) {
                r.checked = true;
                found = true;
            }
        });
        if (!found && radios.length) {
            radios[0].checked = true;
        }
    }

    function ensureHojeEmDataOperacao() {
        if (!dataOperacaoInput) return;
        if (!dataOperacaoInput.value) {
            const hoje = new Date();
            try {
                dataOperacaoInput.valueAsDate = hoje;
            } catch {
                const yyyy = hoje.getFullYear();
                const mm = String(hoje.getMonth() + 1).padStart(2, "0");
                const dd = String(hoje.getDate()).padStart(2, "0");
                dataOperacaoInput.value = `${yyyy}-${mm}-${dd}`;
            }
        }
    }

    // Limpa o formulário depois de salvar / ao clicar em "Limpar",
    // mantendo sala e tipo de evento selecionados.
    function resetFormMantendoSalaETipo() {
        if (!form) return;
        const salaValue = salaSelect ? salaSelect.value : "";
        const tipoValor = getTipoEventoSelecionado();

        form.reset();

        if (salaSelect) {
            salaSelect.value = salaValue;
        }
        setTipoEventoSelecionado(tipoValor);

        ensureHojeEmDataOperacao();
        atualizarTipoEventoUI();
    }

    // ====== Cabeçalhos (topo da tela) ======

    // Atualiza o cabeçalho de operadores da sessão (lado esquerdo)
    function atualizarCabecalhoOperadoresSessao() {
        const headerEl = document.getElementById("info-operadores-sessao");
        if (!headerEl) {
            atualizarIndicadorModoEdicao();
            return;
        }

        // Se não há estado carregado ou não há sessão aberta, esconde o cabeçalho
        if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
            headerEl.style.display = "none";
            headerEl.textContent = "";
            atualizarIndicadorModoEdicao();
            return;
        }

        // Preferência: usar entradas_sessao com a ordem real dos registros
        let entradas = Array.isArray(estadoSessao.entradas_sessao)
            ? estadoSessao.entradas_sessao.slice()
            : [];

        // Fallback com nomes_operadores_sessao, caso não venham as entradas
        if (!entradas.length) {
            const nomesFallback = Array.isArray(estadoSessao.nomes_operadores_sessao)
                ? estadoSessao.nomes_operadores_sessao
                : [];

            if (!nomesFallback.length) {
                headerEl.style.display = "none";
                headerEl.textContent = "";
                atualizarIndicadorModoEdicao();
                return;
            }

            const linhasFallback = [];
            linhasFallback.push("Registro aberto por " + nomesFallback[0] + ".");

            const ordinaisFallback = {
                2: "Segundo",
                3: "Terceiro",
                4: "Quarto",
                5: "Quinto",
                6: "Sexto",
                7: "Sétimo",
                8: "Oitavo",
                9: "Nono",
                10: "Décimo",
            };

            const descricoesFallback = [];
            for (let i = 1; i < nomesFallback.length; i++) {
                const posicao = i + 1; // 2, 3, 4...
                const prefixo = ordinaisFallback[posicao] || posicao + "º";
                descricoesFallback.push(prefixo + " registro feito por " + nomesFallback[i]);
            }

            for (let j = 0; j < descricoesFallback.length; j += 2) {
                if (j + 1 < descricoesFallback.length) {
                    linhasFallback.push(descricoesFallback[j] + " • " + descricoesFallback[j + 1]);
                } else {
                    linhasFallback.push(descricoesFallback[j]);
                }
            }

            headerEl.innerHTML = linhasFallback.join("<br>");
            headerEl.style.display = "";

            atualizarIndicadorModoEdicao();
            return;
        }

        // Usa entradas_sessao com base no campo ordem (ordem real de gravação)
        entradas.sort((a, b) => {
            const oa =
                typeof a.ordem === "number"
                    ? a.ordem
                    : parseInt(a.ordem || a.seq || 0, 10);
            const ob =
                typeof b.ordem === "number"
                    ? b.ordem
                    : parseInt(b.ordem || b.seq || 0, 10);

            if (oa !== ob) return oa - ob;

            const ea = a.entrada_id || a.id || 0;
            const eb = b.entrada_id || b.id || 0;
            return ea - eb;
        });

        const linhas = [];

        const ordinais = {
            1: "Primeiro",
            2: "Segundo",
            3: "Terceiro",
            4: "Quarto",
            5: "Quinto",
            6: "Sexto",
            7: "Sétimo",
            8: "Oitavo",
            9: "Nono",
            10: "Décimo",
        };

        // 1ª linha: Registro aberto por <Nome do operador do 1º registro>
        const primeira = entradas[0];
        const nomePrimeiro =
            primeira && primeira.operador_nome ? primeira.operador_nome : "—";
        linhas.push("Registro aberto por " + nomePrimeiro + ".");

        // Demais linhas: sempre dois registros por linha
        const descricoes = [];
        for (let i = 1; i < entradas.length; i++) {
            const entrada = entradas[i];
            const posicao = i + 1; // 2, 3, 4...
            const prefixo = ordinais[posicao] || posicao + "º";
            const nome =
                entrada && entrada.operador_nome ? entrada.operador_nome : "—";
            descricoes.push(prefixo + " registro feito por " + nome);
        }

        for (let j = 0; j < descricoes.length; j += 2) {
            if (j + 1 < descricoes.length) {
                linhas.push(descricoes[j] + " • " + descricoes[j + 1]);
            } else {
                linhas.push(descricoes[j]);
            }
        }

        headerEl.innerHTML = linhas.join("<br>");
        headerEl.style.display = "";

        atualizarIndicadorModoEdicao();
    }

    // Atualiza o indicador de modo edição (topo direito)
    function atualizarIndicadorModoEdicao() {
        const modoEl = document.getElementById("info-modo-edicao");
        if (!modoEl) return;

        // Se não há sessão aberta, esconde o indicador
        if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
            modoEdicaoEntradaSeq = null;
            modoEl.style.display = "none";
            modoEl.textContent = "";
            return;
        }

        // Se estiver editando 1ª ou 2ª entrada, mostra no canto direito
        if (modoEdicaoEntradaSeq === 1 || modoEdicaoEntradaSeq === 2) {
            const ordinal = modoEdicaoEntradaSeq === 1 ? "1º" : "2º";
            modoEl.textContent = "Editando " + ordinal + " Registro";
            modoEl.style.display = "";
        } else {
            // Fora do modo edição, some
            modoEl.textContent = "";
            modoEl.style.display = "none";
        }
    }

    // ====== Lookups (salas e operadores) ======
    async function loadSalas() {
        if (!salaSelect) return;
        salaSelect.innerHTML = '<option value="">Carregando...</option>';
        salaSelect.disabled = true;

        try {
            let resp;
            if (window.Auth && typeof Auth.authFetch === "function") {
                resp = await Auth.authFetch(SALAS_URL, { method: "GET" });
            } else {
                resp = await fetch(SALAS_URL, { method: "GET" });
            }

            const json = await safeJson(resp);
            if (!resp.ok || !json || json.ok === false || !Array.isArray(json.data)) {
                console.error("Falha ao carregar salas:", json);
                salaSelect.innerHTML =
                    '<option value="">Falha ao carregar salas</option>';
                return;
            }

            fillSelect(salaSelect, json.data, "id", "nome", "Selecione a sala");
        } catch (e) {
            console.error("Erro inesperado ao carregar salas:", e);
            salaSelect.innerHTML =
                '<option value="">Falha ao carregar salas</option>';
        } finally {
            salaSelect.disabled = false;
        }
    }

    async function loadOperadores() {
        const selects = [operador1Select, operador2Select, operador3Select].filter(
            Boolean
        );
        if (!selects.length) return;

        selects.forEach((sel) => {
            sel.innerHTML = '<option value="">Carregando...</option>';
            sel.disabled = true;
        });

        try {
            let resp;
            if (window.Auth && typeof Auth.authFetch === "function") {
                resp = await Auth.authFetch(OPERADORES_URL, { method: "GET" });
            } else {
                resp = await fetch(OPERADORES_URL, { method: "GET" });
            }

            const json = await safeJson(resp);
            if (!resp.ok || !json || json.ok === false || !Array.isArray(json.data)) {
                console.error("Falha ao carregar operadores:", json);
                selects.forEach((sel) => {
                    sel.innerHTML =
                        '<option value="">Falha ao carregar operadores</option>';
                });
                return;
            }

            selects.forEach((sel) => {
                fillSelect(
                    sel,
                    json.data,
                    "id",
                    "nome_completo",
                    "Selecione o operador"
                );
            });
        } catch (e) {
            console.error("Erro inesperado ao carregar operadores:", e);
            selects.forEach((sel) => {
                sel.innerHTML =
                    '<option value="">Falha ao carregar operadores</option>';
            });
        }
    }

    // ====== UI: Operadores (mostrar/ocultar linhas 2 e 3) ======
    function setupOperatorsUI() {
        const row2 = document.getElementById("op-row-2");
        const row3 = document.getElementById("op-row-3");

        const btnAddTop = document.getElementById("btn-add-top");
        const btnAddTopLegend = document.getElementById("btn-add-top-legend");
        const btnAddOp2 = document.getElementById("btn-add-op-2");
        const btnRemoveOp2 = document.getElementById("btn-remove-op-2");

        function showRow2() {
            if (!row2) return;
            row2.style.display = "grid";
            if (btnAddTop) btnAddTop.style.visibility = "hidden";
            if (btnAddTopLegend) btnAddTopLegend.style.visibility = "hidden";
        }

        function hideRow2() {
            if (!row2) return;
            row2.style.display = "none";
            if (operador2Select) operador2Select.value = "";
            hideRow3();
            if (btnAddTop) btnAddTop.style.visibility = "visible";
            if (btnAddTopLegend) btnAddTopLegend.style.visibility = "visible";
        }

        function showRow3() {
            if (!row3) return;
            row3.style.display = "grid";
        }

        function hideRow3() {
            if (!row3) return;
            row3.style.display = "none";
            if (operador3Select) operador3Select.value = "";
        }

        if (btnAddTop) {
            btnAddTop.addEventListener("click", function () {
                showRow2();
            });
        }
        if (btnAddTopLegend) {
            btnAddTopLegend.addEventListener("click", function () {
                showRow2();
            });
        }
        if (btnAddOp2) {
            btnAddOp2.addEventListener("click", function () {
                showRow3();
            });
        }
        if (btnRemoveOp2) {
            btnRemoveOp2.addEventListener("click", function () {
                hideRow2();
            });
        }
    }

    // ====== Tipo de evento / Anormalidade / Plenário ======
    function atualizarTipoEventoUI() {
        if (!sectionAnormalidade) return;

        const tipoSelecionado = getTipoEventoSelecionado();
        const tipoEfetivo = (tipoSelecionado || "operacao").toLowerCase();

        // --- Regra de anormalidade ---
        // Só mostra "Houve anormalidade?" quando tipo = operação
        if (tipoEfetivo === "operacao") {
            sectionAnormalidade.style.display = "";
        } else {
            sectionAnormalidade.style.display = "none";
            const radioNao = document.querySelector(
                'input[name="houve_anormalidade"][value="nao"]'
            );
            if (radioNao) radioNao.checked = true;
        }

        // --- Regra especial: "Outros Eventos" => sala obrigatoriamente Plenário ---
        if (!salaSelect) return;

        if (tipoEfetivo === "outros") {
            // Guarda a sala atual, se ainda não tiver guardado,
            // para conseguir voltar a ela depois
            if (!salaSelect.dataset.salaOriginalOutros) {
                salaSelect.dataset.salaOriginalOutros = salaSelect.value || "";
            }

            // Procura uma opção cujo texto contenha "plenário"
            let plenOpt = null;
            Array.from(salaSelect.options || []).forEach((opt) => {
                const txt =
                    (opt.textContent || opt.innerText || opt.label || "").toLowerCase();
                if (!plenOpt && /plen[áa]rio/.test(txt)) {
                    plenOpt = opt;
                }
            });
            if (plenOpt) {
                salaSelect.value = plenOpt.value;
            }
            // Enquanto for "Outros Eventos", o Local do Evento fica travado
            salaSelect.disabled = true;
        } else {
            // Voltou para Operação Comum ou Cessão de Sala:
            // restaura a sala que o usuário tinha escolhido antes de "Outros"
            const original = salaSelect.dataset.salaOriginalOutros;
            if (typeof original === "string") {
                const hasOriginal = Array.from(salaSelect.options || []).some(
                    (opt) => opt.value === original
                );
                if (hasOriginal) {
                    salaSelect.value = original;
                }
            }
            delete salaSelect.dataset.salaOriginalOutros;

            // Fora do "Outros Eventos", o combobox da sala fica livre.
            salaSelect.disabled = false;
        }
    }

    function bindTipoEventoLogic() {
        const radios = $$('input[name="tipo_evento"]');
        radios.forEach((r) => {
            r.addEventListener("change", function () {
                const oldSala = salaSelect ? salaSelect.value : null;

                atualizarTipoEventoUI();

                // BUG 2: se mudar para "Outros Eventos" (força Plenário) ou voltar
                // para Operação/Cessão (restaura sala original), o valor da sala muda.
                // Quando isso acontecer, precisamos recarregar o estado da sessão da
                // NOVA sala para atualizar o cabeçalho "Registro aberto por...".
                if (salaSelect && salaSelect.value && salaSelect.value !== oldSala) {
                    carregarEstadoSessao(salaSelect.value);
                }
            });
        });
        atualizarTipoEventoUI();
    }

    // ====== Estado da sessão (GET /estado-sessao) ======
    async function carregarEstadoSessao(salaId) {
        if (!salaId) {
            estadoSessao = null;
            uiState.situacao_operador = "sem_sessao";
            uiState.sessaoAberta = false;
            aplicarEstadoSessaoNaUI();
            return;
        }

        const url =
            ESTADO_SESSAO_URL +
            "?sala_id=" +
            encodeURIComponent(String(salaId));

        try {
            let resp;
            if (window.Auth && typeof Auth.authFetch === "function") {
                resp = await Auth.authFetch(url, { method: "GET" });
            } else {
                resp = await fetch(url, { method: "GET" });
            }

            const json = await safeJson(resp);
            if (!resp.ok) {
                console.error("Falha HTTP ao buscar estado da sessão:", resp.status, json);
                if (resp.status === 401 || resp.status === 403) {
                    alert(
                        "Sua sessão expirou ou você não está autenticado. Faça login novamente."
                    );
                } else {
                    alert("Erro ao buscar estado da sessão de operação de áudio.");
                }
                estadoSessao = null;
                uiState.situacao_operador = "sem_sessao";
                uiState.sessaoAberta = false;
                aplicarEstadoSessaoNaUI();
                return;
            }

            if (!json || json.ok === false) {
                console.error("Erro lógico ao buscar estado da sessão:", json);
                const msg =
                    (json && (json.message || json.detail || json.error)) ||
                    "Erro ao buscar estado da sessão.";
                alert(msg);
                estadoSessao = null;
                uiState.situacao_operador = "sem_sessao";
                uiState.sessaoAberta = false;
                aplicarEstadoSessaoNaUI();
                return;
            }

            estadoSessao = json.data || null;
            aplicarEstadoSessaoNaUI();
        } catch (e) {
            console.error("Erro inesperado ao buscar estado da sessão:", e);
            alert("Erro inesperado ao buscar estado da sessão de operação de áudio.");
            estadoSessao = null;
            uiState.situacao_operador = "sem_sessao";
            uiState.sessaoAberta = false;
            aplicarEstadoSessaoNaUI();
        }
    }

    // ====== Bloqueio da tela enquanto não houver sala selecionada ======
    function aplicarBloqueioPorSala() {
        if (!form || !salaSelect) return;

        const temSala = !!salaSelect.value;

        // 1) Campos: tudo visível, mas travado sem sala
        const campos = form.querySelectorAll("input, select, textarea");
        campos.forEach((el) => {
            // A sala nunca é desabilitada aqui
            if (el === salaSelect) {
                el.disabled = false;
                if ("readOnly" in el) {
                    el.readOnly = false;
                }
                return;
            }

            const disabled = !temSala;
            el.disabled = disabled;

            // BUG 3: ao sair de uma sala onde o operador tem 2 entradas,
            // os campos estavam ficando readOnly mesmo em outra sala.
            // Se estamos habilitando o campo, garantimos que readOnly seja falso.
            if (!disabled && "readOnly" in el) {
                el.readOnly = false;
            }
        });

        // 2) Botões: só Voltar funciona sem sala
        if (!temSala) {
            if (btnLimpar) {
                btnLimpar.style.display = "none";
                btnLimpar.disabled = true;
            }
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "none";
                btnSalvarRegistro.disabled = true;
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "none";
                btnSalvarEdicao.disabled = true;
            }
            if (btnFinalizarSessao) {
                btnFinalizarSessao.style.display = "none";
                btnFinalizarSessao.disabled = true;
            }
            if (btnVoltar) {
                btnVoltar.style.display = "";
                btnVoltar.disabled = false;
            }
        } else {
            // Com sala selecionada, volta ao estado "normal";
            // o restante da lógica (sessão, tipo de evento etc.)
            // ajusta botões conforme necessário.
            if (btnLimpar) {
                btnLimpar.style.display = "";
                btnLimpar.disabled = false;
            }
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "";
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.disabled = false;
            }
            if (btnFinalizarSessao) {
                btnFinalizarSessao.style.display = "";
            }
            if (btnVoltar) {
                btnVoltar.style.display = "";
                btnVoltar.disabled = false;
            }
        }
    }

    function derivarSituacaoOperador(estado) {
        // Sem estado algum para essa sala
        if (!estado) return "sem_sessao";

        const entradasOperador = Array.isArray(estado.entradas_operador)
            ? estado.entradas_operador
            : [];

        const temSessao = !!estado.existe_sessao_aberta;

        // Nenhuma sessão aberta e nenhuma entrada do operador
        if (!temSessao && entradasOperador.length === 0) {
            return "sem_sessao";
        }

        // Sessão existe (ou há contexto de sessão), mas o operador ainda não registrou nada
        if (entradasOperador.length === 0) {
            return "sem_entrada";
        }

        // Operador com 1 ou 2+ entradas
        if (entradasOperador.length === 1) return "uma_entrada";
        return "duas_entradas";
    }

    function aplicarEstadoSessaoNaUI() {
        // 0) Sempre começar escondendo os botões de edição / cancelar
        if (btnEditarEntrada1) {
            btnEditarEntrada1.style.display = "none";
            btnEditarEntrada1.disabled = false;
        }
        if (btnEditarEntrada2) {
            btnEditarEntrada2.style.display = "none";
            btnEditarEntrada2.disabled = false;
        }
        if (btnCancelarEdicao) {
            btnCancelarEdicao.style.display = "none";
            btnCancelarEdicao.disabled = false;
        }

        // 1) Bloqueio base por sala (sem sala => tudo travado, só Voltar)
        if (typeof aplicarBloqueioPorSala === "function") {
            aplicarBloqueioPorSala();
        }

        // Se não houver sala selecionada, não segue com nada
        if (!salaSelect || !salaSelect.value) {
            estadoSessao = null;
            uiState.situacao_operador = "sem_sessao";
            uiState.sessaoAberta = false;
            atualizarCabecalhoOperadoresSessao();
            return;
        }

        const estado = estadoSessao;

        // 2) Reset básico de botões (estado neutro com sala escolhida)
        if (btnSalvarRegistro) {
            btnSalvarRegistro.style.display = "";
            btnSalvarRegistro.disabled = false;
            btnSalvarRegistro.textContent = "Salvar registro";
        }
        if (btnSalvarEdicao) {
            btnSalvarEdicao.style.display = "none";
            btnSalvarEdicao.disabled = false;
        }
        if (btnFinalizarSessao) {
            btnFinalizarSessao.style.display = "";
            btnFinalizarSessao.disabled = true;
        }

        // 3) Não há estado conhecido para essa sala ainda (não chamou /estado-sessao ou deu erro)
        if (!estado) {
            uiState.situacao_operador = "sem_sessao";
            uiState.sessaoAberta = false;

            atualizarTipoEventoUI();
            atualizarCabecalhoOperadoresSessao();
            return;
        }

        // 4) Deriva situação do operador e se a sessão está aberta
        const situacaoDerivada = derivarSituacaoOperador(estado);
        const sessaoAberta = !!estado.existe_sessao_aberta;

        uiState.situacao_operador = situacaoDerivada;
        uiState.sessaoAberta = sessaoAberta;

        const situacao = situacaoDerivada;

        // Rádios de tipo de evento sempre habilitados (demais regras dentro de atualizarTipoEventoUI)
        const radiosTipo = $$('input[name="tipo_evento"]');
        radiosTipo.forEach((r) => {
            r.disabled = false;
        });
        atualizarTipoEventoUI();

        // Habilita / desabilita botão de finalizar com base na existência de sessão
        if (btnFinalizarSessao) {
            btnFinalizarSessao.disabled = !sessaoAberta;
        }

        // === CASO 1: ainda NÃO existe sessão para esta sala ===
        // (sem sessão e sem entrada do operador)
        if (situacao === "sem_sessao") {
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "";
                btnSalvarRegistro.disabled = false;
                btnSalvarRegistro.textContent = "Salvar registro / Iniciar sessão";
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "none";
                btnSalvarEdicao.disabled = false;
            }
            if (btnFinalizarSessao) {
                btnFinalizarSessao.disabled = true;
            }

            atualizarCabecalhoOperadoresSessao();
            return;
        }

        // === CASO 2: já existe sessão para a sala, mas o operador ainda não tem entrada ===
        if (situacao === "sem_entrada") {
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "";
                btnSalvarRegistro.disabled = false;
                btnSalvarRegistro.textContent = "Salvar registro";
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "none";
                btnSalvarEdicao.disabled = false;
            }
            if (btnEditarEntrada1) {
                btnEditarEntrada1.style.display = "none";
            }
            if (btnEditarEntrada2) {
                btnEditarEntrada2.style.display = "none";
            }

            atualizarCabecalhoOperadoresSessao();
            return;
        }

        // === CASO 3: operador com 1ª entrada ===
        if (situacao === "uma_entrada") {
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "";
                btnSalvarRegistro.disabled = false;
                btnSalvarRegistro.textContent = "Novo registro (2ª entrada)";
            }

            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "none";
                btnSalvarEdicao.disabled = false;
            }

            if (btnEditarEntrada1) {
                btnEditarEntrada1.style.display = "";
                btnEditarEntrada1.disabled = false;
            }
            if (btnEditarEntrada2) {
                btnEditarEntrada2.style.display = "none";
            }

            atualizarCabecalhoOperadoresSessao();
            return;
        }

        // === CASO 4: operador com 2 entradas ===
        if (situacao === "duas_entradas") {
            aplicarModoOperadorComDuasEntradas();
            atualizarCabecalhoOperadoresSessao();
            return;
        }

        // Fallback de segurança (não deveria chegar aqui)
        atualizarCabecalhoOperadoresSessao();
    }

    function aplicarModoOperadorComDuasEntradas() {
        if (!form) return;

        // 1) Zera todos os campos (menos a sala) e deixa read-only/disabled
        const campos = form.querySelectorAll("input, textarea, select");
        campos.forEach((el) => {
            // Mantém apenas o seletor de sala livre
            if (el === salaSelect) return;

            // Limpa valor
            if (el.tagName === "SELECT") {
                el.value = "";
            } else if (el.type === "radio" || el.type === "checkbox") {
                el.checked = false;
            } else {
                el.value = "";
            }

            // Travar campo
            el.readOnly = true;
            el.disabled = true;
        });

        // Garante que a sala continua selecionável
        if (salaSelect) {
            salaSelect.disabled = false;
            salaSelect.readOnly = false;
        }

        // 2) Botões no estado "operador com 2 entradas":
        //    Só ficam: Voltar, Editar 1ª, Editar 2ª, Finalizar Registro da Sala/Operação

        if (typeof btnSalvarRegistro !== "undefined" && btnSalvarRegistro) {
            btnSalvarRegistro.style.display = "none";
        }
        if (typeof btnSalvarEdicao !== "undefined" && btnSalvarEdicao) {
            btnSalvarEdicao.style.display = "none";
        }
        if (typeof btnLimpar !== "undefined" && btnLimpar) {
            btnLimpar.style.display = "none";
        }
        if (typeof btnCancelarEdicao !== "undefined" && btnCancelarEdicao) {
            btnCancelarEdicao.style.display = "none";
        }

        // MOSTRAR botões de edição
        if (typeof btnEditarEntrada1 !== "undefined" && btnEditarEntrada1) {
            btnEditarEntrada1.style.display = "";
            btnEditarEntrada1.disabled = false;
        }
        if (typeof btnEditarEntrada2 !== "undefined" && btnEditarEntrada2) {
            btnEditarEntrada2.style.display = "";
            btnEditarEntrada2.disabled = false;
        }

        // Finalizar sessão continua disponível
        if (typeof btnFinalizarSessao !== "undefined" && btnFinalizarSessao) {
            btnFinalizarSessao.style.display = "";
            btnFinalizarSessao.disabled = false;
        }
    }

    function preencherFormularioComEntrada(entrada) {
        if (!entrada) return;

        // 1) Data da operação
        const inputData = document.querySelector('input[name="data_operacao"]');
        if (inputData) {
            const dataValor =
                (estadoSessao && estadoSessao.data) ||
                entrada.data_operacao ||
                "";
            if (dataValor) {
                inputData.value = dataValor;
            }
        }

        // 2) Campos diretos
        const mapDiretos = {
            horario_pauta: 'input[name="horario_pauta"]',
            nome_evento: 'input[name="nome_evento"]',
            usb_01: 'input[name="usb_01"]',
            usb_02: 'input[name="usb_02"]',
            observacoes: 'textarea[name="observacoes"]'
        };

        Object.entries(mapDiretos).forEach(([campo, seletor]) => {
            const el = document.querySelector(seletor);
            if (el && Object.prototype.hasOwnProperty.call(entrada, campo)) {
                el.value = entrada[campo] || "";
            }
        });

        // 3) Horários
        const inputHoraInicio = document.querySelector('input[name="hora_inicio"]');
        if (inputHoraInicio && "horario_inicio" in entrada) {
            inputHoraInicio.value = entrada.horario_inicio || "";
        }

        const inputHoraFim = document.querySelector('input[name="hora_fim"]');
        if (inputHoraFim && "horario_termino" in entrada) {
            inputHoraFim.value = entrada.horario_termino || "";
        }

        // 4) Tipo do Evento (rádios: operacao / cessao / outros)
        if (entrada.tipo_evento) {
            const radioTipo = document.querySelector(
                `input[name="tipo_evento"][value="${entrada.tipo_evento}"]`
            );
            if (radioTipo) {
                radioTipo.checked = true;
            }
        }

        // 5) Houve anormalidade? (sim / nao)
        if (typeof entrada.houve_anormalidade !== "undefined" && entrada.houve_anormalidade !== null) {
            const valorHouve = entrada.houve_anormalidade ? "sim" : "nao";
            const radioHouve = document.querySelector(
                `input[name="houve_anormalidade"][value="${valorHouve}"]`
            );
            if (radioHouve) {
                radioHouve.checked = true;
            }
        }

        // 6) Reaplica regras visuais de tipo de evento (anormalidade + Plenário)
        atualizarTipoEventoUI();
    }

    function entrarModoEdicaoEntrada(seq) {
        if (!estadoSessao || !Array.isArray(estadoSessao.entradas_operador)) {
            alert("Não foi possível localizar as entradas do operador nessa sessão.");
            return;
        }

        const entrada = estadoSessao.entradas_operador.find((e) => e.seq === seq);
        if (!entrada) {
            alert(`Não encontrei a ${seq}ª entrada para edição.`);
            return;
        }

        // Habilita campos para edição (mantendo a sala editável)
        if (form) {
            const campos = form.querySelectorAll("input, textarea, select");
            campos.forEach((el) => {
                if (el === salaSelect) return;
                el.disabled = false;
                if ("readOnly" in el) {
                    el.readOnly = false;
                }
            });
        }

        // Preenche o formulário com os dados da entrada
        preencherFormularioComEntrada(entrada);

        // Marca em qual entrada estamos editando (1ª ou 2ª)
        modoEdicaoEntradaSeq = seq;

        // Ajusta botões para modo edição: "Cancelar Edição", "Limpar", "Salvar Edição"
        if (typeof btnSalvarRegistro !== "undefined" && btnSalvarRegistro) {
            btnSalvarRegistro.style.display = "none";
        }
        if (typeof btnEditarEntrada1 !== "undefined" && btnEditarEntrada1) {
            btnEditarEntrada1.style.display = "none";
        }
        if (typeof btnEditarEntrada2 !== "undefined" && btnEditarEntrada2) {
            btnEditarEntrada2.style.display = "none";
        }
        if (typeof btnFinalizarSessao !== "undefined" && btnFinalizarSessao) {
            btnFinalizarSessao.style.display = "none";
        }

        if (typeof btnCancelarEdicao !== "undefined" && btnCancelarEdicao) {
            btnCancelarEdicao.style.display = "";
            btnCancelarEdicao.disabled = false;
        }

        if (typeof btnLimpar !== "undefined" && btnLimpar) {
            btnLimpar.style.display = "";
            btnLimpar.disabled = false;
        }

        if (typeof btnSalvarEdicao !== "undefined" && btnSalvarEdicao) {
            btnSalvarEdicao.style.display = "";
            btnSalvarEdicao.disabled = false;
            btnSalvarEdicao.textContent = "Salvar Edição";
        }

        atualizarCabecalhoOperadoresSessao();
    }

    function cancelarEdicaoEntrada() {
        // Sai do modo edição
        modoEdicaoEntradaSeq = null;

        // Limpa o formulário, mantendo sala/tipo, e volta para o estado padrão da sala
        resetFormMantendoSalaETipo();
        aplicarEstadoSessaoNaUI();
    }

    // ====== Salvar entrada (criação/edição) ======
    async function salvarEntrada(modo, opcoes) {
        opcoes = opcoes || {};
        const suprimirValidacaoHtml5 = !!opcoes.suprimirValidacaoHtml5;
        const suprimirAlertDeErro = !!opcoes.suprimirAlertDeErro;

        if (!form) return;
        if (!salaSelect || !salaSelect.value) {
            alert("Selecione uma sala antes de salvar o registro.");
            return;
        }

        // Validação HTML5
        if (!form.checkValidity()) {
            // Comportamento padrão: foca no primeiro campo inválido
            if (!suprimirValidacaoHtml5) {
                form.reportValidity();
            }
            // Em modo "silencioso" (usado pelo Finalizar), apenas aborta
            return;
        }

        const salaId = salaSelect.value;

        // Tipo do evento é sempre por ENTRADA, não mais “herdado” da sessão
        let tipoEvento = (getTipoEventoSelecionado() || "operacao").toLowerCase();

        const radioAnom = document.querySelector(
            'input[name="houve_anormalidade"]:checked'
        );
        const houveAnormalidadeRaw = radioAnom
            ? (radioAnom.value || "nao")
            : "nao";

        // Descobre o operador logado (via JWT / Auth)
        let operadorId = null;
        try {
            if (window.Auth && typeof Auth.loadUser === "function") {
                const me = Auth.loadUser();
                if (me && me.ok && me.user && me.user.id) {
                    operadorId = me.user.id;
                }
            }
        } catch (e) {
            console.error("Erro ao obter operador logado:", e);
        }

        if (!operadorId) {
            alert(
                "Não foi possível identificar o operador logado. " +
                "Tente fazer login novamente antes de salvar o registro."
            );
            return;
        }

        // Monta payload JSON
        const payload = {
            operador_id: operadorId,
            data_operacao: dataOperacaoInput ? dataOperacaoInput.value : "",
            horario_pauta: horarioPautaInput ? horarioPautaInput.value : "",
            hora_inicio: horaInicioInput ? horaInicioInput.value : "",
            hora_fim: horaFimInput ? horaFimInput.value : "",
            sala_id: salaId,
            nome_evento: nomeEventoInput ? nomeEventoInput.value : "",
            observacoes: observacoesInput ? observacoesInput.value : "",
            usb_01: usb01Input ? usb01Input.value : "",
            usb_02: usb02Input ? usb02Input.value : "",
            tipo_evento: tipoEvento,
            houve_anormalidade: houveAnormalidadeRaw
        };

        // Em modo edição, define qual entrada_id será editada
        if (modo === "edicao" && estadoSessao) {
            const entradasOperador = Array.isArray(estadoSessao.entradas_operador)
                ? estadoSessao.entradas_operador
                : [];

            if (!entradasOperador.length) {
                alert(
                    "Não há entradas deste operador para serem editadas nesta sessão."
                );
                return;
            }

            // BUG 4: remover o prompt antigo e usar o modoEdicaoEntradaSeq
            // para saber qual entrada está sendo editada.
            let entrada = null;

            if (modoEdicaoEntradaSeq === 1 || modoEdicaoEntradaSeq === 2) {
                entrada = entradasOperador.find((e) => e.seq === modoEdicaoEntradaSeq) || null;
            }

            // Fallback: se por algum motivo não estivermos com seq setado,
            // usa a primeira entrada do operador.
            if (!entrada) {
                entrada = entradasOperador[0];
            }

            const entradaId = entrada && entrada.entrada_id;
            if (!entradaId) {
                alert("Não foi possível determinar qual entrada editar.");
                return;
            }

            payload.entrada_id = String(entradaId);
        }

        // Desabilita botões durante o envio
        const btnPrincipal =
            modo === "edicao" ? (btnSalvarEdicao || btnSalvarRegistro) : btnSalvarRegistro;
        let originalText = btnPrincipal ? btnPrincipal.textContent : "";

        try {
            if (btnPrincipal) {
                btnPrincipal.disabled = true;
                btnPrincipal.textContent = "Salvando...";
            }

            let resp;
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            };

            if (window.Auth && typeof Auth.authFetch === "function") {
                resp = await Auth.authFetch(SALVAR_ENTRADA_URL, options);
            } else {
                resp = await fetch(SALVAR_ENTRADA_URL, options);
            }

            const json = await safeJson(resp);
            if (!resp.ok || !json || json.ok === false) {
                console.error("Erro ao salvar entrada:", json);

                if (!suprimirAlertDeErro) {
                    // Erros de validação vindos do back
                    if (json && json.errors && typeof json.errors === "object") {
                        const linhas = Object.entries(json.errors)
                            .map(([campo, msg]) => `${campo}: ${msg}`)
                            .join("\n");
                        alert("Erro ao salvar o registro:\n\n" + linhas);
                    } else {
                        const msg =
                            (json && (json.message || json.detail || json.error)) ||
                            "Falha ao salvar o registro.";
                        alert(msg);
                    }
                }
                return;
            }

            const registroId = json.registro_id;
            const houveAnomalia =
                json.houve_anormalidade === true || json.houve_anormalidade === "true";
            const tipoEventoEfetivo =
                (json.tipo_evento || tipoEvento || "operacao").toLowerCase();
            const isEdicao = !!json.is_edicao;

            let msgBase = isEdicao
                ? "Edição salva com sucesso."
                : "Registro salvo com sucesso.";
            if (houveAnomalia && tipoEventoEfetivo === "operacao") {
                msgBase +=
                    "\n\nEm seguida será aberto o formulário de Registro de Anormalidade.";
            }

            alert(msgBase);

            // Se houve anormalidade em Operação Comum, redireciona para o formulário de anormalidade
            if (houveAnomalia && tipoEventoEfetivo === "operacao" && registroId) {
                const urlAnom =
                    "/forms/operacao/anormalidade.html?registro_id=" +
                    encodeURIComponent(String(registroId));
                window.location.href = urlAnom;
                return;
            }

            // BUG 1 e BUG 5:
            // - Limpar o formulário após salvar (mantendo sala/tipo).
            // - Sair do modo edição para não ficar "grudado" o texto "Editando Xº Registro".
            modoEdicaoEntradaSeq = null;
            resetFormMantendoSalaETipo();

            // Caso contrário, recarrega o estado da sessão para refletir a nova situação
            await carregarEstadoSessao(salaId);
        } catch (e) {
            console.error("Erro inesperado ao salvar entrada de operação:", e);
            alert(
                "Erro inesperado ao salvar o registro de operação de áudio. Tente novamente."
            );
        } finally {
            if (btnPrincipal) {
                btnPrincipal.disabled = false;
                // btnPrincipal.textContent = originalText || "Salvar registro";
            }
        }
    }

    // ====== Finalizar sessão (POST /finalizar-sessao) ======
    async function finalizarSessao() {
        if (!salaSelect || !salaSelect.value) {
            alert("Selecione uma sala antes de finalizar o registro da operação.");
            return;
        }

        const salaId = salaSelect.value;

        // Sempre recarrega o estado da sessão para esta sala
        await carregarEstadoSessao(salaId);

        const sessaoAberta = !!(estadoSessao && estadoSessao.existe_sessao_aberta);

        let situacaoOperador = "sem_sessao";
        if (estadoSessao && estadoSessao.situacao_operador) {
            situacaoOperador = estadoSessao.situacao_operador;
        } else if (uiState && uiState.situacao_operador) {
            situacaoOperador = uiState.situacao_operador;
        }

        // Regra: só pode finalizar se houver sessão aberta
        // e o operador tiver pelo menos um registro
        if (!sessaoAberta || situacaoOperador === "sem_entrada") {
            alert("Somente usuários com registro nesta sala/operação podem finalizar.");
            return;
        }

        const payload = { sala_id: salaId };

        try {
            if (btnFinalizarSessao) {
                btnFinalizarSessao.disabled = true;
                btnFinalizarSessao.textContent = "Finalizando...";
            }

            let resp;
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            };

            if (window.Auth && typeof Auth.authFetch === "function") {
                resp = await Auth.authFetch(FINALIZAR_SESSAO_URL, options);
            } else {
                resp = await fetch(FINALIZAR_SESSAO_URL, options);
            }

            const json = await safeJson(resp);

            if (!resp.ok || !json || json.ok === false) {
                console.error("Erro ao finalizar sessão:", json);
                const msg =
                    (json && (json.message || json.detail || json.error)) ||
                    "Falha ao finalizar o registro da sala/operação.";
                alert(msg);
                return;
            }

            alert("Registro da Sala/Operação finalizado com sucesso.");

            // Depois de finalizar, voltamos para o estado "sem sala" selecionada
            // e preenchemos a data da operação com o dia atual.
            modoEdicaoEntradaSeq = null;

            // Limpa o formulário inteiro
            if (form) {
                form.reset();
            }

            // Volta o select de sala para "Selecione a sala"
            if (salaSelect) {
                salaSelect.value = "";
            }

            // Não há sessão carregada enquanto nenhuma sala estiver selecionada
            estadoSessao = null;
            uiState.situacao_operador = "sem_sessao";
            uiState.sessaoAberta = false;

            // Garante que a data exibida seja o dia atual
            ensureHojeEmDataOperacao();

            // Reaplica bloqueios / visuais para o estado "sem sala"
            aplicarEstadoSessaoNaUI();

        } catch (e) {
            console.error("Erro inesperado ao finalizar sessão:", e);
            alert("Erro inesperado ao finalizar a sessão.");
        } finally {
            if (btnFinalizarSessao) {
                btnFinalizarSessao.disabled = false;
                btnFinalizarSessao.textContent =
                    "Finalizar Registro da Sala/Operação";
            }
        }
    }

    // ====== Bootstrap ======
    document.addEventListener("DOMContentLoaded", async function () {
        // Referências de DOM
        form = document.getElementById("form-roa");

        salaSelect = document.getElementById("sala_id");
        dataOperacaoInput = document.getElementById("data_operacao");
        horarioPautaInput = document.getElementById("horario_pauta");
        horaInicioInput = document.getElementById("hora_inicio");
        horaFimInput = document.getElementById("hora_fim");
        nomeEventoInput = document.getElementById("nome_evento");
        usb01Input = document.getElementById("usb_01");
        usb02Input = document.getElementById("usb_02");
        observacoesInput = document.getElementById("observacoes");

        operador1Select = document.getElementById("operador_1");
        operador2Select = document.getElementById("operador_2");
        operador3Select = document.getElementById("operador_3");

        btnVoltar = document.getElementById("btnVoltar");
        btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
        btnLimpar = document.getElementById("btnLimpar");
        btnSalvarRegistro = document.getElementById("btnSalvarRegistro");
        btnSalvarEdicao = document.getElementById("btnSalvarEdicao");
        btnEditarEntrada1 = document.getElementById("btnEditarEntrada1");
        btnEditarEntrada2 = document.getElementById("btnEditarEntrada2");
        btnFinalizarSessao = document.getElementById("btnFinalizarSessao");

        sectionAnormalidade = document.getElementById("section-anormalidade");

        if (btnEditarEntrada1) {
            btnEditarEntrada1.addEventListener("click", () => {
                entrarModoEdicaoEntrada(1);
            });
        }

        if (btnEditarEntrada2) {
            btnEditarEntrada2.addEventListener("click", () => {
                entrarModoEdicaoEntrada(2);
            });
        }

        if (btnCancelarEdicao) {
            btnCancelarEdicao.addEventListener("click", () => {
                cancelarEdicaoEntrada();
            });
        }

        // Botão Voltar -> volta para a página anterior
        if (btnVoltar) {
            btnVoltar.addEventListener("click", function () {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = "/";
                }
            });
        }

        // Impede submit padrão; usamos apenas os botões customizados
        if (form) {
            form.addEventListener("submit", function (ev) {
                ev.preventDefault();
            });
        }

        // Data de hoje por padrão
        ensureHojeEmDataOperacao();

        // UI de operadores (linhas 2 e 3)
        setupOperatorsUI();

        // Tipo de evento / anormalidade
        bindTipoEventoLogic();

        // Carrega lookups (salas + operadores)
        await Promise.all([loadSalas(), loadOperadores()]);

        // Libera sala para escolha inicial
        if (salaSelect && !salaSelect.disabled) {
            salaSelect.disabled = false;
        }

        // Se vier sala_id na querystring, já seleciona e puxa o estado da sessão
        if (salaSelect) {
            const params = new URLSearchParams(window.location.search || "");
            const salaFromQuery = params.get("sala_id");
            if (salaFromQuery) {
                salaSelect.value = salaFromQuery;
            }

            salaSelect.addEventListener("change", function () {
                const val = salaSelect.value;

                // BUG 5: ao trocar de sala, sair do modo edição para não
                // "carregar" o texto "Editando Xº Registro" indevidamente.
                modoEdicaoEntradaSeq = null;

                if (!val) {
                    estadoSessao = null;
                    uiState.situacao_operador = "sem_sessao";
                    uiState.sessaoAberta = false;
                    aplicarEstadoSessaoNaUI();
                    return;
                }
                carregarEstadoSessao(val);
            });

            // Se já tiver algo pré-selecionado, já busca estado da sessão
            if (salaSelect.value) {
                await carregarEstadoSessao(salaSelect.value);
            } else {
                aplicarEstadoSessaoNaUI();
            }
        } else {
            aplicarEstadoSessaoNaUI();
        }

        // Botão Limpar: limpa o formulário, mas mantém sala/tipo
        if (btnLimpar && form) {
            btnLimpar.addEventListener("click", function () {
                resetFormMantendoSalaETipo();
            });
        }

        // Botões de salvar
        if (btnSalvarRegistro) {
            btnSalvarRegistro.addEventListener("click", function () {
                salvarEntrada("criacao");
            });
        }
        if (btnSalvarEdicao) {
            btnSalvarEdicao.addEventListener("click", function () {
                salvarEntrada("edicao");
            });
        }

        // Botão Finalizar
        if (btnFinalizarSessao) {
            btnFinalizarSessao.addEventListener("click", function () {
                finalizarSessao();
            });
        }
    });
})();
