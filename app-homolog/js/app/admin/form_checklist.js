(function () {
    "use strict";

    // Pega o ID da URL
    const params = new URLSearchParams(window.location.search);
    const checklistId = params.get("checklist_id");

    if (!checklistId) {
        alert("ID de checklist não fornecido.");
        window.close();
        return;
    }

    // Helper simples para setar valor em inputs
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
    };

    // Helper para formatar data (YYYY-MM-DD -> DD/MM/YYYY)
    const fmtDate = (d) => {
        if (!d) return "";
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return d;
    };

    // Helper para formatar hora (HH:MM:SS -> HH:MM)
    const fmtTime = (t) => {
        if (!t) return "";
        return t.substring(0, 5);
    };

    async function loadData() {
        const url = `${AppConfig.apiUrl(AppConfig.endpoints.adminDashboard.detalheChecklist)}?checklist_id=${checklistId}`;

        if (!window.Auth || typeof Auth.authFetch !== 'function') {
            console.error("Auth não carregado");
            return;
        }

        try {
            const resp = await Auth.authFetch(url);
            if (!resp.ok) throw new Error("Erro HTTP " + resp.status);

            const json = await resp.json();
            if (!json.ok || !json.data) throw new Error("Dados não encontrados");

            const d = json.data;

            // Preenche Header
            document.getElementById("display-id").textContent = d.id;

            // Preenche Campos
            setVal("data_operacao", fmtDate(d.data_operacao));
            setVal("sala_nome", d.sala_nome);
            setVal("turno", d.turno);
            setVal("hora_inicio", fmtTime(d.hora_inicio));
            setVal("hora_termino", fmtTime(d.hora_termino));
            setVal("duracao", d.duracao);
            setVal("usb_01", d.usb_01);
            setVal("usb_02", d.usb_02);
            setVal("observacoes", d.observacoes);
            setVal("operador_nome", d.operador_nome || "Sistema");

            // Renderiza Itens
            renderItens(d.itens || []);

        } catch (e) {
            alert("Erro ao carregar dados: " + e.message);
            console.error(e);
        }
    }

    function renderItens(itens) {
        const container = document.getElementById("checklist-items-container");
        if (!container) return;

        if (itens.length === 0) {
            container.innerHTML = '<div class="muted">Nenhum item registrado.</div>';
            return;
        }

        let html = '';
        itens.forEach(it => {
            const statusClass = it.status === 'Ok' ? 'status-ok' : 'status-falha';
            const statusIcon = it.status === 'Ok' ? '✅' : '❌';

            // Só mostra a descrição se houver falha e texto
            let descHtml = '';
            if (it.status === 'Falha' && it.descricao_falha) {
                descHtml = `
                    <div class="falha-box">
                        <strong>Descrição da falha:</strong> ${it.descricao_falha}
                    </div>
                `;
            }

            html += `
                <div class="check-item-readonly">
                    <div class="check-header">
                        <span class="check-label">${it.item_nome}</span>
                        <span class="check-status ${statusClass}">
                            ${statusIcon} ${it.status}
                        </span>
                    </div>
                    ${descHtml}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    document.addEventListener("DOMContentLoaded", loadData);

})();