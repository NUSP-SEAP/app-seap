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

    // --- 1. Tabela Operadores ---
    async function loadOperadores(page = 1) {
        const endpoint = AppConfig.endpoints.adminDashboard.operadores;
        const url = `${AppConfig.apiUrl(endpoint)}?page=${page}&limit=10`;

        const resp = await fetchJson(url);

        const tbody = document.querySelector("#tb-operadores tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhum operador encontrado.</td></tr>`;
            const pagContainer = document.getElementById("pag-operadores");
            if (pagContainer) pagContainer.innerHTML = "";
            return;
        }

        data.forEach(op => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${op.nome_completo}</strong></td>
                <td>${op.email}</td>
                <td><span class="badge gray">${op.status_local}</span></td>
                <td>${op.hora_entrada}</td>
                <td>${op.hora_saida}</td>
            `;

            tr.style.cursor = "pointer";
            tr.title = "Dê um duplo-clique para ver detalhes (Em breve)";

            tr.addEventListener("dblclick", () => {
                alert("Detalhes do operador: Funcionalidade futura.");
            });

            tbody.appendChild(tr);
        });

        renderPaginationControls("pag-operadores", meta, loadOperadores);
    }

    // --- 2. Tabela Checklists ---
    async function loadChecklists(page = 1) {
        const endpoint = AppConfig.endpoints.adminDashboard.checklists;
        const url = `${AppConfig.apiUrl(endpoint)}?page=${page}&limit=10`;

        const resp = await fetchJson(url);
        const tbody = document.querySelector("#tb-checklists tbody");

        if (!tbody) return;
        tbody.innerHTML = "";

        const data = resp.data || [];
        const meta = resp.meta || { page: 1, pages: 1, total: 0 };

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum checklist encontrado.</td></tr>`;
            const pagContainer = document.getElementById("pag-checklists");
            if (pagContainer) pagContainer.innerHTML = "";
            return;
        }

        data.forEach(chk => {
            const trParent = document.createElement("tr");
            trParent.className = "accordion-parent";
            trParent.innerHTML = `
                <td><span class="toggle-icon">▶</span></td>
                <td><strong>${chk.sala_nome}</strong></td>
                <td>${fmtDate(chk.data)}</td>
                <td>${chk.operador}</td>
                <td>${fmtTime(chk.inicio)}</td>
                <td>${fmtTime(chk.termino)}</td>
                <td>${chk.duracao || '--'}</td>
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
                <td colspan="8">
                    <div class="sub-table-wrap">
                        <strong>Detalhes da Verificação:</strong>
                        <div style="margin-top:8px;">${itemsHtml}</div>
                    </div>
                </td>
            `;

            trParent.addEventListener("click", (e) => {
                if (e.target.closest('.btn-form')) return;
                trParent.classList.toggle("open");
                if (trParent.classList.contains("open")) {
                    trChild.classList.add("visible");
                } else {
                    trChild.classList.remove("visible");
                }
            });

            // --- AÇÃO DO BOTÃO FORMULÁRIO (Atualizado) ---
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

        renderPaginationControls("pag-checklists", meta, loadChecklists);
    }

    // --- Inicialização ---
    document.addEventListener("DOMContentLoaded", () => {
        loadOperadores(1);
        loadChecklists(1);
    });

})();