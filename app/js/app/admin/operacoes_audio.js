(function () {
    "use strict";

    // --- Estado da Tabela de Operações (Sessões) ---
    const stateOps = {
        page: 1,
        limit: 10,
        search: "",
        sort: "data",
        dir: "desc",
        periodo: null,   // filtro de período para sessões de operação
        groupBySala: true, // NOVO: controla se a tabela está agrupada por sala (default = true)
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

        // Quando não há registros ou não faz sentido paginar
        if (!meta || !meta.total || typeof onPageChange !== "function") {
            container.innerHTML = "";
            return;
        }

        const current = meta.page || 1;
        const totalPages = meta.pages || 1;
        const totalRecords = meta.total || 0;

        const isFirstPage = current <= 1;
        const isLastPage = current >= totalPages;

        container.innerHTML = `
            <span class="pagination-info">
                Página <strong>${current}</strong> de <strong>${totalPages}</strong> (Total: ${totalRecords})
            </span>
            <div class="pagination-nav">
                <button class="btn-page" id="first-${containerId}" ${isFirstPage ? "disabled" : ""}>&lt;&lt;</button>
                <button class="btn-page" id="prev-${containerId}" ${isFirstPage ? "disabled" : ""}>&lt;</button>

                <input
                    type="number"
                    id="page-input-${containerId}"
                    class="page-input"
                    min="1"
                    max="${totalPages}"
                    value="${current}"
                />

                <button class="btn-page" id="go-${containerId}">Ir</button>

                <button class="btn-page" id="next-${containerId}" ${isLastPage ? "disabled" : ""}>&gt;</button>
                <button class="btn-page" id="last-${containerId}" ${isLastPage ? "disabled" : ""}>&gt;&gt;</button>
            </div>
        `;

        const input = document.getElementById(`page-input-${containerId}`);
        const btnFirst = document.getElementById(`first-${containerId}`);
        const btnPrev = document.getElementById(`prev-${containerId}`);
        const btnGo = document.getElementById(`go-${containerId}`);
        const btnNext = document.getElementById(`next-${containerId}`);
        const btnLast = document.getElementById(`last-${containerId}`);

        const goToPage = (page) => {
            let target = parseInt(page, 10);
            if (isNaN(target)) return;

            if (target < 1) target = 1;
            if (target > totalPages) target = totalPages;

            if (target === current) return;

            onPageChange(target);
        };

        if (btnFirst) {
            btnFirst.onclick = (e) => {
                e.stopPropagation();
                goToPage(1);
            };
        }

        if (btnPrev) {
            btnPrev.onclick = (e) => {
                e.stopPropagation();
                goToPage(current - 1);
            };
        }

        if (btnNext) {
            btnNext.onclick = (e) => {
                e.stopPropagation();
                goToPage(current + 1);
            };
        }

        if (btnLast) {
            btnLast.onclick = (e) => {
                e.stopPropagation();
                goToPage(totalPages);
            };
        }

        if (btnGo && input) {
            btnGo.onclick = (e) => {
                e.stopPropagation();
                goToPage(input.value);
            };

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    goToPage(input.value);
                }
            });
        }
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
        const table = document.getElementById("tb-operacoes");
        if (!table) return;

        const thead = table.querySelector("thead");
        const tbody = table.querySelector("tbody");
        if (!thead || !tbody) return;

        // 1) Cabeçalho + comportamento visual conforme o modo
        if (stateOps.groupBySala) {
            // Modo AGRUPADO (como já era)
            table.classList.remove("table-hover");

            thead.innerHTML = `
                <tr>
                    <th style="width: 20px;"></th>
                    <th class="sortable" data-sort="sala">Sala</th>
                    <th class="sortable" data-sort="data">Data</th>
                    <th class="sortable" data-sort="autor">1º Registro por</th>
                    <th>Checklist?</th>
                    <th class="sortable" data-sort="em_aberto">Em Aberto?</th>
                </tr>
            `;
        } else {
            // Modo LISTA PLANA (sem sublinhas, uma linha por entrada)
            // Aqui a tabela principal ganha hover + cursor de mão
            table.classList.add("table-hover");

            thead.innerHTML = `
                <tr>
                    <th class="sortable" data-sort="sala">Sala</th>
                    <th class="sortable" data-sort="data">Data</th>
                    <th>Operador</th>
                    <th>Tipo</th>
                    <th>Evento</th>
                    <th>Pauta</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Anormalidade?</th>
                </tr>
            `;
        }

        // Reaplica ordenação nos headers recém-criados
        bindSortHeaders("tb-operacoes", stateOps, loadOperacoes);
        updateHeaderIcons("tb-operacoes", stateOps);

        // 2) Escolhe o endpoint correto
        const endpoint = stateOps.groupBySala
            ? AppConfig.endpoints.adminDashboard.operacoes            // sessões (agrupado)
            : AppConfig.endpoints.adminDashboard.operacoesEntradas;  // lista plana de entradas

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

        tbody.innerHTML = "";

        const data = (resp && resp.data) || [];
        const meta = (resp && resp.meta) || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            const colspan = stateOps.groupBySala ? 6 : 9;
            tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty-state">Nenhum registro encontrado.</td></tr>`;
            renderPaginationControls("pag-operacoes", null, null);
            return;
        }

        if (stateOps.groupBySala) {
            // -----------------------------------------------------
            // MODO AGRUPADO: mesma lógica anterior (sessão + sublinhas)
            // -----------------------------------------------------
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

                // Eventos de abrir/fechar
                trParent.addEventListener("click", () => {
                    trParent.classList.toggle("open");
                    if (trParent.classList.contains("open")) {
                        trChild.classList.add("visible");
                    } else {
                        trChild.classList.remove("visible");
                    }
                });

                // Duplo clique nas sublinhas
                const entryRows = trChild.querySelectorAll(".entry-row");
                entryRows.forEach(row => {
                    row.addEventListener("dblclick", () => {
                        const entradaId = row.getAttribute("data-id");
                        if (entradaId) {
                            window.open(`/admin/form_operacao.html?entrada_id=${entradaId}`, "_blank");
                        }
                    });
                });

                tbody.appendChild(trParent);
                tbody.appendChild(trChild);
            });
        } else {
            // -----------------------------------------------------
            // MODO LISTA PLANA: uma linha por entrada (sem sublinhas)
            // -----------------------------------------------------
            data.forEach(item => {
                const tr = document.createElement("tr");
                tr.className = "entry-row";
                tr.setAttribute("title", "Duplo-clique para ver o formulário detalhado");

                const anomStyle = item.anormalidade ? 'color:red; font-weight:bold;' : 'color:green;';
                const anomText = item.anormalidade ? 'SIM' : 'Não';

                tr.innerHTML = `
                    <td><strong>${item.sala}</strong></td>
                    <td>${fmtDate(item.data)}</td>
                    <td>${item.operador}</td>
                    <td>${item.tipo}</td>
                    <td>${item.evento || '-'}</td>
                    <td>${fmtTime(item.pauta)}</td>
                    <td>${fmtTime(item.inicio)}</td>
                    <td>${fmtTime(item.fim)}</td>
                    <td style="${anomStyle}">${anomText}</td>
                `;

                tr.addEventListener("dblclick", () => {
                    const entradaId = item.id;
                    if (entradaId) {
                        window.open(`/admin/form_operacao.html?entrada_id=${entradaId}`, "_blank");
                    }
                });

                tbody.appendChild(tr);
            });
        }

        // Paginação: agora usa meta.total que já vem certo do backend
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

        // 1.1. Filtro por Período (Operações) + checkbox "Agrupar por sala"
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

            // Depois de criar o filtro de período, pegamos a linha do "Filtrar por data"
            const sectionHeader = toolbarOps.closest(".section-header");
            let dateFilterLine = null;
            let inlineControls = null;

            if (sectionHeader) {
                const wrapper = sectionHeader.nextElementSibling;
                if (wrapper && wrapper.classList.contains("date-filter-wrapper")) {
                    dateFilterLine = wrapper.querySelector(".date-filter-line");
                    inlineControls = wrapper.querySelector(".date-filter-inline");
                }
            }

            // Cria o checkbox "Agrupar por sala"
            const lblGroup = document.createElement("label");
            lblGroup.className = "date-filter-toggle";
            lblGroup.innerHTML = `
                <input type="checkbox" id="chk-group-by-sala" checked>
                <span>Agrupar por sala</span>
            `;

            // Insere bem perto do "Filtrar por data"
            if (dateFilterLine && inlineControls) {
                dateFilterLine.insertBefore(lblGroup, inlineControls);
            } else if (dateFilterLine) {
                dateFilterLine.appendChild(lblGroup);
            } else if (toolbarOps) {
                // Fallback: dentro da própria toolbar (caso algo mude no HTML)
                toolbarOps.appendChild(lblGroup);
            }

            const chkGroup = lblGroup.querySelector("#chk-group-by-sala");
            if (chkGroup) {
                chkGroup.checked = stateOps.groupBySala;
                chkGroup.addEventListener("change", (e) => {
                    stateOps.groupBySala = e.target.checked;
                    stateOps.page = 1;
                    loadOperacoes();
                });
            }
        }

        // 2. Tabela de Anormalidades (Busca + ordenação)
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