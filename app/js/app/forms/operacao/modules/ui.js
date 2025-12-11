// app/js/app/forms/operacao/index/ui.js
// Parte 1: Configuração inicial, visibilidade de seções e resets

import { ensureHojeEmDataOperacao, $$ } from './utils.js';
import { globalState } from './state.js';

// =============================================================================
// Helper: Setup da UI de Operadores (Linhas 2 e 3)
// =============================================================================

export function setupOperatorsUI(elements) {
    const {
        row2, row3, btnAddTop, btnAddTopLegend,
        btnAddOp2, btnRemoveOp2, operador2Select, operador3Select
    } = elements;

    // Funções internas auxiliares (closure)
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

    // Bindings locais
    if (btnAddTop) btnAddTop.addEventListener("click", showRow2);
    if (btnAddTopLegend) btnAddTopLegend.addEventListener("click", showRow2);
    if (btnAddOp2) btnAddOp2.addEventListener("click", showRow3);
    if (btnRemoveOp2) btnRemoveOp2.addEventListener("click", hideRow2);
}

// =============================================================================
// Lógica de Visibilidade: Tipo de Evento e Anormalidade
// =============================================================================

export function atualizarTipoEventoUI(sectionAnormalidade) {
    // Nova regra: "Houve anormalidade?" sempre visível.
    if (!sectionAnormalidade) return;

    sectionAnormalidade.style.display = "";

    // Garante que haja sempre um valor selecionado (padrão = "não")
    const radioSelecionado = document.querySelector(
        'input[name="houve_anormalidade"]:checked'
    );
    if (!radioSelecionado) {
        const radioNao = document.querySelector(
            'input[name="houve_anormalidade"][value="nao"]'
        );
        if (radioNao) {
            radioNao.checked = true;
        }
    }
}

/**
 * Adiciona listeners aos radios de tipo_evento.
 * Recebe 'callbackCarregarSessao' para evitar dependência circular com actions.js
 */
export function bindTipoEventoLogic(salaSelect, sectionAnormalidade, callbackCarregarSessao) {
    const radios = $$('input[name="tipo_evento"]');
    radios.forEach((r) => {
        r.addEventListener("change", function () {
            const oldSala = salaSelect ? salaSelect.value : null;

            atualizarTipoEventoUI(sectionAnormalidade);

            // Se mudar para "Outros Eventos" (força Plenário) ou voltar, a sala muda.
            // Precisamos recarregar o estado da sessão da NOVA sala.
            if (salaSelect && salaSelect.value && salaSelect.value !== oldSala) {
                if (typeof callbackCarregarSessao === 'function') {
                    callbackCarregarSessao(salaSelect.value);
                }
            }
        });
    });
    atualizarTipoEventoUI(sectionAnormalidade);
}

export function atualizarVisibilidadeTipoPorSala(salaSelect, comissaoSelect) {
    if (!comissaoSelect || !salaSelect) return;

    // Container externo do bloco "Tipo"
    const divTipo = document.getElementById("div-tipo-comissao");
    const temSala = !!salaSelect.value;

    // Sem sala selecionada: esconde o bloco e limpa valor
    if (!temSala) {
        if (divTipo) divTipo.classList.add("hidden");
        comissaoSelect.value = "";
        comissaoSelect.disabled = true;
        if (comissaoSelect.dataset) {
            delete comissaoSelect.dataset.lockSessao;
        }
        return;
    }

    // Sala selecionada: decide se mostra ou não baseado em Auditório / Plenário
    const optSala = salaSelect.options[salaSelect.selectedIndex] || null;
    const textoSala = (
        (optSala && (optSala.textContent || optSala.innerText || optSala.label)) ||
        ""
    ).toLowerCase();

    const isAuditorio = /audit[oó]rio/.test(textoSala);
    const isPlenario = /plen[áa]rio/.test(textoSala);

    if (isAuditorio || isPlenario) {
        // Auditório ou Plenário → "Tipo" fica oculto e desabilitado
        if (divTipo) divTipo.classList.add("hidden");
        comissaoSelect.value = "";
        comissaoSelect.disabled = true;
        if (comissaoSelect.dataset) {
            delete comissaoSelect.dataset.lockSessao;
        }
    } else {
        // Qualquer outra sala → "Tipo" é obrigatório e visível
        if (divTipo) divTipo.classList.remove("hidden");

        // Se a sessão marcou o campo como travado, mantemos o disable.
        if (comissaoSelect.dataset && comissaoSelect.dataset.lockSessao === "true") {
            comissaoSelect.disabled = true;
        } else {
            comissaoSelect.disabled = false;
        }
    }

    // O tipo_evento depende de sala + comissão, então recalculamos a UI
    const sectionAnormalidade = document.getElementById("section-anormalidade");
    atualizarTipoEventoUI(sectionAnormalidade);
}

// =============================================================================
// Resets
// =============================================================================

export function resetFormMantendoSalaETipo(elements) {
    const { form, salaSelect, comissaoSelect, dataOperacaoInput, sectionAnormalidade } = elements;
    if (!form) return;

    const salaValue = salaSelect ? salaSelect.value : "";

    form.reset();

    if (salaSelect) {
        salaSelect.value = salaValue;
    }

    ensureHojeEmDataOperacao(dataOperacaoInput);
    atualizarTipoEventoUI(sectionAnormalidade);

    atualizarVisibilidadeTipoPorSala(salaSelect, comissaoSelect);
}

import { derivarSituacaoOperador } from './state.js';

// =============================================================================
// Cabeçalhos e Indicadores
// =============================================================================

export function atualizarIndicadorModoEdicao(modoEl, estadoSessao, modoEdicaoEntradaSeq) {
    if (!modoEl) return;

    // Se não há sessão aberta, esconde o indicador
    if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
        // Espelha o comportamento do index.js original:
        // sai do modo edição quando não há sessão.
        globalState.modoEdicaoEntradaSeq = null;

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
        modoEl.textContent = "";
        modoEl.style.display = "none";
    }
}

export function atualizarCabecalhoOperadoresSessao(headerEl, modoEl, estadoSessao, modoEdicaoEntradaSeq) {
    if (!headerEl) {
        atualizarIndicadorModoEdicao(modoEl, estadoSessao, modoEdicaoEntradaSeq);
        return;
    }

    // Se não há estado carregado ou não há sessão aberta, esconde o cabeçalho
    if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
        headerEl.style.display = "none";
        headerEl.textContent = "";
        atualizarIndicadorModoEdicao(modoEl, estadoSessao, modoEdicaoEntradaSeq);
        return;
    }

    let entradas = Array.isArray(estadoSessao.entradas_sessao)
        ? estadoSessao.entradas_sessao.slice()
        : [];

    // Fallback: nomes_operadores_sessao
    if (!entradas.length) {
        const nomesFallback = Array.isArray(estadoSessao.nomes_operadores_sessao)
            ? estadoSessao.nomes_operadores_sessao
            : [];

        if (!nomesFallback.length) {
            headerEl.style.display = "none";
            headerEl.textContent = "";
            atualizarIndicadorModoEdicao(modoEl, estadoSessao, modoEdicaoEntradaSeq);
            return;
        }

        const linhasFallback = [];
        linhasFallback.push("Registro aberto por " + nomesFallback[0] + ".");

        const ordinaisFallback = { 2: "Segundo", 3: "Terceiro", 4: "Quarto", 5: "Quinto", 6: "Sexto", 7: "Sétimo", 8: "Oitavo", 9: "Nono", 10: "Décimo" };
        const descricoesFallback = [];
        for (let i = 1; i < nomesFallback.length; i++) {
            const posicao = i + 1;
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
        atualizarIndicadorModoEdicao(modoEl, estadoSessao, modoEdicaoEntradaSeq);
        return;
    }

    // Ordenação real
    entradas.sort((a, b) => {
        const oa = typeof a.ordem === "number" ? a.ordem : parseInt(a.ordem || a.seq || 0, 10);
        const ob = typeof b.ordem === "number" ? b.ordem : parseInt(b.ordem || b.seq || 0, 10);
        if (oa !== ob) return oa - ob;
        const ea = a.entrada_id || a.id || 0;
        const eb = b.entrada_id || b.id || 0;
        return ea - eb;
    });

    const linhas = [];
    const ordinais = { 1: "Primeiro", 2: "Segundo", 3: "Terceiro", 4: "Quarto", 5: "Quinto", 6: "Sexto", 7: "Sétimo", 8: "Oitavo", 9: "Nono", 10: "Décimo" };

    const primeira = entradas[0];
    const nomePrimeiro = primeira && primeira.operador_nome ? primeira.operador_nome : "—";
    linhas.push("Registro aberto por " + nomePrimeiro + ".");

    const descricoes = [];
    for (let i = 1; i < entradas.length; i++) {
        const entrada = entradas[i];
        const posicao = i + 1;
        const prefixo = ordinais[posicao] || posicao + "º";
        const nome = entrada && entrada.operador_nome ? entrada.operador_nome : "—";
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
    atualizarIndicadorModoEdicao(modoEl, estadoSessao, modoEdicaoEntradaSeq);
}

// =============================================================================
// Bloqueios e Estados de Campos
// =============================================================================

export function aplicarBloqueioPorSala(elements) {
    const {
        form, salaSelect, comissaoSelect, btnLimpar, btnSalvarRegistro,
        btnSalvarEdicao, btnVoltar
    } = elements;

    if (!form || !salaSelect) return;
    const temSala = !!salaSelect.value;

    // 1) Campos: tudo visível, mas travado sem sala
    const campos = form.querySelectorAll("input, select, textarea");
    campos.forEach((el) => {
        if (el === salaSelect) {
            el.disabled = false;
            if ("readOnly" in el) el.readOnly = false;
            return;
        }
        const disabled = !temSala;
        el.disabled = disabled;
        if (!disabled && "readOnly" in el) {
            el.readOnly = false;
        }
    });

    // 2) Botões
    if (!temSala) {
        if (btnLimpar) { btnLimpar.style.display = "none"; btnLimpar.disabled = true; }
        if (btnSalvarRegistro) { btnSalvarRegistro.style.display = "none"; btnSalvarRegistro.disabled = true; }
        if (btnSalvarEdicao) { btnSalvarEdicao.style.display = "none"; btnSalvarEdicao.disabled = true; }
        if (btnVoltar) { btnVoltar.style.display = ""; btnVoltar.disabled = false; }
    } else {
        if (btnLimpar) { btnLimpar.style.display = ""; btnLimpar.disabled = false; }
        if (btnSalvarRegistro) { btnSalvarRegistro.style.display = ""; }
        if (btnSalvarEdicao) { btnSalvarEdicao.disabled = false; }
        if (btnVoltar) { btnVoltar.style.display = ""; btnVoltar.disabled = false; }
    }

    atualizarVisibilidadeTipoPorSala(salaSelect, comissaoSelect);
}

export function aplicarModoOperadorComDuasEntradas(elements) {
    const { form, salaSelect, btnSalvarRegistro, btnSalvarEdicao, btnLimpar, btnCancelarEdicao, btnEditarEntrada1, btnEditarEntrada2 } = elements;
    if (!form) return;

    // 1) Zera todos os campos (menos sala) e trava
    const campos = form.querySelectorAll("input, textarea, select");
    campos.forEach((el) => {
        if (el === salaSelect) return;
        if (el.tagName === "SELECT") {
            el.value = "";
        } else if (el.type === "radio" || el.type === "checkbox") {
            el.checked = false;
        } else {
            el.value = "";
        }
        el.readOnly = true;
        el.disabled = true;
    });

    if (salaSelect) {
        salaSelect.disabled = false;
        salaSelect.readOnly = false;
    }

    // 2) Botões
    if (btnSalvarRegistro) btnSalvarRegistro.style.display = "none";
    if (btnSalvarEdicao) btnSalvarEdicao.style.display = "none";
    if (btnLimpar) btnLimpar.style.display = "none";
    if (btnCancelarEdicao) btnCancelarEdicao.style.display = "none";

    if (btnEditarEntrada1) { btnEditarEntrada1.style.display = ""; btnEditarEntrada1.disabled = false; }
    if (btnEditarEntrada2) { btnEditarEntrada2.style.display = ""; btnEditarEntrada2.disabled = false; }
}

export function aplicarEstadoSessaoNaUI(elements, state) {
    const {
        salaSelect, btnEditarEntrada1, btnEditarEntrada2, btnCancelarEdicao, btnSalvarRegistro,
        btnSalvarEdicao, headerOperadores, modoEdicaoInfo, sectionAnormalidade
    } = elements;

    // 0) Esconde botões de edição / cancelar por padrão
    if (btnEditarEntrada1) { btnEditarEntrada1.style.display = "none"; btnEditarEntrada1.disabled = false; }
    if (btnEditarEntrada2) { btnEditarEntrada2.style.display = "none"; btnEditarEntrada2.disabled = false; }
    if (btnCancelarEdicao) { btnCancelarEdicao.style.display = "none"; btnCancelarEdicao.disabled = false; }

    // 1) Bloqueio base por sala
    aplicarBloqueioPorSala(elements);

    // Se não há sala selecionada
    if (!salaSelect || !salaSelect.value) {
        // espelha o comportamento do index.js original
        state.estadoSessao = null;
        if (state.uiState) {
            state.uiState.situacao_operador = "sem_sessao";
            state.uiState.sessaoAberta = false;
        }

        atualizarCabecalhoOperadoresSessao(headerOperadores, modoEdicaoInfo, null, null);
        return;
    }

    const { estadoSessao } = state;

    bloquearCabecalhoSeSessaoAberta(elements, estadoSessao);
    // 2) Reset de botões base
    if (btnSalvarRegistro) {
        btnSalvarRegistro.style.display = "";
        btnSalvarRegistro.disabled = false;
        btnSalvarRegistro.textContent = "Salvar registro";
    }
    if (btnSalvarEdicao) { btnSalvarEdicao.style.display = "none"; btnSalvarEdicao.disabled = false; }

    // 3) Não há estado conhecido ainda para essa sala
    if (!estadoSessao) {
        if (state.uiState) {
            state.uiState.situacao_operador = "sem_sessao";
            state.uiState.sessaoAberta = false;
        }
        atualizarTipoEventoUI(sectionAnormalidade);
        atualizarCabecalhoOperadoresSessao(
            headerOperadores,
            modoEdicaoInfo,
            null,
            null
        );
        return;
    }

    // 4) Deriva situação do operador e se a sessão está aberta
    const situacao = derivarSituacaoOperador(estadoSessao);
    const sessaoAberta = !!estadoSessao.existe_sessao_aberta;

    if (state.uiState) { state.uiState.situacao_operador = situacao; state.uiState.sessaoAberta = sessaoAberta; }

    // Rádios de tipo sempre habilitados
    const radiosTipo = document.querySelectorAll('input[name="tipo_evento"]');
    radiosTipo.forEach((r) => { r.disabled = false; });
    atualizarTipoEventoUI(sectionAnormalidade);

    // === CASO 1: ainda NÃO existe sessão (sem_sessao) ===
    if (situacao === "sem_sessao") {
        if (btnSalvarRegistro) {
            btnSalvarRegistro.style.display = "";
            btnSalvarRegistro.disabled = false;
            btnSalvarRegistro.textContent = "Salvar registro";
        }
        if (btnSalvarEdicao) { btnSalvarEdicao.style.display = "none"; btnSalvarEdicao.disabled = false; }

        atualizarCabecalhoOperadoresSessao(
            headerOperadores,
            modoEdicaoInfo,
            estadoSessao,
            state.modoEdicaoEntradaSeq
        );
        return;
    }

    // === CASO 2: sessão existe, operador ainda sem entrada ===
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
        if (btnEditarEntrada1) { btnEditarEntrada1.style.display = "none"; }
        if (btnEditarEntrada2) { btnEditarEntrada2.style.display = "none"; }

        // Regra nova:
        // - 2º operador herda os dados do 1º
        // - 3º operador herda do 2º
        // - e assim sucessivamente...
        // Sempre usando a ÚLTIMA entrada da sessão.
        // "Houve anormalidade?" NÃO é herdado.
        preencherFormularioComUltimaEntradaDaSessao(elements, estadoSessao);

        atualizarCabecalhoOperadoresSessao(
            headerOperadores,
            modoEdicaoInfo,
            estadoSessao,
            state.modoEdicaoEntradaSeq
        );
        return;
    }

    // === CASO 3: operador com 1ª entrada ===
    if (situacao === "uma_entrada") {
        if (btnSalvarRegistro) {
            btnSalvarRegistro.style.display = "";
            btnSalvarRegistro.disabled = false;
            btnSalvarRegistro.textContent = "Novo registro (2ª entrada)";
        }
        if (btnSalvarEdicao) { btnSalvarEdicao.style.display = "none"; btnSalvarEdicao.disabled = false; }
        if (btnEditarEntrada1) { btnEditarEntrada1.style.display = ""; btnEditarEntrada1.disabled = false; }
        if (btnEditarEntrada2) { btnEditarEntrada2.style.display = "none"; }

        atualizarCabecalhoOperadoresSessao(
            headerOperadores,
            modoEdicaoInfo,
            estadoSessao,
            state.modoEdicaoEntradaSeq
        );
        return;
    }

    // === CASO 4: operador com 2 entradas ===
    if (situacao === "duas_entradas") {
        aplicarModoOperadorComDuasEntradas(elements);
        atualizarCabecalhoOperadoresSessao(
            headerOperadores,
            modoEdicaoInfo,
            estadoSessao,
            state.modoEdicaoEntradaSeq
        );
        return;
    }

    // Fallback de segurança
    atualizarCabecalhoOperadoresSessao(
        headerOperadores,
        modoEdicaoInfo,
        estadoSessao,
        state.modoEdicaoEntradaSeq
    );
}

function preencherFormularioComUltimaEntradaDaSessao(elements, estadoSessao) {
    if (!estadoSessao) return;

    const entradasSessao = Array.isArray(estadoSessao.entradas_sessao)
        ? estadoSessao.entradas_sessao
        : [];

    if (!entradasSessao || entradasSessao.length === 0) {
        return;
    }

    // Última entrada (lista já vem ordenada do backend por ordem do operador + id)
    const ultima = entradasSessao[entradasSessao.length - 1];
    if (!ultima) return;

    // Cópia superficial para não modificar o objeto em estadoSessao
    const entradaCopia = { ...ultima };

    // Não herdamos a resposta de "Houve anormalidade?".
    // O novo operador sempre decide isso explicitamente.
    delete entradaCopia.houve_anormalidade;

    preencherFormularioComEntrada(elements, entradaCopia, estadoSessao);
}

// =============================================================================
// Preenchimento de Formulário
// =============================================================================

export function preencherFormularioComEntrada(elements, entrada, estadoSessao) {
    if (!entrada) return;
    const { comissaoSelect, sectionAnormalidade, salaSelect } = elements;

    // 1) Data
    const inputData = document.querySelector('input[name="data_operacao"]');
    if (inputData) {
        const dataValor = (estadoSessao && estadoSessao.data) || entrada.data_operacao || "";
        if (dataValor) inputData.value = dataValor;
    }

    // 2) Campos diretos
    const mapDiretos = {
        horario_pauta: 'input[name="horario_pauta"]',
        nome_evento: 'input[name="nome_evento"]',
        usb_01: 'input[name="usb_01"]',
        usb_02: 'input[name="usb_02"]',
        observacoes: 'textarea[name="observacoes"]',
        responsavel_evento: 'input[name="responsavel_evento"]'
    };
    Object.entries(mapDiretos).forEach(([campo, seletor]) => {
        const el = document.querySelector(seletor);
        if (el && Object.prototype.hasOwnProperty.call(entrada, campo)) {
            el.value = entrada[campo] || "";
        }
    });

    // 3) Comissao
    if (comissaoSelect && Object.prototype.hasOwnProperty.call(entrada, "comissao_id")) {
        comissaoSelect.value = entrada.comissao_id || "";
    }

    // 4) Horários
    const inputHoraInicio = document.querySelector('input[name="hora_inicio"]');
    if (inputHoraInicio && "horario_inicio" in entrada) inputHoraInicio.value = entrada.horario_inicio || "";
    const inputHoraFim = document.querySelector('input[name="hora_fim"]');
    if (inputHoraFim && "horario_termino" in entrada) inputHoraFim.value = entrada.horario_termino || "";

    // 5) Tipo Evento
    if (entrada.tipo_evento) {
        const radioTipo = document.querySelector(`input[name="tipo_evento"][value="${entrada.tipo_evento}"]`);
        if (radioTipo) radioTipo.checked = true;
    }

    // 6) Anormalidade
    if (typeof entrada.houve_anormalidade !== "undefined" && entrada.houve_anormalidade !== null) {
        const valorHouve = entrada.houve_anormalidade ? "sim" : "nao";
        const radioHouve = document.querySelector(`input[name="houve_anormalidade"][value="${valorHouve}"]`);
        if (radioHouve) radioHouve.checked = true;
    }

    if (salaSelect && comissaoSelect) {
        atualizarVisibilidadeTipoPorSala(salaSelect, comissaoSelect);
    }
    atualizarTipoEventoUI(sectionAnormalidade);
}

function bloquearCabecalhoSeSessaoAberta(elements, estadoSessao) {
    const {
        dataOperacaoInput,
        horarioPautaInput,
        horaInicioInput,
        nomeEventoInput,
        responsavelEventoInput,
        comissaoSelect,
        salaSelect,
    } = elements;

    // Sempre garantimos que os campos básicos permaneçam editáveis.
    // O "bloqueio" pós-sessão agora só se aplica à Atividade Legislativa
    // (comissaoSelect) quando a sala NÃO é Plenário/Auditório.
    if (!estadoSessao || !estadoSessao.existe_sessao_aberta) {
        [nomeEventoInput, responsavelEventoInput, dataOperacaoInput, horarioPautaInput, horaInicioInput]
            .forEach((el) => { if (el) el.readOnly = false; });

        if (comissaoSelect) {
            comissaoSelect.disabled = false;
            if (comissaoSelect.dataset) {
                delete comissaoSelect.dataset.lockSessao;
            }
        }
        return;
    }

    // Sessão aberta: usamos os dados da sessão apenas como "default"
    // (se o campo estiver vazio), mas mantemos os campos editáveis.
    const aplicarDefault = (input, valor) => {
        if (!input) return;
        if (!input.value) {
            input.value = valor || "";
        }
        input.readOnly = false;
    };

    aplicarDefault(nomeEventoInput, estadoSessao.nome_evento);
    aplicarDefault(responsavelEventoInput, estadoSessao.responsavel_evento);
    aplicarDefault(dataOperacaoInput, estadoSessao.data);
    aplicarDefault(horarioPautaInput, estadoSessao.horario_pauta);
    aplicarDefault(horaInicioInput, estadoSessao.horario_inicio);

    if (!comissaoSelect) return;

    // Verifica se o "Local" atual é Plenário ou Auditório
    let isAuditorio = false;
    let isPlenario = false;

    if (salaSelect && salaSelect.options && salaSelect.selectedIndex >= 0) {
        const optSala = salaSelect.options[salaSelect.selectedIndex] || null;
        const textoSala = (
            (optSala && (optSala.textContent || optSala.innerText || optSala.label)) ||
            ""
        ).toLowerCase();

        isAuditorio = /audit[oó]rio/.test(textoSala);
        isPlenario = /plen[áa]rio/.test(textoSala);
    }

    const val = estadoSessao.comissao_id;

    if (isAuditorio || isPlenario) {
        // Plenário / Auditório: nenhum campo é travado pela sessão
        comissaoSelect.disabled = false;
        if (comissaoSelect.dataset) {
            delete comissaoSelect.dataset.lockSessao;
        }
    } else if (val !== null && val !== undefined && val !== "") {
        // Demais salas: Atividade Legislativa travada com o valor da sessão
        comissaoSelect.value = String(val);
        comissaoSelect.disabled = true;
        if (comissaoSelect.dataset) {
            comissaoSelect.dataset.lockSessao = "true";
        }
    } else {
        // Sessões antigas podem não ter comissao_id; deixa livre
        comissaoSelect.disabled = false;
        if (comissaoSelect.dataset) {
            delete comissaoSelect.dataset.lockSessao;
        }
    }
}