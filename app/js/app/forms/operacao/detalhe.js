(function () {
    "use strict";

    const params = new URLSearchParams(window.location.search);
    const entradaId = params.get("entrada_id");

    if (!entradaId) {
        alert("ID de entrada não fornecido.");
        window.close();
        return;
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
    };

    const setRadio = (name, val) => {
        if (val === undefined || val === null) return;
        let normalized = String(val).toLowerCase().trim();

        if (name === "houve_anormalidade") {
            if (
                normalized === "true" ||
                normalized === "t" ||
                normalized === "1" ||
                normalized === "sim" ||
                normalized === "s"
            ) {
                normalized = "sim";
            } else {
                normalized = "nao";
            }
        }

        const radios = document.querySelectorAll(`input[name="${name}"]`);
        if (radios && radios.length) {
            radios.forEach((radio) => {
                radio.checked =
                    String(radio.value).toLowerCase().trim() === normalized;
            });
        }
    };

    async function loadData() {
        // Usa o endpoint do operador (não do admin)
        const url = `${AppConfig.apiUrl(AppConfig.endpoints.operadorDashboard.detalheOperacao)}?entrada_id=${entradaId}`;

        if (!window.Auth || typeof Auth.authFetch !== "function") {
            console.error("Auth não carregado");
            return;
        }

        try {
            const resp = await Auth.authFetch(url);
            if (!resp.ok) throw new Error("Erro HTTP " + resp.status);

            const json = await resp.json();
            if (!json.ok || !json.data) {
                throw new Error("Registro não encontrado.");
            }

            const d = json.data;

            // Local
            setVal("sala_nome", d.sala_nome || d.sala_id || "");

            // Atividade Legislativa
            setVal("atividade_legislativa", d.comissao_nome || "");

            // Descrição + Responsável
            setVal("nome_evento", d.nome_evento || "");
            setVal("responsavel_evento", d.responsavel_evento || "");

            // Datas / horários
            setVal("data_operacao", d.data_operacao || "");
            setVal("horario_pauta", d.horario_pauta ? String(d.horario_pauta).substring(0, 5) : "");
            setVal("hora_inicio", d.hora_inicio ? String(d.hora_inicio).substring(0, 5) : "");
            setVal("hora_fim", d.hora_fim ? String(d.hora_fim).substring(0, 5) : "");

            // Trilhas e observações
            setVal("usb_01", d.usb_01 || "");
            setVal("usb_02", d.usb_02 || "");
            setVal("observacoes", d.observacoes || "");

            // Houve anormalidade?
            setRadio("houve_anormalidade", d.houve_anormalidade);
        } catch (e) {
            console.error("Erro ao carregar detalhe da operação:", e);
            alert("Erro ao carregar detalhes da operação: " + e.message);
            window.close();
        }
    }

    document.addEventListener("DOMContentLoaded", loadData);
})();
