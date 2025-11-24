// app/js/app/forms/operacao/index.js
(function () {
    "use strict";

    // ====== Helpers & Constantes ======
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));
    const els = {}; // Cache de elementos DOM

    const ORDINAIS = [null, "Primeiro", "Segundo", "Terceiro", "Quarto", "Quinto", "Sexto", "Sétimo", "Oitavo", "Nono", "Décimo"];

    // Wrapper Centralizado de API (Auth, Fetch, Erros e JSON)
    async function apiCall(url, method = "GET", body = null) {
        try {
            const options = { method, headers: { "Content-Type": "application/json" } };
            if (body) options.body = JSON.stringify(body);

            const fetchFn = (window.Auth && typeof Auth.authFetch === "function") ? Auth.authFetch : fetch;
            const resp = await fetchFn(url, options);
            const json = await resp.json().catch(() => null);

            if (!resp.ok || !json || json.ok === false) {
                // Tratamento de erros (401, validação, lógica)
                if (resp.status === 401 || resp.status === 403) alert("Sessão expirada. Faça login novamente.");
                else if (json && json.errors) {
                    const msg = Object.entries(json.errors).map(([k, v]) => `${k}: ${v}`).join("\n");
                    alert("Erro de validação:\n" + msg);
                } else {
                    alert((json && (json.message || json.detail || json.error)) || "Erro na requisição.");
                }
                return { ok: false, error: json };
            }
            return { ok: true, data: json.data, ...json };
        } catch (e) {
            console.error("Erro API:", e);
            alert("Erro inesperado: " + e.message);
            return { ok: false };
        }
    }

    // ====== Config ======
    const URLS = {
        salas: AppConfig.apiUrl(AppConfig.endpoints.lookups.salas),
        operadores: AppConfig.apiUrl(AppConfig.endpoints.lookups.operadores),
        estado: AppConfig.apiUrl(AppConfig.endpoints.operacaoAudio.estadoSessao),
        salvar: AppConfig.apiUrl(AppConfig.endpoints.operacaoAudio.salvarEntrada),
        finalizar: AppConfig.apiUrl(AppConfig.endpoints.operacaoAudio.finalizarSessao)
    };

    // ====== State ======
    let estadoSessao = null;
    let modoEdicaoEntradaSeq = null; // 1 ou 2
    const uiState = { situacao_operador: "sem_sessao", sessaoAberta: false };

    // ====== Lógica UI: Cabeçalho e Indicadores ======
    function atualizarCabecalho() {
        // 1. Indicador de Edição (Canto direito)
        const modoEl = $("#info-modo-edicao");
        if (modoEl) {
            modoEl.style.display = (uiState.sessaoAberta && modoEdicaoEntradaSeq) ? "" : "none";
            modoEl.textContent = modoEdicaoEntradaSeq ? `Editando ${modoEdicaoEntradaSeq}º Registro` : "";
        }

        // 2. Lista de Operadores (Topo)
        const headerEl = $("#info-operadores-sessao");
        if (!headerEl) return;

        if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
            headerEl.style.display = "none"; return;
        }

        // Unifica entradas reais vs fallback de nomes
        let items = [];
        if (estadoSessao.entradas_sessao?.length) {
            items = [...estadoSessao.entradas_sessao].sort((a, b) =>
                (parseInt(a.ordem || a.seq || 0) - parseInt(b.ordem || b.seq || 0)) || ((a.id || 0) - (b.id || 0))
            );
        } else if (estadoSessao.nomes_operadores_sessao?.length) {
            items = estadoSessao.nomes_operadores_sessao.map(nome => ({ operador_nome: nome }));
        } else {
            headerEl.style.display = "none"; return;
        }

        const linhas = [];
        linhas.push(`Registro aberto por ${items[0].operador_nome || "—"}.`);

        const descricoes = [];
        for (let i = 1; i < items.length; i++) {
            const prefixo = ORDINAIS[i + 1] || (i + 1) + "º";
            descricoes.push(`${prefixo} registro feito por ${items[i].operador_nome || "—"}`);
        }

        for (let j = 0; j < descricoes.length; j += 2) {
            linhas.push(descricoes.slice(j, j + 2).join(" • "));
        }

        headerEl.innerHTML = linhas.join("<br>");
        headerEl.style.display = "";
    }

    // ====== Lógica UI: Formulário e Botões ======
    function getTipoEvento() {
        return ($('input[name="tipo_evento"]:checked')?.value || "operacao").toLowerCase();
    }

    function atualizarTipoEventoUI() {
        const tipo = getTipoEvento();

        // Anormalidade
        if (els.sectionAnormalidade) {
            els.sectionAnormalidade.style.display = (tipo === "operacao") ? "" : "none";
            if (tipo !== "operacao") {
                const rNao = $('input[name="houve_anormalidade"][value="nao"]');
                if (rNao) rNao.checked = true;
            }
        }

        // Regra: "Outros Eventos" força Sala = Plenário
        if (!els.salaSelect) return;
        if (tipo === "outros") {
            if (!els.salaSelect.dataset.original) els.salaSelect.dataset.original = els.salaSelect.value || "";
            const plenOpt = Array.from(els.salaSelect.options).find(o => /plen[áa]rio/i.test(o.text));
            if (plenOpt) els.salaSelect.value = plenOpt.value;
            els.salaSelect.disabled = true;
        } else {
            // Restaura seleção anterior
            if (els.salaSelect.dataset.original !== undefined) {
                // Só restaura se a opção ainda existe e não foi alterada manualmente
                if (els.salaSelect.disabled) els.salaSelect.value = els.salaSelect.dataset.original;
                delete els.salaSelect.dataset.original;
            }
            // Se não tiver sessão bloqueando, libera
            if (els.salaSelect.value) els.salaSelect.disabled = false;
        }
    }

    function toggleFormInputs(habilitar, manterSala = true) {
        els.form.querySelectorAll("input, select, textarea").forEach(el => {
            if (manterSala && el === els.salaSelect) return;
            el.disabled = !habilitar;
            el.readOnly = !habilitar;
        });
    }

    function aplicarEstadoNaUI() {
        // Reset Visibilidade Botões
        const btns = [els.btnSalvarRegistro, els.btnSalvarEdicao, els.btnEditar1, els.btnEditar2, els.btnFinalizar, els.btnLimpar, els.btnCancelarEdicao];
        btns.forEach(b => b && (b.style.display = "none"));

        if (!els.salaSelect.value) {
            toggleFormInputs(false, true); // Bloqueia tudo menos sala
            if (els.btnVoltar) els.btnVoltar.disabled = false;
            atualizarCabecalho();
            return;
        }

        // Tem sala: processa estado
        const situacao = uiState.situacao_operador;
        const sessaoAberta = uiState.sessaoAberta;

        // Regra Base: libera form se não estiver no "limbo" de 2 entradas
        if (situacao !== "duas_entradas" && !modoEdicaoEntradaSeq) {
            toggleFormInputs(true, true);
        }

        atualizarTipoEventoUI(); // Reaplica travas de Plenário se necessário

        // Botões Comuns
        if (els.btnVoltar) els.btnVoltar.disabled = false;
        if (els.btnFinalizar) {
            els.btnFinalizar.style.display = "";
            els.btnFinalizar.disabled = !sessaoAberta; // Habilita se tiver sessão
        }

        // Modo Edição Ativo?
        if (modoEdicaoEntradaSeq) {
            if (els.btnSalvarEdicao) els.btnSalvarEdicao.style.display = "";
            if (els.btnLimpar) els.btnLimpar.style.display = "";
            if (els.btnCancelarEdicao) els.btnCancelarEdicao.style.display = "";
            if (els.btnFinalizar) els.btnFinalizar.style.display = "none"; // Esconde finalizar editando
            atualizarCabecalho();
            return;
        }

        // Modos Normais
        if (!sessaoAberta || situacao === "sem_entrada") {
            // Criar nova sessão ou 1ª entrada
            if (els.btnSalvarRegistro) {
                els.btnSalvarRegistro.style.display = "";
                els.btnSalvarRegistro.textContent = !sessaoAberta ? "Salvar registro / Iniciar sessão" : "Salvar registro";
            }
            if (els.btnLimpar) els.btnLimpar.style.display = "";

        } else if (situacao === "uma_entrada") {
            // Pode criar 2ª ou editar 1ª
            if (els.btnSalvarRegistro) {
                els.btnSalvarRegistro.style.display = "";
                els.btnSalvarRegistro.textContent = "Novo registro (2ª entrada)";
            }
            if (els.btnEditar1) els.btnEditar1.style.display = "";
            if (els.btnLimpar) els.btnLimpar.style.display = "";

        } else if (situacao === "duas_entradas") {
            // Bloqueado, só edita ou finaliza
            toggleFormInputs(false, true);
            if (els.btnEditar1) els.btnEditar1.style.display = "";
            if (els.btnEditar2) els.btnEditar2.style.display = "";
        }

        atualizarCabecalho();
    }

    // ====== Actions: Carregar Dados ======
    async function carregarEstadoSessao(salaId) {
        if (!salaId) {
            estadoSessao = null;
            uiState.situacao_operador = "sem_sessao";
            uiState.sessaoAberta = false;
        } else {
            const res = await apiCall(`${URLS.estado}?sala_id=${encodeURIComponent(salaId)}`);
            if (res.ok) {
                estadoSessao = res.data;
                uiState.sessaoAberta = !!estadoSessao.existe_sessao_aberta;
                uiState.situacao_operador = estadoSessao.situacao_operador || "sem_sessao";
            } else {
                // Erro já tratado no apiCall, reseta estado
                estadoSessao = null;
                uiState.situacao_operador = "sem_sessao";
            }
        }
        aplicarEstadoNaUI();
    }

    async function initLookups() {
        // Salas
        if (els.salaSelect) {
            const res = await apiCall(URLS.salas);
            if (res.ok) {
                els.salaSelect.innerHTML = '<option value="">Selecione a sala</option>' +
                    res.data.map(r => `<option value="${r.id}">${r.nome}</option>`).join("");
            }
        }
        // Operadores
        const ops = [$("#operador_1"), $("#operador_2"), $("#operador_3")].filter(Boolean);
        if (ops.length) {
            const res = await apiCall(URLS.operadores);
            if (res.ok) {
                const html = '<option value="">Selecione o operador</option>' +
                    res.data.map(r => `<option value="${r.id}">${r.nome_completo}</option>`).join("");
                ops.forEach(sel => sel.innerHTML = html);
            }
        }
    }

    // ====== Actions: Edição ======
    function entrarModoEdicao(seq) {
        const entrada = estadoSessao?.entradas_operador?.find(e => e.seq === seq);
        if (!entrada) return alert("Entrada não encontrada.");

        modoEdicaoEntradaSeq = seq;
        toggleFormInputs(true, true);

        // Preenchimento
        const map = {
            horario_pauta: entrada.horario_pauta,
            nome_evento: entrada.nome_evento,
            observacoes: entrada.observacoes,
            usb_01: entrada.usb_01, usb_02: entrada.usb_02,
            hora_inicio: entrada.horario_inicio, hora_fim: entrada.horario_termino
        };
        Object.keys(map).forEach(k => { if (els.form.elements[k]) els.form.elements[k].value = map[k] || ""; });

        // Data (vem da sessão ou da entrada)
        const dt = entrada.data_operacao || estadoSessao.data;
        if (dt && els.form.elements['data_operacao']) els.form.elements['data_operacao'].value = dt;

        // Radios
        if (entrada.tipo_evento) {
            const r = $(`input[name="tipo_evento"][value="${entrada.tipo_evento}"]`);
            if (r) r.checked = true;
        }
        const rAnom = $(`input[name="houve_anormalidade"][value="${entrada.houve_anormalidade ? 'sim' : 'nao'}"]`);
        if (rAnom) rAnom.checked = true;

        aplicarEstadoNaUI();
    }

    // ====== Actions: Salvar ======
    async function salvarAcao(modo) { // 'criacao' | 'edicao'
        if (!els.form.checkValidity()) return els.form.reportValidity();
        if (!els.salaSelect.value) return alert("Selecione uma sala.");

        const user = Auth.loadUser?.()?.user;
        if (!user?.id) return alert("Operador não identificado. Faça login.");

        const payload = {
            sala_id: els.salaSelect.value,
            operador_id: user.id,
            tipo_evento: getTipoEvento(),
            houve_anormalidade: $('input[name="houve_anormalidade"]:checked')?.value || "nao",
            // Captura campos de texto
            ...['data_operacao', 'horario_pauta', 'hora_inicio', 'hora_fim', 'nome_evento', 'observacoes', 'usb_01', 'usb_02']
                .reduce((acc, k) => ({ ...acc, [k]: els.form.elements[k]?.value || "" }), {})
        };

        // Lógica de ID para edição
        if (modo === "edicao") {
            let entradaId = null;
            if (modoEdicaoEntradaSeq) {
                entradaId = estadoSessao?.entradas_operador?.find(e => e.seq === modoEdicaoEntradaSeq)?.entrada_id;
            } else if (estadoSessao?.entradas_operador?.length === 1) {
                entradaId = estadoSessao.entradas_operador[0].entrada_id;
            } else {
                // Caso raro: clicou em salvar edição sem estar no modo explícito e tem 2 entradas (defensivo)
                const esc = prompt("Editar qual entrada? (1 ou 2)");
                entradaId = estadoSessao?.entradas_operador?.find(e => e.seq == esc)?.entrada_id;
            }
            if (!entradaId) return alert("Entrada para edição não identificada.");
            payload.entrada_id = String(entradaId);
        }

        // UI Feedback
        const btn = modo === "edicao" ? els.btnSalvarEdicao : els.btnSalvarRegistro;
        if (btn) { btn.disabled = true; btn.textContent = "Salvando..."; }

        const res = await apiCall(URLS.salvar, "POST", payload);

        if (btn) { btn.disabled = false; btn.textContent = (modo === "edicao" ? "Salvar Edição" : "Salvar registro"); }

        if (res.ok) {
            if (modo === "edicao") modoEdicaoEntradaSeq = null; // Sai do modo edição

            const houveAnom = (res.houve_anormalidade === true || res.houve_anormalidade === "true");
            if (houveAnom && payload.tipo_evento === "operacao") {
                alert("Salvo. Redirecionando para Anormalidade.");
                window.location.href = `/forms/operacao/anormalidade.html?registro_id=${res.registro_id}`;
            } else {
                alert("Salvo com sucesso.");
                await carregarEstadoSessao(els.salaSelect.value); // Recarrega UI
            }
            return true; // Sucesso
        }
        return false;
    }

    async function finalizarSessaoAcao() {
        const salaId = els.salaSelect.value;
        if (!salaId) return alert("Selecione a sala.");
        if (!estadoSessao) await carregarEstadoSessao(salaId);

        if (!confirm("Deseja finalizar o Registro da Sala?")) return;

        // AUTO-SAVE: Se não tem sessão ou não tem entrada, salva primeiro
        const situacao = uiState.situacao_operador;
        if (!uiState.sessaoAberta || situacao === "sem_entrada") {
            const salvo = await salvarAcao("criacao");
            if (!salvo) return; // Erro no save, aborta finalizar
            // Se salvou, o estado foi recarregado no salvarAcao, verificamos de novo
            if (!estadoSessao?.existe_sessao_aberta) return alert("Erro ao abrir sessão antes de finalizar.");
        }

        els.btnFinalizar.disabled = true;
        els.btnFinalizar.textContent = "Finalizando...";

        const res = await apiCall(URLS.finalizar, "POST", { sala_id: salaId });

        els.btnFinalizar.disabled = false;
        els.btnFinalizar.textContent = "Finalizar Registro da Sala/Operação";

        if (res.ok) {
            alert("Sessão finalizada.");
            carregarEstadoSessao(salaId);
        }
    }

    // ====== Setup ======
    document.addEventListener("DOMContentLoaded", async () => {
        // Cache Elements
        els.form = $("#form-roa");
        els.salaSelect = $("#sala_id");
        els.sectionAnormalidade = $("#section-anormalidade");

        // Buttons Map
        els.btnVoltar = $("#btnVoltar");
        els.btnLimpar = $("#btnLimpar");
        els.btnSalvarRegistro = $("#btnSalvarRegistro");
        els.btnSalvarEdicao = $("#btnSalvarEdicao");
        els.btnFinalizar = $("#btnFinalizarSessao");
        els.btnEditar1 = $("#btnEditarEntrada1");
        els.btnEditar2 = $("#btnEditarEntrada2");
        els.btnCancelarEdicao = $("#btnCancelarEdicao");

        // Bindings
        if (els.btnVoltar) els.btnVoltar.onclick = () => (window.history.length > 1 ? window.history.back() : window.location.href = "/");
        if (els.form) els.form.onsubmit = (e) => e.preventDefault();

        // Data Default
        const dtInput = $("#data_operacao");
        if (dtInput && !dtInput.value) dtInput.valueAsDate = new Date();

        // Botões de Ação
        if (els.btnSalvarRegistro) els.btnSalvarRegistro.onclick = () => salvarAcao("criacao");
        if (els.btnSalvarEdicao) els.btnSalvarEdicao.onclick = () => salvarAcao("edicao");
        if (els.btnFinalizar) els.btnFinalizar.onclick = finalizarSessaoAcao;
        if (els.btnEditar1) els.btnEditar1.onclick = () => entrarModoEdicao(1);
        if (els.btnEditar2) els.btnEditar2.onclick = () => entrarModoEdicao(2);
        if (els.btnCancelarEdicao) els.btnCancelarEdicao.onclick = () => {
            modoEdicaoEntradaSeq = null;
            if (els.form) els.form.reset();
            carregarEstadoSessao(els.salaSelect.value);
        };

        if (els.btnLimpar) els.btnLimpar.onclick = () => {
            const s = els.salaSelect.value;
            const t = getTipoEvento();
            els.form.reset();
            if (els.salaSelect) els.salaSelect.value = s;
            const rt = $(`input[name="tipo_evento"][value="${t}"]`); if (rt) rt.checked = true;
            if (dtInput) dtInput.valueAsDate = new Date();
            atualizarTipoEventoUI();
        };

        // UI Extra (Linhas Operadores)
        const btnAddTop = $("#btn-add-top"), row2 = $("#op-row-2"), row3 = $("#op-row-3");
        const toggleRow = (row, show) => row && (row.style.display = show ? "grid" : "none");
        if (btnAddTop) btnAddTop.onclick = () => { toggleRow(row2, true); btnAddTop.style.visibility = "hidden"; };
        $("#btn-add-top-legend")?.addEventListener("click", () => btnAddTop.click());
        $("#btn-add-op-2")?.addEventListener("click", () => toggleRow(row3, true));
        $("#btn-remove-op-2")?.addEventListener("click", () => {
            toggleRow(row2, false); toggleRow(row3, false);
            $("#operador_2").value = ""; $("#operador_3").value = "";
            btnAddTop.style.visibility = "visible";
        });

        // Listeners Gerais
        $$('input[name="tipo_evento"]').forEach(r => r.addEventListener("change", atualizarTipoEventoUI));

        if (els.salaSelect) {
            els.salaSelect.addEventListener("change", () => carregarEstadoSessao(els.salaSelect.value));
        }

        // Init
        await Promise.all([initLookups(), Promise.resolve()]); // Promise.resolve placeholder

        // URL Params
        const params = new URLSearchParams(window.location.search);
        if (params.get("sala_id") && els.salaSelect) {
            els.salaSelect.value = params.get("sala_id");
            carregarEstadoSessao(els.salaSelect.value);
        } else {
            aplicarEstadoNaUI();
        }
    });
})();