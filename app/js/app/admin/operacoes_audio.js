(function () {
    "use strict";

    // --- Estado da Tabela de Operações (Sessões) ---
    const stateOps = {
        page: 1,
        limit: 10,
        search: "",
        sort: "data",
        dir: "desc"
    };

    // --- Novo Estado da Tabela de Anormalidades (Master-Detail) ---
    const anomState = {
        // paginação é controlada individualmente por sala (scoped pagination),
        // então não guardamos 'page' global aqui.
        search: "",       // Filtro global em cascata
        sort: "data",     // Ordenação padrão da sub-tabela
        dir: "desc"       // Direção padrão
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
            dir: stateOps.dir
        });

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
    // --- LÓGICA DA TABELA DE ANORMALIDADES (AGRUPADA POR SALA) ---
    // =================================================================

    // 1. Carrega a lista de salas (Linhas Mestre) - COM FILTRO
    async function loadSalasComAnormalidades() {
        const endpoint = AppConfig.endpoints.adminDashboard.anormalidades.salas;
        // Passa o termo de busca para filtrar quais salas aparecem
        const params = new URLSearchParams();
        if (anomState.search) {
            params.set("search", anomState.search);
        }

        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;

        const resp = await fetchJson(url);
        const tbody = document.querySelector("#tb-anormalidades tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" class="empty-state">Nenhuma anormalidade encontrada com este filtro.</td></tr>`;
            return;
        }

        // Se houver busca ativa, podemos optar por abrir as salas automaticamente
        // mas vamos manter fechado para não poluir, a menos que seja 1 só.
        const shouldAutoOpen = (data.length === 1 && anomState.search.length > 0);

        data.forEach(sala => {
            const trParent = document.createElement("tr");
            trParent.className = "accordion-parent";
            trParent.dataset.salaId = sala.id;
            // "loaded" indica se já buscamos o detalhe dessa sala com o filtro atual
            trParent.dataset.loaded = "false";

            trParent.innerHTML = `
                <td><span class="toggle-icon">▶</span></td>
                <td><strong>${sala.nome}</strong></td>
            `;

            const trChild = document.createElement("tr");
            trChild.className = "accordion-child";
            trChild.id = `child-sala-${sala.id}`;
            trChild.innerHTML = `
                <td colspan="2">
                    <div class="sub-table-wrap">
                        <div id="container-anom-${sala.id}" style="min-height:50px;">
                            <span class="muted">Carregando histórico...</span>
                        </div>
                        <div id="pag-anom-sala-${sala.id}" class="pagination-controls" style="margin-top:8px;"></div>
                    </div>
                </td>
            `;

            // Função toggle
            const toggleFn = () => {
                const isOpen = trParent.classList.contains("open");
                trParent.classList.toggle("open");
                if (!isOpen) {
                    trChild.classList.add("visible");
                    // Se não foi carregado OU se tem busca ativa (pra atualizar filtro interno), recarrega
                    // Na prática, sempre que abrir com busca diferente, deveria recarregar.
                    // Vamos simplificar: ao abrir, chama loadAnormalidadesDaSala passando o state atual.
                    loadAnormalidadesDaSala(sala.id, 1);
                } else {
                    trChild.classList.remove("visible");
                }
            };

            trParent.addEventListener("click", toggleFn);

            tbody.appendChild(trParent);
            tbody.appendChild(trChild);

            if (shouldAutoOpen) {
                toggleFn();
            }
        });
    }

    // 2. Carrega as Anormalidades de uma Sala Específica (Paginado + Filtrado + Ordenado)
    async function loadAnormalidadesDaSala(salaId, page = 1) {
        const limit = 10;
        const endpoint = AppConfig.endpoints.adminDashboard.anormalidades.lista;

        // Passa estado global de Anormalidades para a sub-query
        const params = new URLSearchParams({
            sala_id: salaId,
            page: page,
            limit: limit,
            search: anomState.search,
            sort: anomState.sort,
            dir: anomState.dir
        });

        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;

        const container = document.getElementById(`container-anom-${salaId}`);
        const pagContainerId = `pag-anom-sala-${salaId}`;

        if (!container) return;

        container.style.opacity = "0.5";

        const resp = await fetchJson(url);

        container.style.opacity = "1";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:10px;">Nenhum registro encontrado.</div>`;
            renderPaginationControls(pagContainerId, null, null);
            return;
        }

        // Renderiza sub-tabela com headers ordenáveis
        // Helper para setar classe de icone
        const getSortClass = (col) => {
            if (anomState.sort === col) return "sortable " + anomState.dir;
            return "sortable";
        };

        let html = `
            <table class="sub-table" id="subtable-${salaId}">
                <thead>
                    <tr>
                        <th class="${getSortClass('data')}" data-col="data">Data</th>
                        <th class="${getSortClass('registrado_por')}" data-col="registrado_por">Registrado por</th>
                        <th class="${getSortClass('descricao')}" data-col="descricao">Descrição</th>
                        <th class="${getSortClass('solucionada')}" data-col="solucionada">Solucionada</th>
                        <th>Prejuízo</th>
                        <th>Reclamação</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(row => {
            const dateStr = fmtDate(row.data);
            const solucaoBadge = row.solucionada
                ? `<span class="text-green bold">Sim</span>`
                : `<span class="text-red">Não</span>`;

            const prejText = row.houve_prejuizo ? "Sim" : "Não";
            const prejClass = row.houve_prejuizo ? "text-red bold" : "text-gray";

            const reclText = row.houve_reclamacao ? "Sim" : "Não";
            const reclClass = row.houve_reclamacao ? "text-red bold" : "text-gray";

            // Corta descrição longa
            const desc = row.descricao && row.descricao.length > 60
                ? row.descricao.substring(0, 60) + "..."
                : (row.descricao || "");

            html += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${row.registrado_por}</td>
                    <td title="${row.descricao}">${desc}</td>
                    <td>${solucaoBadge}</td>
                    <td class="${prejClass}">${prejText}</td>
                    <td class="${reclClass}">${reclText}</td>
                    <td>
                        <button class="btn-xs btn-ver-anom" data-id="${row.id}">Formulário 📄</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Renderiza paginação "local" da sala
        renderPaginationControls(pagContainerId, meta, (newPage) => {
            loadAnormalidadesDaSala(salaId, newPage);
        });

        // Bind botões de formulário
        container.querySelectorAll(".btn-ver-anom").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                window.open(`/admin/form_anormalidade.html?id=${id}`, '_blank');
            });
        });

        // Bind Headers da Sub-tabela (Ordenação Dinâmica)
        bindDynamicSortHeaders(salaId);
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
        bindSortHeaders("tb-operacoes", stateOps, loadOperacoes);

        // 2. Tabela de Anormalidades (Busca Cascata)
        const searchAnom = document.getElementById("search-anormalidades");
        if (searchAnom) {
            searchAnom.addEventListener("input", debounce((e) => {
                const val = e.target.value.trim();
                // Se mudou a busca, reseta state para default
                anomState.search = val;
                // Recarrega a lista Mestre (Salas) filtrada
                loadSalasComAnormalidades();
            }, 400));
        }
        // Nota: A ordenação de Anormalidades é bindada dinamicamente dentro de loadAnormalidadesDaSala

        // 3. Carga Inicial
        loadOperacoes();
        loadSalasComAnormalidades();
    });

})();