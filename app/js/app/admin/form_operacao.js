(function () {
    "use strict";

    // Pega o ID da URL
    const params = new URLSearchParams(window.location.search);
    const entradaId = params.get("entrada_id");

    if (!entradaId) {
        alert("ID de entrada não fornecido.");
        window.close();
        return;
    }

    // Helper simples para setar valor em inputs
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
    };

    const setRadio = (name, val) => {
        // Tenta achar o radio com esse valor e marca
        // Ex: tipo_evento = 'operacao' -> input[value='operacao']
        if (!val) return;
        // O form read-only usa inputs text para exibir radios selecionados
        // para simplificar a visualização (vide HTML do passo anterior),
        // mas se mantivermos a estrutura de radios original, usaríamos isso.
        // No HTML do passo 2, optei por inputs 'text' readonly para mostrar o valor.
        // Então vamos adaptar para preencher o input text.

        // Se no HTML usamos <input id="tipo_evento_display">
        const display = document.getElementById(name + "_display");
        if (display) {
            // Mapeia valores técnicos para nomes bonitos
            let text = val;
            if (name === 'houve_anormalidade') text = val ? "Sim" : "Não";
            if (name === 'tipo_evento') {
                if (val === 'operacao') text = "Operação Comum";
                if (val === 'cessao') text = "Cessão de Sala";
                if (val === 'outros') text = "Outros Eventos";
            }
            display.value = text;
        }
    };

    async function loadData() {
        const url = `${AppConfig.apiUrl(AppConfig.endpoints.adminDashboard.detalheOperacao)}?entrada_id=${entradaId}`;

        // Reusa authFetch do sistema
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
            document.getElementById("display-id").textContent = d.entrada_id;

            // Preenche Campos (ids batem com o HTML do form_operacao.html)
            setVal("sala_nome", d.sala_id); // O backend precisa mandar o NOME ou fazemos lookup. 
            // Nota: O backend atual manda sala_id. Vamos ajustar rapidinho o backend ou front.
            // Ajuste: O endpoint `get_entrada_operacao_detalhe` no Python retorna `r.sala_id`.
            // Para ficar perfeito, o ideal era retornar o nome da sala.
            // Mas como é read-only, podemos mostrar o ID por enquanto ou fazer um lookup extra.
            // Vamos assumir que você prefere o nome.
            // *CORREÇÃO RÁPIDA NO FRONT*: vamos fazer um fetch nas salas para pegar o nome pelo ID.

            setVal("data_operacao", d.data_operacao);
            setVal("horario_pauta", d.horario_pauta ? d.horario_pauta.substring(0, 5) : "");
            setVal("hora_inicio", d.hora_inicio ? d.hora_inicio.substring(0, 5) : "");
            setVal("hora_fim", d.hora_fim ? d.hora_fim.substring(0, 5) : "");

            setVal("nome_evento", d.nome_evento);
            setVal("usb_01", d.usb_01);
            setVal("usb_02", d.usb_02);
            setVal("observacoes", d.observacoes);
            setVal("operador_nome", d.operador_nome);

            // Campos especiais (Display)
            setRadio("tipo_evento", d.tipo_evento);
            setRadio("houve_anormalidade", d.houve_anormalidade);

            // Tenta buscar o nome da sala
            fetchSalaNome(d.sala_id);

        } catch (e) {
            alert("Erro ao carregar dados: " + e.message);
            console.error(e);
        }
    }

    async function fetchSalaNome(id) {
        if (!id) return;
        try {
            const r = await Auth.authFetch(AppConfig.apiUrl(AppConfig.endpoints.lookups.salas));
            const json = await r.json();
            const sala = (json.data || []).find(s => String(s.id) === String(id));
            if (sala) {
                setVal("sala_nome", sala.nome);
            } else {
                setVal("sala_nome", "ID: " + id);
            }
        } catch (_) { }
    }

    document.addEventListener("DOMContentLoaded", loadData);

})();