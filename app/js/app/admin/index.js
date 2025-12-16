(function () {
    "use strict";

    // --- Estado das Tabelas ---
    const stateOp = {
        page: 1,
        limit: 10,
        search: "",
        sort: "nome", // Padrão definido no backend
        dir: "asc",
        filters: {},  // NOVO (TableFilter)
    };

    const stateChk = {
        page: 1,
        limit: 10,
        search: "",
        sort: "data", // Padrão definido no backend
        dir: "desc",
        periodo: null, // ← aqui vamos guardar o JSON { ranges: [...] }
        filters: {},   // NOVO (TableFilter)
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

    function escapeHtml(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Renderização de Paginação ---
    function renderPaginationControls(containerId, meta, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Sem meta ou sem total → limpa a área de paginação
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
    // async function fetchJson(url) {
    //     if (!window.Auth || typeof Auth.authFetch !== 'function') {
    //         console.error("Auth module not loaded");
    //         return null;
    //     }
    //     try {
    //         const resp = await Auth.authFetch(url);
    //         if (!resp.ok) throw new Error("HTTP " + resp.status);
    //         return await resp.json();
    //     } catch (e) {
    //         console.error("Fetch error:", e);
    //         return { ok: false, data: [] };
    //     }
    // }

    async function fetchJson(url) {
        const fallbackMeta = { page: 1, pages: 1, total: 0 };

        if (!window.Auth || typeof Auth.authFetch !== "function") {
            const msg = "Auth não carregado (Auth.authFetch indisponível).";
            console.error(msg);
            return { ok: false, status: 0, error: msg, data: [], meta: fallbackMeta };
        }

        try {
            const resp = await Auth.authFetch(url);

            const text = await resp.text();
            let json = null;
            try {
                json = text ? JSON.parse(text) : null;
            } catch (_) {
                json = null;
            }

            if (!resp.ok) {
                const msg =
                    (json && (json.message || json.error)) ||
                    (text && text.trim()) ||
                    `HTTP ${resp.status}`;

                console.error("Fetch error:", resp.status, msg);
                return { ok: false, status: resp.status, error: msg, data: [], meta: fallbackMeta };
            }

            // resp.ok === true
            if (json && typeof json === "object") return json;

            const msg = "Resposta ok, mas não veio JSON.";
            console.error(msg, (text || "").slice(0, 200));
            return { ok: false, status: resp.status, error: msg, data: [], meta: fallbackMeta };
        } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            console.error("Fetch error:", msg);
            return { ok: false, status: 0, error: msg, data: [], meta: fallbackMeta };
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
        // Filtros por coluna (estilo Excel)
        if (window.TableFilter && typeof window.TableFilter.applyToParams === "function") {
            window.TableFilter.applyToParams(params, stateOp);
        }

        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;
        // const resp = await fetchJson(url);

        // const tbody = document.querySelector("#tb-operadores tbody");
        // if (!tbody) return;
        // tbody.innerHTML = "";

        // const data = resp.data || [];
        const resp = await fetchJson(url);

        const tbody = document.querySelector("#tb-operadores tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!resp || resp.ok === false) {
            const status = (resp && typeof resp.status === "number" && resp.status) ? resp.status : "??";
            const msg = (resp && resp.error) ? resp.error : "Falha ao carregar operadores.";
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Erro ao carregar operadores (HTTP ${status}). ${escapeHtml(msg)}</td></tr>`;
            renderPaginationControls("pag-operadores", null, null);
            return;
        }
        const data = Array.isArray(resp.data) ? resp.data : [];

        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        // Valores únicos (checkboxes) do filtro por coluna:
        // Agora vêm do backend (meta.distinct) para não depender da paginação.
        if (window.TableFilter) {
            if (meta.distinct && typeof window.TableFilter.applyDistinctMap === "function") {
                window.TableFilter.applyDistinctMap("tb-operadores", meta.distinct);
            } else if (typeof window.TableFilter.updateDistinctValues === "function") {
                // fallback (caso o backend ainda não esteja retornando meta.distinct)
                window.TableFilter.updateDistinctValues("tb-operadores", data);
            }
        }

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
        // Filtros por coluna (estilo Excel)
        if (window.TableFilter && typeof window.TableFilter.applyToParams === "function") {
            window.TableFilter.applyToParams(params, stateChk);
        }
        const url = `${AppConfig.apiUrl(endpoint)}?${params.toString()}`;
        // const resp = await fetchJson(url);

        // const tbody = document.querySelector("#tb-checklists tbody");
        // if (!tbody) return;
        // tbody.innerHTML = "";

        // const data = resp.data || [];

        const resp = await fetchJson(url);

        const tbody = document.querySelector("#tb-checklists tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!resp || resp.ok === false) {
            const status = (resp && typeof resp.status === "number" && resp.status) ? resp.status : "??";
            const msg = (resp && resp.error) ? resp.error : "Falha ao carregar checklists.";
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Erro ao carregar checklists (HTTP ${status}). ${escapeHtml(msg)}</td></tr>`;
            renderPaginationControls("pag-checklists", null, null);
            return;
        }

        const data = Array.isArray(resp.data) ? resp.data : [];

        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        // Valores únicos (checkboxes) do filtro por coluna (sem depender da página atual)
        if (window.TableFilter) {
            if (meta.distinct && typeof window.TableFilter.applyDistinctMap === "function") {
                window.TableFilter.applyDistinctMap("tb-checklists", meta.distinct);
            } else if (typeof window.TableFilter.updateDistinctValues === "function") {
                window.TableFilter.updateDistinctValues("tb-checklists", data);
            }
        }

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Nenhum checklist encontrado.</td></tr>`;
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

        // 3.1 Filtros por coluna (Excel-like) — Operadores
        if (window.TableFilter && typeof window.TableFilter.init === "function") {
            window.TableFilter.init({
                tableId: "tb-operadores",
                state: stateOp,
                columns: {
                    nome: { type: "text", sortable: true, sortKey: "nome", dataKey: "nome_completo", label: "Nome" },
                    email: { type: "text", sortable: true, sortKey: "email", dataKey: "email", label: "E-mail" },
                    status_local: { type: "text", sortable: true, sortKey: "status_local", dataKey: "status_local", label: "No Senado?" },
                    hora_entrada: { type: "text", sortable: true, sortKey: "hora_entrada", dataKey: "hora_entrada", label: "Entrada" },
                    hora_saida: { type: "text", sortable: true, sortKey: "hora_saida", dataKey: "hora_saida", label: "Saída" },
                },
                onChange: loadOperadores,
                debounceMs: 250,
            });

            window.TableFilter.init({
                tableId: "tb-checklists",
                state: stateChk,
                columns: {
                    sala: { type: "text", sortable: true, sortKey: "sala", dataKey: "sala_nome", label: "Sala" },
                    data: { type: "date", sortable: true, sortKey: "data", dataKey: "data", label: "Data" },
                    operador: { type: "text", sortable: true, sortKey: "operador", dataKey: "operador", label: "Verificado por" },

                    // Hora: guardamos/filtramos por HH:MM
                    inicio: {
                        type: "text",
                        sortable: true,
                        sortKey: "inicio",
                        dataKey: "inicio",
                        label: "Início",
                        toValue: (v) => (v ? String(v).substring(0, 5) : ""),
                        toLabel: (v) => (v ? String(v).substring(0, 5) : ""),
                    },
                    termino: {
                        type: "text",
                        sortable: true,
                        sortKey: "termino",
                        dataKey: "termino",
                        label: "Término",
                        toValue: (v) => (v ? String(v).substring(0, 5) : ""),
                        toLabel: (v) => (v ? String(v).substring(0, 5) : ""),
                    },

                    duracao: { type: "text", sortable: true, sortKey: "duracao", dataKey: "duracao", label: "Duração" },

                    // Status é derivado de itens (Falha / Ok / --)
                    status: {
                        type: "text",
                        sortable: true,
                        sortKey: "status",
                        label: "Status",
                        getValue: (row) => {
                            const itens = (row && Array.isArray(row.itens)) ? row.itens : [];
                            if (!itens.length) return "--";
                            const hasFailure = itens.some((it) => it && it.status === "Falha");
                            return hasFailure ? "Falha" : "Ok";
                        },
                    },

                    acoes: { filterable: false, label: "Ações" },
                },
                onChange: loadChecklists,
                debounceMs: 250,
            });
        }

        // 4. Carga Inicial
        loadOperadores();
        loadChecklists();
    });

})();