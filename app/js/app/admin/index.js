(function () {
    "use strict";

    // --- Estado das Tabelas ---
    const stateOp = {
        page: 1,
        limit: 10,
        search: "",
        sort: "nome", // Padrão definido no backend
        dir: "asc"
    };

    const stateChk = {
        page: 1,
        limit: 10,
        search: "",
        sort: "data", // Padrão definido no backend
        dir: "desc",
        periodo: null, // ← aqui vamos guardar o JSON { ranges: [...] }
    };

    // --- Helpers Genéricos ---

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

    /**
     * Função Debounce: Executa 'func' apenas após 'wait' milissegundos
     * sem novos eventos. Usada para o input de busca.
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- Renderização de Paginação ---
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

        if (btnPrev) btnPrev.onclick = () => onPageChange(current - 1);
        if (btnNext) btnNext.onclick = () => onPageChange(current + 1);
    }

    // --- Fetch Autenticado ---
    async function fetchJson(url) {
        if (!window.Auth || typeof Auth.authFetch !== 'function') {
            console.error("Auth module not loaded");
            return null;
        }
        try {
            const resp = await Auth.authFetch(url);
            if (!resp.ok) throw new Error("HTTP " + resp.status);
            return await resp.json();
        } catch (e) {
            console.error("Fetch error:", e);
            return { ok: false, data: [] };
        }
    }

    // --- Gerenciamento Visual de Ordenação ---
    function updateHeaderIcons(tableId, state) {
        const headers = document.querySelectorAll(`#${tableId} th.sortable`);
        headers.forEach(th => {
            th.classList.remove("asc", "desc"); // Remove classes anteriores
            if (th.dataset.sort === state.sort) {
                th.classList.add(state.dir); // Adiciona a direção atual na coluna ativa
            }
        });
    }

    function bindSortHeaders(tableId, stateObj, loadFunc) {
        const headers = document.querySelectorAll(`#${tableId} th.sortable`);
        headers.forEach(th => {
            th.addEventListener("click", () => {
                const col = th.dataset.sort;

                // Se clicou na mesma coluna, inverte a direção
                if (stateObj.sort === col) {
                    stateObj.dir = stateObj.dir === "asc" ? "desc" : "asc";
                } else {
                    // Nova coluna: define como ativa e reseta para ASC (ou padrão desejado)
                    stateObj.sort = col;
                    stateObj.dir = "asc";
                }

                // Volta para a página 1 ao reordenar
                stateObj.page = 1;

                loadFunc(); // Recarrega os dados
            });
        });
    }

    // =========================================================
    // --- 1. Lógica de Operadores ---
    // =========================================================

    async function loadOperadores() {
        updateHeaderIcons("tb-operadores", stateOp);

        const endpoint = AppConfig.endpoints.adminDashboard.operadores;
        // Monta QueryString com search, sort e dir
        const params = new URLSearchParams({
            page: stateOp.page,
            limit: stateOp.limit,
            search: stateOp.search,
            sort: stateOp.sort,
            dir: stateOp.dir
        });

        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;
        const resp = await fetchJson(url);

        const tbody = document.querySelector("#tb-operadores tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhum operador encontrado.</td></tr>`;
            renderPaginationControls("pag-operadores", null, null);
            return;
        }

        data.forEach(op => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${op.nome_completo}</strong></td>
                <td>${op.email}</td>
                <td><span class="text-gray">${op.status_local}</span></td>
                <td>${op.hora_entrada}</td>
                <td>${op.hora_saida}</td>
            `;
            tr.style.cursor = "pointer";
            tr.title = "Dê um duplo-clique para ver detalhes (Em breve)";
            tr.addEventListener("dblclick", () => {
                // Futuro: window.location.href = `/admin/info_operador.html?id=${op.id}`;
                alert("Detalhes do operador: Funcionalidade futura.");
            });
            tbody.appendChild(tr);
        });

        renderPaginationControls("pag-operadores", meta, (newPage) => {
            stateOp.page = newPage;
            loadOperadores();
        });
    }

    // =========================================================
    // --- 2. Lógica de Checklists ---
    // =========================================================

    async function loadChecklists() {
        updateHeaderIcons("tb-checklists", stateChk);

        const endpoint = AppConfig.endpoints.adminDashboard.checklists;
        const params = new URLSearchParams({
            page: stateChk.page,
            limit: stateChk.limit,
            search: stateChk.search,
            sort: stateChk.sort,
            dir: stateChk.dir,
        });

        // Se houver filtro de período configurado, envia como JSON
        if (stateChk.periodo) {
            params.set("periodo", JSON.stringify(stateChk.periodo));
        }

        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;
        const resp = await fetchJson(url);

        const tbody = document.querySelector("#tb-checklists tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum checklist encontrado.</td></tr>`;
            renderPaginationControls("pag-checklists", null, null);
            return;
        }

        data.forEach(chk => {
            const trParent = document.createElement("tr");
            trParent.className = "accordion-parent";

            // Calcula o status geral do checklist: se tiver pelo menos 1 Falha → "Falha" em vermelho; senão "Ok" em verde
            const itens = chk.itens || [];
            const hasFailure = itens.some(it => it.status === "Falha");
            const statusColor = hasFailure ? "red" : "green";
            const statusWeight = hasFailure ? "bold" : "normal";
            const statusText = itens.length
                ? (hasFailure ? "Falha" : "Ok")
                : "--";

            trParent.innerHTML = `
                <td><span class="toggle-icon">▶</span></td>
                <td><strong>${chk.sala_nome}</strong></td>
                <td>${fmtDate(chk.data)}</td>
                <td>${chk.operador}</td>
                <td>${fmtTime(chk.inicio)}</td>
                <td>${fmtTime(chk.termino)}</td>
                <td>${chk.duracao || '--'}</td>
                <td style="color:${statusColor}; font-weight:${statusWeight}">${statusText}</td>
                <td>
                    <button class="btn-xs btn-form">Formulário 📄</button>
                </td>
            `;

            const trChild = document.createElement("tr");
            trChild.className = "accordion-child";

            let itemsHtml = "";
            if (chk.itens && chk.itens.length > 0) {
                itemsHtml = `
                    <table class="sub-table">
                        <thead>
                            <tr>
                                <th>Item verificado</th>
                                <th style="width:100px;">Status</th>
                                <th>Descrição da Falha</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chk.itens.map(it => {
                    const color = it.status === 'Ok' ? 'green' : 'red';
                    const weight = it.status === 'Falha' ? 'bold' : 'normal';
                    return `
                                    <tr>
                                        <td>${it.item}</td>
                                        <td style="color:${color}; font-weight:${weight}">${it.status}</td>
                                        <td>${it.falha || '-'}</td>
                                    </tr>
                                `;
                }).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                itemsHtml = `<div style="padding:10px; color:#666;">Nenhum item registrado.</div>`;
            }

            trChild.innerHTML = `
                <td colspan="9">
                    <div class="sub-table-wrap">
                        <strong>Detalhes da Verificação:</strong>
                        <div style="margin-top:8px;">${itemsHtml}</div>
                    </div>
                </td>
            `;

            // Toggle Accordion
            trParent.addEventListener("click", (e) => {
                if (e.target.closest('.btn-form')) return;
                trParent.classList.toggle("open");
                if (trParent.classList.contains("open")) {
                    trChild.classList.add("visible");
                } else {
                    trChild.classList.remove("visible");
                }
            });

            // Botão Formulário
            const btnForm = trParent.querySelector(".btn-form");
            btnForm.addEventListener("click", (e) => {
                e.stopPropagation();
                if (chk.id) {
                    window.open(`/admin/form_checklist.html?checklist_id=${chk.id}`, '_blank');
                }
            });

            tbody.appendChild(trParent);
            tbody.appendChild(trChild);
        });

        renderPaginationControls("pag-checklists", meta, (newPage) => {
            stateChk.page = newPage;
            loadChecklists();
        });
    }

    // =========================================================
    // --- Inicialização ---
    // =========================================================
    document.addEventListener("DOMContentLoaded", () => {
        // 1. Bind Busca Operadores
        const searchOp = document.getElementById("search-operadores");
        if (searchOp) {
            searchOp.addEventListener("input", debounce((e) => {
                stateOp.search = e.target.value.trim();
                stateOp.page = 1; // Reseta para a primeira página ao buscar
                loadOperadores();
            }, 400)); // Aguarda 400ms após parar de digitar
        }

        // 2. Bind Busca Checklists
        const searchChk = document.getElementById("search-checklists");
        if (searchChk) {
            searchChk.addEventListener("input", debounce((e) => {
                stateChk.search = e.target.value.trim();
                stateChk.page = 1;
                loadChecklists();
            }, 400));
        }

        // 2.1. Filtro por Período (Checklists)
        const toolbarChk = searchChk ? searchChk.closest(".toolbar") : null;
        if (toolbarChk && window.PeriodoFilter && typeof window.PeriodoFilter.createPeriodoUI === "function") {
            window.PeriodoFilter.createPeriodoUI({
                toolbarEl: toolbarChk,
                getPeriodo: () => stateChk.periodo,
                setPeriodo: (p) => {
                    stateChk.periodo = p;
                    stateChk.page = 1;
                    loadChecklists();
                }
            });
        }

        // 3. Bind Header Clicks (Ordenação)
        bindSortHeaders("tb-operadores", stateOp, loadOperadores);
        bindSortHeaders("tb-checklists", stateChk, loadChecklists);

        // 4. Carga Inicial
        loadOperadores();
        loadChecklists();
    });

})();