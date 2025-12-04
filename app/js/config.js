/**
 * app/js/config.js
 * Centraliza todas as URLs e configurações globais do sistema.
 */
const AppConfig = {
    // A URL base do seu backend (Django atrás do /webhook)
    baseURL: "https://senado-nusp.cloud",

    // Mapeamento de todos os endpoints usados no sistema
    endpoints: {
        auth: {
            login: "/webhook/login",
            logout: "/webhook/auth/logout",
            whoami: "/webhook/whoami"
        },

        admin: {
            novoOperador: "/webhook/admin/operadores/novo",
            novoAdmin: "/webhook/admin/admins/novo"
        },

        // --- NOVOS ENDPOINTS DO DASHBOARD ---
        adminDashboard: {
            operadores: "/webhook/admin/dashboard/operadores",
            checklists: "/webhook/admin/dashboard/checklists",
            operacoes: "/webhook/admin/dashboard/operacoes",
            detalheOperacao: "/webhook/admin/operacao/detalhe",
            detalheChecklist: "/webhook/admin/checklist/detalhe",

            // --- Novos Endpoints de Anormalidade ---
            anormalidades: {
                salas: "/webhook/admin/dashboard/anormalidades/salas",
                lista: "/webhook/admin/dashboard/anormalidades/lista",
                detalhe: "/webhook/admin/anormalidade/detalhe"
            }
        },

        // Rotas de consulta (usadas para preencher <select>)
        lookups: {
            salas: "/webhook/forms/lookup/salas",
            operadores: "/webhook/forms/lookup/operadores",
            comissoes: "/webhook/forms/lookup/comissoes",
            registroOperacao: "/webhook/forms/lookup/registro-operacao"
        },

        // Rotas de submissão de formulários "clássicos"
        forms: {
            cessaoSala: "/webhook/forms/cessao-sala",
            checklist: "/webhook/forms/checklist/registro",
            checklistItensTipo: "/webhook/forms/checklist/itens-tipo",
            operacao: "/webhook/operacao/registro",
            anormalidade: "/webhook/operacao/anormalidade/registro"
        },

        // Novo conjunto de endpoints JSON da Operação de Áudio (Etapa 6)
        operacaoAudio: {
            // GET – estado da sessão (sala + operador)
            estadoSessao: "/webhook/operacao/audio/estado-sessao",

            // POST JSON – criar/editar entrada de operação de áudio
            salvarEntrada: "/webhook/operacao/audio/salvar-entrada",

            // POST JSON – finalizar sessão da sala
            finalizarSessao: "/webhook/operacao/audio/finalizar-sessao"
        }
    },

    /**
     * Helper para gerar URL completa.
     * Uso: AppConfig.apiUrl(AppConfig.endpoints.auth.login)
     */
    apiUrl: function (endpoint) {
        if (!endpoint) return "";
        const base = this.baseURL.replace(/\/+$/, "");
        const path = endpoint.replace(/^\/+/, "");
        return `${base}/${path}`;
    }
};

// Congela o objeto para evitar modificações acidentais
Object.freeze(AppConfig);
