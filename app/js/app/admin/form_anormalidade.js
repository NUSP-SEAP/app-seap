(function () {
    "use strict";

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        alert("ID não fornecido.");
        window.close();
        return;
    }

    // Formata Data YYYY-MM-DD -> DD/MM/YYYY
    const fmtDate = (d) => {
        if (!d) return "";
        const parts = d.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
    };

    // Helper para preencher inputs
    const setVal = (eid, val) => {
        const el = document.getElementById(eid);
        if (el) el.value = val || "";
    };

    // Helper para lógica booleana e exibição condicional
    const handleBool = (dataVal, displayId, groupIds = []) => {
        const el = document.getElementById(displayId);
        const isTrue = !!dataVal; // converte para bool real

        if (el) {
            el.value = isTrue ? "Sim" : "Não";
            // Estiliza levemente
            el.style.color = isTrue ? "#b91c1c" : "#15803d"; // Vermelho se Sim, Verde se Não (exceto solução)
            el.style.fontWeight = "bold";
        }

        // Mostra/Esconde grupos dependentes
        groupIds.forEach(gid => {
            const grp = document.getElementById(gid);
            if (grp) {
                if (isTrue) grp.classList.remove("hidden");
                else grp.classList.add("hidden");
            }
        });
    };

    async function loadData() {
        const url = `${AppConfig.apiUrl(AppConfig.endpoints.adminDashboard.anormalidades.detalhe)}?id=${id}`;

        if (!window.Auth || typeof Auth.authFetch !== 'function') return;

        try {
            const resp = await Auth.authFetch(url);
            if (!resp.ok) throw new Error("Erro HTTP " + resp.status);
            const json = await resp.json();

            if (!json.ok || !json.data) throw new Error("Registro não encontrado");

            const d = json.data;

            // Header
            document.getElementById("display-id").textContent = d.id;
            setVal("data", fmtDate(d.data));
            setVal("sala_nome", d.sala_nome);
            setVal("nome_evento", d.nome_evento);

            // Detalhes
            setVal("hora_inicio_anormalidade", (d.hora_inicio_anormalidade || "").substring(0, 5));
            setVal("descricao_anormalidade", d.descricao_anormalidade);

            // Solução (Lógica invertida de cor: Sim é verde)
            const elSol = document.getElementById("foi_solucionada");
            const temSolucao = !!d.data_solucao;
            if (elSol) {
                elSol.value = temSolucao ? "Sim" : "Não";
                elSol.style.color = temSolucao ? "#15803d" : "#b91c1c";
                elSol.style.fontWeight = "bold";
            }
            if (temSolucao) {
                document.getElementById("grp_solucao").classList.remove("hidden");
                const dt = fmtDate(d.data_solucao);
                const hr = (d.hora_solucao || "").substring(0, 5);
                setVal("data_hora_solucao", `${dt} às ${hr}`);
            }

            // Condicionais de Impacto
            handleBool(d.houve_prejuizo, "houve_prejuizo", ["grp_prejuizo"]);
            setVal("descricao_prejuizo", d.descricao_prejuizo);

            handleBool(d.houve_reclamacao, "houve_reclamacao", ["grp_reclamacao"]);
            setVal("autores_conteudo_reclamacao", d.autores_conteudo_reclamacao);

            handleBool(d.acionou_manutencao, "acionou_manutencao", ["grp_manutencao"]);
            setVal("hora_acionamento_manutencao", (d.hora_acionamento_manutencao || "").substring(0, 5));

            handleBool(d.resolvida_pelo_operador, "resolvida_pelo_operador", ["grp_procedimentos"]);
            setVal("procedimentos_adotados", d.procedimentos_adotados);

            // Responsáveis
            setVal("registrado_por", d.registrado_por || "Sistema");
            setVal("responsavel_evento", d.responsavel_evento);

        } catch (e) {
            alert("Erro ao carregar: " + e.message);
            window.close();
        }
    }

    document.addEventListener("DOMContentLoaded", loadData);
})();