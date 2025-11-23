// app/js/app/forms/operacao/index.js
// Front-end do formulário "Registro de Operação de Áudio"
// Agora integrado aos endpoints JSON de sessão de operação de áudio.

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
    let btnLimpar;
    let btnSalvarRegistro;
    let btnSalvarEdicao;
    let btnFinalizarSessao;

    let sectionAnormalidade;

    // ====== Estado em memória ======
    let estadoSessao = null;
    const uiState = {
        situacao_operador: null,   // "sem_sessao" | "sem_entrada" | "uma_entrada" | "duas_entradas"
        sessaoAberta: false,
    };

    // Atualiza o cabeçalho de operadores da sessão (acima do título)
    function atualizarCabecalhoOperadoresSessao() {
        const headerEl = document.getElementById("info-operadores-sessao");
        if (!headerEl) return;

        // Se não há estado carregado ou não há sessão aberta, esconde o cabeçalho
        if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
            headerEl.style.display = "none";
            headerEl.textContent = "";
            return;
        }

        // Preferência: usar entradas_sessao com a ordem real dos registros
        let entradas = Array.isArray(estadoSessao.entradas_sessao)
            ? estadoSessao.entradas_sessao.slice()
            : [];

        // Se não vierem entradas_sessao, cai no fallback usando nomes_operadores_sessao
        if (!entradas.length) {
            const nomesFallback = Array.isArray(estadoSessao.nomes_operadores_sessao)
                ? estadoSessao.nomes_operadores_sessao
                : [];

            if (!nomesFallback.length) {
                headerEl.style.display = "none";
                headerEl.textContent = "";
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
    }


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
            // valueAsDate funciona bem na maioria dos browsers modernos
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
            // Libera seleção (o estado da sessão depois pode travar de novo)
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

    // ====== UI: Tipo de Evento / Anormalidade / Sala Plenário ======
    function atualizarTipoEventoUI() {
        if (!sectionAnormalidade) return;

        const tipoSelecionado = getTipoEventoSelecionado();
        const tipoSessao = estadoSessao && estadoSessao.tipo_evento;
        const tipoEfetivo = (tipoSessao || tipoSelecionado || "operacao").toLowerCase();

        // Sessão aberta? (usado tanto para anormalidade quanto para regra do Plenário)
        const sessaoAberta =
            !!(estadoSessao && estadoSessao.existe_sessao_aberta);

        // Regra de anormalidade:
        // - Se houver sessão aberta, respeita o que o back mandar em permite_anormalidade.
        // - Se NÃO houver sessão aberta, depende só do tipo selecionado na tela
        //   (apenas "operacao" mostra o bloco).
        let permiteAnom;
        if (
            sessaoAberta &&
            estadoSessao &&
            typeof estadoSessao.permite_anormalidade === "boolean"
        ) {
            permiteAnom = estadoSessao.permite_anormalidade;
        } else {
            permiteAnom = tipoEfetivo === "operacao";
        }

        // Mostra/esconde bloco de anormalidade
        if (permiteAnom) {
            sectionAnormalidade.style.display = "";
        } else {
            sectionAnormalidade.style.display = "none";
            const radioNao = document.querySelector(
                'input[name="houve_anormalidade"][value="nao"]'
            );
            if (radioNao) radioNao.checked = true;
        }

        // Regra especial: "Outros Eventos" => sala obrigatoriamente Plenário
        if (!salaSelect) return;

        if (tipoEfetivo === "outros" && !sessaoAberta) {
            // Tenta achar qualquer opção cujo texto contenha "plenário"
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
            salaSelect.disabled = true;
        } else {
            // Só reabilita se não houver sessão aberta travando a sala
            if (!sessaoAberta) {
                salaSelect.disabled = false;
            }
        }
    }

    function atualizarCabecalhoSessao(ctx) {
        var textos = [];

        if (!ctx || !ctx.existe_sessao_aberta) {
            textos.push(
                "<strong>Nenhuma sessão aberta para esta sala.</strong> Ao salvar, você irá iniciar o registro desta operação."
            );
        } else {
            // ==== Parte 1: Cabeçalho com operadores em ordem cronológica ====
            var entradas = ctx.entradas_sessao || [];
            if (entradas.length > 0) {
                // Garante ordenação por ordem (e depois pelo id, como fallback)
                entradas = entradas
                    .slice()
                    .sort(function (a, b) {
                        var oa =
                            typeof a.ordem === "number" ? a.ordem : parseInt(a.ordem || 9999, 10);
                        var ob =
                            typeof b.ordem === "number" ? b.ordem : parseInt(b.ordem || 9999, 10);
                        if (oa !== ob) return oa - ob;
                        var ea = a.entrada_id || a.id || 0;
                        var eb = b.entrada_id || b.id || 0;
                        return ea - eb;
                    });

                // 1ª linha: Registro aberto por <Nome 1>
                var primeira = entradas[0];
                var nomePrimeiro = primeira.operador_nome || "—";
                textos.push(
                    "<strong>Registro aberto por " + nomePrimeiro + ".</strong>"
                );

                // Demais linhas: sempre dois registros por linha
                if (entradas.length > 1) {
                    var ordinais = {
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

                    var descricoes = [];
                    for (var i = 1; i < entradas.length; i++) {
                        var entrada = entradas[i];
                        var posicao = i + 1; // 2, 3, 4...
                        var prefixo = ordinais[posicao] || posicao + "º";
                        var nome = entrada.operador_nome || "—";
                        descricoes.push(prefixo + " registro feito por " + nome);
                    }

                    // Monta linhas com no máximo 2 descrições por linha
                    for (var j = 0; j < descricoes.length; j += 2) {
                        if (j + 1 < descricoes.length) {
                            textos.push(descricoes[j] + " • " + descricoes[j + 1]);
                        } else {
                            textos.push(descricoes[j]);
                        }
                    }
                }
            } else {
                // Fallback: se, por algum motivo, não vierem as entradas
                var nomes = ctx.nomes_operadores_sessao || [];
                if (nomes.length) {
                    textos.push(
                        "<strong>Sessão aberta para esta sala.</strong> Operadores na sessão: " +
                        nomes.join(", ")
                    );
                } else {
                    textos.push("<strong>Sessão aberta para esta sala.</strong>");
                }
            }

            // ==== Parte 2: Situação do operador nessa sessão ====
            var situ = ctx.situacao_operador || "sem_entrada";
            if (situ === "sem_entrada") {
                textos.push("Você ainda não registrou nenhuma entrada nesta sessão.");
            } else if (situ === "uma_entrada") {
                textos.push("Você já possui <strong>1 entrada</strong> nesta sessão.");
            } else if (situ === "duas_entradas") {
                textos.push(
                    "Você já possui <strong>2 entradas</strong> nesta sessão (limite máximo)."
                );
            }
        }

        // ==== Parte 3: Resumo do tipo de evento / data / nome ====
        if (ctx && ctx.tipo_evento) {
            var tipoLabel;
            if (ctx.tipo_evento === "operacao") tipoLabel = "Operação Comum";
            else if (ctx.tipo_evento === "cessao") tipoLabel = "Cessão de Sala";
            else tipoLabel = "Outros Eventos";
            textos.push("Tipo do evento: <strong>" + tipoLabel + "</strong>.");
        }

        if (ctx && ctx.data) {
            textos.push("Data da operação: <strong>" + ctx.data + "</strong>.");
        }
        if (ctx && ctx.nome_evento) {
            textos.push("Evento: <strong>" + ctx.nome_evento + "</strong>.");
        }

        // Quebra em várias linhas, como na especificação do cabeçalho
        setHeaderText(textos.join("<br>"));
    }

    function bindTipoEventoLogic() {
        const radios = $$('input[name="tipo_evento"]');
        radios.forEach((r) => {
            r.addEventListener("change", function () {
                atualizarTipoEventoUI();
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

        // 1) Campos: tudo visível, mas read-only sem sala
        const campos = form.querySelectorAll("input, select, textarea");
        campos.forEach((el) => {
            // A sala nunca é desabilitada aqui
            if (el === salaSelect) {
                el.disabled = false;
                return;
            }

            // Sem sala -> desabilita; com sala -> libera
            el.disabled = !temSala;
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
                // a lógica de sessão ainda pode mudar texto/habilitação
            }
            if (btnSalvarEdicao) {
                // visibilidade/habilitação fina fica com aplicarEstadoSessaoNaUI
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

    function aplicarEstadoSessaoNaUI() {
        // Garante bloqueio/desbloqueio das seções conforme a sala
        aplicarBloqueioPorSala();

        const estado = estadoSessao;
        // Reset básico de botões
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
            btnFinalizarSessao.disabled = true;
        }

        // Não há sessão conhecida para essa sala
        if (!estado) {
            uiState.situacao_operador = "sem_sessao";
            uiState.sessaoAberta = false;

            // Sala ainda livre, tipo de evento livre
            if (salaSelect) salaSelect.disabled = false;

            // Mantemos data/hora/evento como estiverem no formulário (usuário vai preencher)
            atualizarTipoEventoUI();
            return;
        }

        uiState.sessaoAberta = !!estado.existe_sessao_aberta;
        uiState.situacao_operador = estado.situacao_operador || "sem_sessao";

        const sessaoAberta = uiState.sessaoAberta;

        // Preenche cabeçalho, se disponível
        if (dataOperacaoInput && estado.data) {
            dataOperacaoInput.value = estado.data;
        }
        if (horarioPautaInput && estado.horario_pauta) {
            horarioPautaInput.value = estado.horario_pauta;
        }
        if (horaInicioInput && estado.horario_inicio) {
            horaInicioInput.value = estado.horario_inicio;
        }
        if (horaFimInput && estado.horario_termino) {
            horaFimInput.value = estado.horario_termino;
        }
        if (nomeEventoInput && estado.nome_evento) {
            nomeEventoInput.value = estado.nome_evento;
        }

        // Tipo do evento da sessão (se já existir, fica travado)
        if (estado.tipo_evento) {
            setTipoEventoSelecionado(estado.tipo_evento);
        }
        const radiosTipo = $$('input[name="tipo_evento"]');
        radiosTipo.forEach((r) => {
            r.disabled = !!estado.tipo_evento; // se o tipo já foi definido, não permite alterar
        });

        // Sala fica travada se há sessão aberta
        if (salaSelect) {
            if (sessaoAberta) {
                salaSelect.disabled = true;
            } else {
                // se não estiver em sessão aberta, respeita apenas a lógica do tipo de evento
                salaSelect.disabled = false;
            }
        }

        // Anormalidade / tipo evento / regra de sala Plenário
        atualizarTipoEventoUI();

        // Controle dos botões conforme situação do operador
        const situacao = uiState.situacao_operador;
        const entradasOperador = Array.isArray(estado.entradas_operador)
            ? estado.entradas_operador
            : [];

        // Se há sessão, já podemos habilitar botão de finalizar
        if (btnFinalizarSessao && sessaoAberta) {
            btnFinalizarSessao.disabled = false;
        }

        if (!sessaoAberta) {
            // Ainda não existe sessão aberta para essa sala
            // -> Operador A chegando no Caso A (vai inaugurar a sessão)
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "";
                btnSalvarRegistro.textContent = "Salvar registro / Iniciar sessão";
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "none";
            }
            // Botão de finalizar só faz sentido depois de abrir
            if (btnFinalizarSessao) {
                btnFinalizarSessao.disabled = true;
            }
            return;
        }

        // Há sessão aberta:
        if (situacao === "sem_entrada") {
            // Operador B no Caso B – ainda não lançou nada
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "";
                btnSalvarRegistro.textContent = "Salvar registro";
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "none";
            }
        } else if (situacao === "uma_entrada") {
            // Operador C no Caso C – 1 entrada existente
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "";
                btnSalvarRegistro.textContent = "Novo registro (2ª entrada)";
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "";
                btnSalvarEdicao.textContent = "Salvar edição da 1ª entrada";
            }
        } else if (situacao === "duas_entradas") {
            // Operador D no Caso D – 2 entradas existentes; não há novo registro
            if (btnSalvarRegistro) {
                btnSalvarRegistro.style.display = "none";
            }
            if (btnSalvarEdicao) {
                btnSalvarEdicao.style.display = "";
                btnSalvarEdicao.textContent =
                    "Salvar edição (escolher 1ª ou 2ª entrada)";
            }
        }
        // Atualiza o cabeçalho com os operadores da sessão
        atualizarCabecalhoOperadoresSessao();

    }

    // ====== Salvar entrada (criação/edição) ======
    async function salvarEntrada(modo) {
        if (!form) return;
        if (!salaSelect || !salaSelect.value) {
            alert("Selecione uma sala antes de salvar o registro.");
            return;
        }

        // Validação HTML5
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const salaId = salaSelect.value;

        let tipoEvento = getTipoEventoSelecionado();
        if (estadoSessao && estadoSessao.tipo_evento) {
            // Em sessão já aberta, vale o tipo do back
            tipoEvento = (estadoSessao.tipo_evento || tipoEvento || "operacao").toLowerCase();
        }

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

            let entradaId = null;

            if (entradasOperador.length === 1) {
                entradaId = entradasOperador[0].entrada_id;
            } else {
                const escolha = window.prompt(
                    "Você possui 2 entradas nesta sessão.\nDigite 1 para editar a 1ª entrada ou 2 para editar a 2ª:"
                );
                const idx = escolha === "1" ? 0 : 1;
                const entrada = entradasOperador[idx] || entradasOperador[0];
                entradaId = entrada.entrada_id;
            }

            if (!entradaId) {
                alert("Não foi possível determinar qual entrada editar.");
                return;
            }

            payload.entrada_id = String(entradaId);
        }

        // Desabilita botões durante o envio
        const btnPrincipal =
            modo === "edicao" ? btnSalvarEdicao || btnSalvarRegistro : btnSalvarRegistro;
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
                btnPrincipal.textContent = originalText || "Salvar registro";
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

        // Garante que temos um estado atualizado da sessão para esta sala
        if (!estadoSessao) {
            await carregarEstadoSessao(salaId);
        }

        const sessaoAbertaAntes =
            !!(estadoSessao && estadoSessao.existe_sessao_aberta);
        let situacaoAntes = "sem_sessao";

        if (estadoSessao && estadoSessao.situacao_operador) {
            situacaoAntes = estadoSessao.situacao_operador;
        } else if (uiState && uiState.situacao_operador) {
            situacaoAntes = uiState.situacao_operador;
        }

        const confirmar = window.confirm(
            "Tem certeza de que deseja finalizar o Registro da Sala/Operação?\n" +
            "Após finalizado, não será possível lançar novos registros nesta sessão."
        );
        if (!confirmar) {
            return;
        }

        // Regra importante:
        // - Se NÃO há sessão aberta ainda (sem_sessao),
        // - ou se o operador ainda não tem nenhuma entrada (sem_entrada),
        // então "Finalizar" precisa PRIMEIRO salvar a entrada atual (criar a entrada)
        // e SÓ DEPOIS encerrar a sessão.
        if (!sessaoAbertaAntes || situacaoAntes === "sem_entrada") {
            // Tenta salvar a entrada atual como criação de nova entrada.
            await salvarEntrada("criacao");

            // Recarrega o estado para ver se a entrada foi realmente salva
            // e se a sessão foi criada/atualizada.
            await carregarEstadoSessao(salaId);

            const sessaoAbertaDepois =
                !!(estadoSessao && estadoSessao.existe_sessao_aberta);
            let situacaoDepois = "sem_sessao";

            if (estadoSessao && estadoSessao.situacao_operador) {
                situacaoDepois = estadoSessao.situacao_operador;
            } else if (uiState && uiState.situacao_operador) {
                situacaoDepois = uiState.situacao_operador;
            }

            // Se mesmo depois de tentar salvar continuamos sem sessão aberta
            // ou sem nenhuma entrada do operador, não faz sentido finalizar.
            if (!sessaoAbertaDepois || situacaoDepois === "sem_entrada") {
                alert(
                    "Não foi possível salvar sua entrada antes de finalizar a sessão.\n" +
                    "Verifique os erros exibidos no salvamento e tente novamente."
                );
                return;
            }
        }

        // A partir daqui, já deve haver sessão aberta para esta sala.
        if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
            alert("Não há sessão aberta nesta sala para ser finalizada.");
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

                if (json && json.errors && typeof json.errors === "object") {
                    const linhas = Object.entries(json.errors)
                        .map(([campo, msg]) => `${campo}: ${msg}`)
                        .join("\n");
                    alert("Erro ao finalizar a sessão:\n\n" + linhas);
                } else {
                    const msg =
                        (json && (json.message || json.detail || json.error)) ||
                        "Falha ao finalizar a sessão de operação de áudio.";
                    alert(msg);
                }
                return;
            }

            alert("Registro da Sala/Operação finalizado com sucesso.");
            // Depois de finalizar, recarrega o estado da sessão (que agora deve vir como "sem sessão")
            await carregarEstadoSessao(salaId);
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

        btnVoltar = document.getElementById("btn-voltar");
        btnLimpar = document.getElementById("btn-limpar");
        btnSalvarRegistro = document.getElementById("btn-salvar-registro");
        btnSalvarEdicao = document.getElementById("btn-salvar-edicao");
        btnFinalizarSessao = document.getElementById("btn-finalizar-sessao");

        sectionAnormalidade = document.getElementById("section-anormalidade");

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

        // Libera sala para escolha inicial (regras de sessão e tipo-evento podem travar depois)
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

        // Botão Limpar: apenas limpa o formulário, mas mantém sala/tipo-evento
        if (btnLimpar && form) {
            btnLimpar.addEventListener("click", function () {
                const salaValue = salaSelect ? salaSelect.value : "";
                const tipoValor = getTipoEventoSelecionado();

                form.reset();

                if (salaSelect) salaSelect.value = salaValue;
                setTipoEventoSelecionado(tipoValor);

                ensureHojeEmDataOperacao();
                atualizarTipoEventoUI();
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