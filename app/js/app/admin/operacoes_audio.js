(function () {
    "use strict";

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

    // --- Helper de Paginação ---
    // (Incluído aqui para garantir que funcione nesta página isolada)
    function renderPaginationControls(containerId, meta, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Se não houver meta ou total for 0, limpa e sai
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

        // Bind dos eventos
        const btnPrev = document.getElementById(`prev-${containerId}`);
        const btnNext = document.getElementById(`next-${containerId}`);

        if (btnPrev) btnPrev.onclick = () => onPageChange(current - 1);
        if (btnNext) btnNext.onclick = () => onPageChange(current + 1);
    }

    // --- Fetch Autenticado que retorna o JSON completo ---
    async function fetchJson(url) {
        if (!window.Auth || typeof Auth.authFetch !== 'function') {
            console.error("Auth não carregado");
            return null;
        }
        try {
            const resp = await Auth.authFetch(url);
            if (!resp.ok) throw new Error("HTTP " + resp.status);
            // Retorna o objeto inteiro: { ok: true, data: [...], meta: {...} }
            return await resp.json();
        } catch (e) {
            console.error(e);
            return { ok: false, data: [] }; // Retorno seguro em caso de erro
        }
    }

    // --- Carregar Operações (Paginado) ---
    async function loadOperacoes(page = 1) {
        // Monta a URL com ?page=X&limit=10
        const endpoint = AppConfig.endpoints.adminDashboard.operacoes;
        const url = `${AppConfig.apiUrl(endpoint)}?page=${page}&limit=10`;

        const resp = await fetchJson(url);
        const tbody = document.querySelector("#tb-operacoes tbody");

        if (!tbody) return;
        tbody.innerHTML = "";

        // Extrai dados e meta
        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum registro de operação encontrado.</td></tr>`;
            const pagContainer = document.getElementById("pag-operacoes");
            if (pagContainer) pagContainer.innerHTML = "";
            return;
        }

        // Renderiza as linhas
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

            // 3. Eventos
            trParent.addEventListener("click", () => {
                trParent.classList.toggle("open");
                if (trParent.classList.contains("open")) {
                    trChild.classList.add("visible");
                } else {
                    trChild.classList.remove("visible");
                }
            });

            // Duplo clique na sublinha
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

        // 4. Renderiza Paginação (Chamada CRUCIAL)
        renderPaginationControls("pag-operacoes", meta, loadOperacoes);
    }

    // =================================================================
    // --- LÓGICA DA TABELA DE ANORMALIDADES (AGRUPADA POR SALA) ---
    // =================================================================

    // 1. Carrega a lista de salas (Linhas Mestre)
    async function loadSalasComAnormalidades() {
        const endpoint = AppConfig.endpoints.adminDashboard.anormalidades.salas;
        const url = AppConfig.apiUrl(endpoint);

        const resp = await fetchJson(url);
        const tbody = document.querySelector("#tb-anormalidades tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" class="empty-state">Nenhuma anormalidade registrada no sistema.</td></tr>`;
            return;
        }

        data.forEach(sala => {
            // Linha Pai (Sala)
            const trParent = document.createElement("tr");
            trParent.className = "accordion-parent";
            trParent.dataset.salaId = sala.id; // Guarda ID para lazy load
            trParent.dataset.loaded = "false"; // Flag para carregar só na 1ª vez

            trParent.innerHTML = `
                <td><span class="toggle-icon">▶</span></td>
                <td><strong>${sala.nome}</strong></td>
            `;

            // Linha Filha (Container da Tabela Interna)
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

            // Evento de Click na Sala
            trParent.addEventListener("click", () => {
                const isOpen = trParent.classList.contains("open");

                // Toggle visual
                trParent.classList.toggle("open");
                if (!isOpen) {
                    trChild.classList.add("visible");
                    // Lazy Load: Se nunca carregou, busca a página 1 agora
                    if (trParent.dataset.loaded === "false") {
                        loadAnormalidadesDaSala(sala.id, 1);
                        trParent.dataset.loaded = "true";
                    }
                } else {
                    trChild.classList.remove("visible");
                }
            });

            tbody.appendChild(trParent);
            tbody.appendChild(trChild);
        });
    }

    // 2. Carrega as Anormalidades de uma Sala Específica (Paginado)
    async function loadAnormalidadesDaSala(salaId, page = 1) {
        const limit = 10;
        const endpoint = AppConfig.endpoints.adminDashboard.anormalidades.lista;
        const url = `${AppConfig.apiUrl(endpoint)}?sala_id=${salaId}&page=${page}&limit=${limit}`;

        const container = document.getElementById(`container-anom-${salaId}`);
        const pagContainerId = `pag-anom-sala-${salaId}`;

        // Feedback visual de carregamento (opcional, suave)
        container.style.opacity = "0.5";

        const resp = await fetchJson(url);

        container.style.opacity = "1";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:10px;">Nenhum registro encontrado nesta página.</div>`;
            return;
        }

        // Renderiza Tabela Interna
        let html = `
            <table class="sub-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Registrado por</th>
                        <th>Descrição</th>
                        <th>Solucionada</th>
                        <th>Prejuízo</th>
                        <th>Reclamação</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(row => {
            const dateStr = fmtDate(row.data);

            // Tratamento de badges/cores
            const solucaoBadge = row.solucionada
                ? `<span class="text-green bold">Sim</span>`
                : `<span class="text-red">Não</span>`;

            const prejText = row.houve_prejuizo ? "Sim" : "Não";
            const prejClass = row.houve_prejuizo ? "text-red bold" : "text-gray";

            const reclText = row.houve_reclamacao ? "Sim" : "Não";
            const reclClass = row.houve_reclamacao ? "text-red bold" : "text-gray";

            // Descrição truncada se for muito longa
            const desc = row.descricao && row.descricao.length > 60
                ? row.descricao.substring(0, 60) + "..."
                : (row.descricao || "");

            html += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${row.registrado_por}</td>
                    <td>${desc}</td>
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

        // Renderiza Paginação Interna (recursiva para esta mesma função)
        renderPaginationControls(pagContainerId, meta, (newPage) => {
            loadAnormalidadesDaSala(salaId, newPage);
        });

        // Bind dos botões "Formulário" recém-criados
        container.querySelectorAll(".btn-ver-anom").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation(); // Evita fechar o accordion
                const id = btn.dataset.id;
                // Abre a página de detalhes (que implementaremos a seguir)
                window.open(`/admin/form_anormalidade.html?id=${id}`, '_blank');
            });
        });
    }

    // --- Inicialização ---
    document.addEventListener("DOMContentLoaded", () => {
        loadOperacoes(1); // Inicia na página 1
        loadSalasComAnormalidades(); // Carrega a segunda tabela (Anormalidades)
    });

})();