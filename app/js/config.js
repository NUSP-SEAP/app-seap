/**
 * app/js/config.js
 * Centraliza todas as URLs e configurações globais do sistema.
 */
const AppConfig = {
    // A URL base do seu backend (n8n)
    baseURL: "https://senado-nusp.cloud",

    // Mapeamento de todos os endpoints usados no sistema
    endpoints: {
        auth: {
            login: "/webhook/login",
            logout: "/webhook/auth/logout",
            whoami: "/webhook/whoami"
        },
        admin: {
            novoOperador: "/webhook/admin/operadores/novo"
        },
        // Rotas de consulta (usadas para preencher <select>)
        lookups: {
            salas: "/webhook/forms/lookup/salas",
            operadores: "/webhook/forms/lookup/operadores",
            registroOperacao: "/webhook/forms/lookup/registro-operacao"
        },
        // Rotas de submissão de formulários
        forms: {
            cessaoSala: "/webhook/forms/cessao-sala",
            checklist: "/webhook/forms/checklist/registro",
            operacao: "/webhook/operacao/registro",
            anormalidade: "/webhook/operacao/anormalidade/registro"
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