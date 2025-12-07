(function () {
    "use strict";

    // --- Estado da Tabela de Operações (Sessões) ---
    const stateOps = {
        page: 1,
        limit: 10,
        search: "",
        sort: "data",
        dir: "desc",
        periodo: null, // filtro de período para sessões de operação
    };

    // --- Novo Estado da Tabela de Anormalidades (Master-Detail) ---
    const anomState = {
        page: 1,          // Paginação agora é global
        limit: 10,
        search: "",       // Filtro global
        sort: "data",     // Ordenação padrão
        dir: "desc",      // Direção padrão
        periodo: null,    // filtro de período para anormalidades
    };

    // --- Helpers de Data/Hora ---
    const fmtDate = (d) => {
        if (!d) return "--";
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return d;
    };

    const fmtTime = (t) => {
        if (!t) return "--";
        return t.substring(0, 5);
    };

    // --- Helper Debounce ---
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- Helper de Paginação ---
    function renderPaginationControls(containerId, meta, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!meta || !meta.total) {
            container.innerHTML = "";
            return;
        }

        const current = meta.page;
        const totalPages = meta.pages;
        const totalRecords = meta.total;

        // Se só tem 1 página e poucos registros, às vezes nem precisa mostrar, 
        // mas vamos manter para consistência.

        container.innerHTML = `
            <span class="pagination-info">
                Página <strong>${current}</strong> de <strong>${totalPages || 1}</strong> (Total: ${totalRecords})
            </span>
            <div style="display:inline-flex; gap:8px;">
                <button class="btn-page" id="prev-${containerId}" ${current <= 1 ? 'disabled' : ''}>← Anterior</button>
                <button class="btn-page" id="next-${containerId}" ${current >= totalPages ? 'disabled' : ''}>Próxima →</button>
            </div>
        `;

        const btnPrev = document.getElementById(`prev-${containerId}`);
        const btnNext = document.getElementById(`next-${containerId}`);

        if (btnPrev) btnPrev.onclick = (e) => {
            e.stopPropagation(); // Evita fechar o accordion se o clique vazar
            onPageChange(current - 1);
        };
        if (btnNext) btnNext.onclick = (e) => {
            e.stopPropagation();
            onPageChange(current + 1);
        };
    }

    // --- Fetch Autenticado ---
    async function fetchJson(url) {
        if (!window.Auth || typeof Auth.authFetch !== 'function') {
            console.error("Auth não carregado");
            return null;
        }
        try {
            const resp = await Auth.authFetch(url);
            if (!resp.ok) throw new Error("HTTP " + resp.status);
            return await resp.json();
        } catch (e) {
            console.error(e);
            return { ok: false, data: [] };
        }
    }

    // --- Gerenciamento Visual de Ordenação (Tabelas Estáticas/Principais) ---
    function updateHeaderIcons(tableId, state) {
        const headers = document.querySelectorAll(`#${tableId} th.sortable`);
        headers.forEach(th => {
            th.classList.remove("asc", "desc");
            if (th.dataset.sort === state.sort) {
                th.classList.add(state.dir);
            }
        });
    }

    function bindSortHeaders(tableId, stateObj, loadFunc) {
        const headers = document.querySelectorAll(`#${tableId} th.sortable`);
        headers.forEach(th => {
            th.addEventListener("click", () => {
                const col = th.dataset.sort;
                if (stateObj.sort === col) {
                    stateObj.dir = stateObj.dir === "asc" ? "desc" : "asc";
                } else {
                    stateObj.sort = col;
                    stateObj.dir = "asc";
                }
                if (stateObj.page) stateObj.page = 1; // Reseta página se existir no state
                loadFunc();
            });
        });
    }

    // =================================================================
    // --- LÓGICA DA TABELA DE OPERAÇÕES (SESSÕES) ---
    // =================================================================

    async function loadOperacoes() {
        updateHeaderIcons("tb-operacoes", stateOps);

        const endpoint = AppConfig.endpoints.adminDashboard.operacoes;
        const params = new URLSearchParams({
            page: stateOps.page,
            limit: stateOps.limit,
            search: stateOps.search,
            sort: stateOps.sort,
            dir: stateOps.dir,
        });

        if (stateOps.periodo) {
            params.set("periodo", JSON.stringify(stateOps.periodo));
        }

        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;
        const resp = await fetchJson(url);


        const tbody = document.querySelector("#tb-operacoes tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum registro encontrado.</td></tr>`;
            renderPaginationControls("pag-operacoes", null, null);
            return;
        }

        data.forEach(sessao => {
            // 1. Linha Pai (Sessão)
            const trParent = document.createElement("tr");
            trParent.className = "accordion-parent";

            const checklistClass = sessao.verificacao === "Realizado" ? "text-green" : "text-gray";
            const abertoClass = sessao.em_aberto === "Sim" ? "text-blue bold" : "";

            trParent.innerHTML = `
                <td><span class="toggle-icon">▶</span></td>
                <td><strong>${sessao.sala}</strong></td>
                <td>${fmtDate(sessao.data)}</td>
                <td>${sessao.autor}</td>
                <td class="${checklistClass}">${sessao.verificacao}</td>
                <td class="${abertoClass}">${sessao.em_aberto}</td>
            `;

            // 2. Linha Filha (Entradas)
            const trChild = document.createElement("tr");
            trChild.className = "accordion-child";

            let entradasHtml = "";
            if (sessao.entradas && sessao.entradas.length > 0) {
                entradasHtml = `
                    <div style="margin-bottom:8px; font-size:0.85em; color:#64748b;">
                        ℹ️ <em>Dê um duplo-clique na linha para ver o formulário detalhado.</em>
                    </div>
                    <table class="sub-table table-hover">
                        <thead>
                            <tr>
                                <th style="width:40px;">Nº</th>
                                <th>Operador</th>
                                <th>Tipo</th>
                                <th>Evento</th>
                                <th>Pauta</th>
                                <th>Início</th>
                                <th>Fim</th>
                                <th>Anormalidade?</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sessao.entradas.map(ent => {
                    const anomStyle = ent.anormalidade ? 'color:red; font-weight:bold;' : 'color:green;';
                    const anomText = ent.anormalidade ? 'SIM' : 'Não';

                    return `
                                    <tr class="entry-row" data-id="${ent.id}" title="Duplo-clique para abrir formulário">
                                        <td>${ent.ordem}º</td>
                                        <td>${ent.operador}</td>
                                        <td>${ent.tipo}</td>
                                        <td>${ent.evento || '-'}</td>
                                        <td>${fmtTime(ent.pauta)}</td>
                                        <td>${fmtTime(ent.inicio)}</td>
                                        <td>${fmtTime(ent.fim)}</td>
                                        <td style="${anomStyle}">${anomText}</td>
                                    </tr>
                                `;
                }).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                entradasHtml = `<div style="padding:10px;">Nenhuma entrada registrada nesta sessão.</div>`;
            }

            trChild.innerHTML = `
                <td colspan="6">
                    <div class="sub-table-wrap">
                        ${entradasHtml}
                    </div>
                </td>
            `;

            // Eventos
            trParent.addEventListener("click", () => {
                trParent.classList.toggle("open");
                if (trParent.classList.contains("open")) {
                    trChild.classList.add("visible");
                } else {
                    trChild.classList.remove("visible");
                }
            });

            const entryRows = trChild.querySelectorAll(".entry-row");
            entryRows.forEach(row => {
                row.addEventListener("dblclick", (e) => {
                    const entradaId = row.getAttribute("data-id");
                    if (entradaId) {
                        window.open(`/admin/form_operacao.html?entrada_id=${entradaId}`, '_blank');
                    }
                });
            });

            tbody.appendChild(trParent);
            tbody.appendChild(trChild);
        });

        renderPaginationControls("pag-operacoes", meta, (newPage) => {
            stateOps.page = newPage;
            loadOperacoes();
        });
    }

    // =================================================================
    // --- LÓGICA DA TABELA DE ANORMALIDADES (LISTA PLANA) ---
    // =================================================================

    async function loadAnormalidades() {
        updateHeaderIcons("tb-anormalidades", anomState);

        const endpoint = AppConfig.endpoints.adminDashboard.anormalidades.lista;
        const params = new URLSearchParams({
            page: anomState.page,
            limit: anomState.limit,
            search: anomState.search,
            sort: anomState.sort,
            dir: anomState.dir,
        });

        if (anomState.periodo) {
            params.set("periodo", JSON.stringify(anomState.periodo));
        }

        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;
        const resp = await fetchJson(url);

        const tbody = document.querySelector("#tb-anormalidades tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhuma anormalidade encontrada.</td></tr>`;
            // Se tiver div externa de paginação, reseta ela aqui
            renderPaginationControls("pag-anormalidades", null, null);
            return;
        }

        data.forEach(row => {
            const tr = document.createElement("tr");

            const dateStr = fmtDate(row.data);
            const solucaoBadge = row.solucionada
                ? `<span class="text-green bold">Sim</span>`
                : `<span class="text-red">Não</span>`;

            const prejClass = row.houve_prejuizo ? "text-red bold" : "text-gray";
            const prejText = row.houve_prejuizo ? "Sim" : "Não";

            const reclClass = row.houve_reclamacao ? "text-red bold" : "text-gray";
            const reclText = row.houve_reclamacao ? "Sim" : "Não";

            // Corta descrição longa
            const desc = row.descricao && row.descricao.length > 50
                ? row.descricao.substring(0, 50) + "..."
                : (row.descricao || "");

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${row.sala || '--'}</td>
                <td>${row.registrado_por}</td>
                <td title="${row.descricao}">${desc}</td>
                <td>${solucaoBadge}</td>
                <td class="${prejClass}">${prejText}</td>
                <td class="${reclClass}">${reclText}</td>
                <td>
                    <button class="btn-xs btn-ver-anom" data-id="${row.id}">Detalhes</button>
                </td>
            `;

            // Bind botão
            const btn = tr.querySelector(".btn-ver-anom");
            btn.addEventListener("click", () => {
                window.open(`/admin/form_anormalidade.html?id=${row.id}`, '_blank');
            });

            tbody.appendChild(tr);
        });

        // Cria a div de paginação dinamicamente se não existir no HTML
        let pagContainer = document.getElementById("pag-anormalidades");
        if (!pagContainer) {
            pagContainer = document.createElement("div");
            pagContainer.id = "pag-anormalidades";
            pagContainer.className = "pagination-controls";
            document.querySelector("#tb-anormalidades").parentNode.after(pagContainer);
        }

        renderPaginationControls("pag-anormalidades", meta, (newPage) => {
            anomState.page = newPage;
            loadAnormalidades();
        });
    }

    // Helper para bindar eventos nos headers recém-criados na sub-tabela
    function bindDynamicSortHeaders(salaId) {
        const table = document.getElementById(`subtable-${salaId}`);
        if (!table) return;

        const headers = table.querySelectorAll("th.sortable");
        headers.forEach(th => {
            th.addEventListener("click", (e) => {
                e.stopPropagation(); // Não fechar o accordion
                const col = th.dataset.col;

                if (anomState.sort === col) {
                    anomState.dir = anomState.dir === "asc" ? "desc" : "asc";
                } else {
                    anomState.sort = col;
                    anomState.dir = "asc";
                }

                // Recarrega a tabela desta sala com a nova ordenação
                // Volta para página 1 ao reordenar
                loadAnormalidadesDaSala(salaId, 1);
            });
        });
    }

    // =========================================================
    // --- Inicialização ---
    // =========================================================
    document.addEventListener("DOMContentLoaded", () => {
        // 1. Tabela de Operações (Busca e Ordenação)
        const searchOps = document.getElementById("search-operacoes");
        if (searchOps) {
            searchOps.addEventListener("input", debounce((e) => {
                stateOps.search = e.target.value.trim();
                stateOps.page = 1;
                loadOperacoes();
            }, 400));
        }

        // 1.1. Filtro por Período (Operações)
        const toolbarOps = searchOps ? searchOps.closest(".toolbar") : null;
        if (toolbarOps && window.PeriodoFilter && typeof window.PeriodoFilter.createPeriodoUI === "function") {
            window.PeriodoFilter.createPeriodoUI({
                toolbarEl: toolbarOps,
                getPeriodo: () => stateOps.periodo,
                setPeriodo: (p) => {
                    stateOps.periodo = p;
                    stateOps.page = 1;
                    loadOperacoes();
                }
            });
        }

        bindSortHeaders("tb-operacoes", stateOps, loadOperacoes);

        // 2. Tabela de Anormalidades (Busca Cascata)
        const searchAnom = document.getElementById("search-anormalidades");
        if (searchAnom) {
            searchAnom.addEventListener("input", debounce((e) => {
                anomState.search = e.target.value.trim();
                anomState.page = 1;
                loadAnormalidades();
            }, 400));
        }
        bindSortHeaders("tb-anormalidades", anomState, loadAnormalidades);

        // 2.1. Filtro por Período (Anormalidades)
        const toolbarAnom = searchAnom ? searchAnom.closest(".toolbar") : null;
        if (toolbarAnom && window.PeriodoFilter && typeof window.PeriodoFilter.createPeriodoUI === "function") {
            window.PeriodoFilter.createPeriodoUI({
                toolbarEl: toolbarAnom,
                getPeriodo: () => anomState.periodo,
                setPeriodo: (p) => {
                    anomState.periodo = p;
                    anomState.page = 1;
                    loadAnormalidades();
                }
            });
        }

        // 3. Carga Inicial
        loadOperacoes();
        loadAnormalidades();
    });

})();