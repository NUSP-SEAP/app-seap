// ====== Estado dos horários (não exibidos) ======
let _entradaPagina = null; // Date da entrada
function hhmmss(d) { const p = n => String(n).padStart(2, "0"); return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()); }

// ====== UI helpers ======
const $ = (sel) => document.querySelector(sel);
function showMsg(html, ok = true) {
    const box = $("#msg");
    box.classList.remove("hidden");
    box.style.borderColor = ok ? "#16a34a" : "#dc2626";
    box.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Exibe/oculta textarea quando marcar "Falha"
function bindConditionalFailures() {
    const radios = document.querySelectorAll('.check-item input[type="radio"]');
    radios.forEach(r => {
        r.addEventListener('change', (e) => {
            const name = e.target.name; // ex.: sistemaZoom
            const area = document.getElementById('falha' + name.charAt(0).toUpperCase() + name.slice(1));
            if (!area) return;
            if (e.target.value === 'Falha' && e.target.checked) {
                area.style.display = 'block';
            } else {
                area.style.display = 'none';
                area.value = '';
            }
        });
    });
}

async function loadSalas() {
    const url = AppConfig.apiUrl(AppConfig.endpoints.lookups.salas);
    const sel = document.getElementById('sala_id');
    sel.innerHTML = '<option value="">Carregando...</option>';
    try {
        let resp;
        if (window.Auth && Auth.authFetch) resp = await Auth.authFetch(url, { method: 'GET' });
        else {
            const headers = new Headers();
            const tok = localStorage.getItem('auth_token') || '';
            if (tok) headers.set('Authorization', 'Bearer ' + tok);
            resp = await fetch(url, { method: 'GET', headers });
        }
        const json = await resp.json().catch(() => ({}));
        const rows = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        const opts = ['<option value="">Selecione...</option>'].concat(
            rows.map(r => `<option value="${r.id}">${r.nome}</option>`)
        ).join('');
        sel.innerHTML = opts;
        sel.disabled = false;
    } catch (e) {
        sel.innerHTML = '<option value="">Falha ao carregar</option>';
    }
}

function readItens() {
    // Nome exatamente como no catálogo (forms.checklist_item_tipo) para mapeamento no back-end.
    const m = (name, label) => {
        const v = (document.querySelector(`input[name="${name}"]:checked`) || {}).value || null;
        const desc = (document.getElementById('falha' + name.charAt(0).toUpperCase() + name.slice(1)) || {}).value || null;
        return { nome: label, status: v, descricao_falha: desc && desc.trim() ? desc.trim() : null };
    };
    return [
        m('sistemaZoom', 'Sistema Zoom'),
        m('pcSecretario', 'PC do Secretário'),
        m('videowall', 'Vídeowall'),
        m('micSemFio', 'Mic sem fio'),
        m('micBancada', 'Mic de bancada'),
        m('sinalTVSenado', 'Sinal TV Senado'),
        m('tabletPresidente', 'Tablet Presidente'),
        m('tabletSecretaria', 'Tablet Secretária'),
        m('relogio', 'Relógio (sincronismo)'),
        m('vip', 'VIP')
    ];
}

function buildPayload() {
    const now = new Date();
    const byId = (id) => (document.getElementById(id)?.value || "");
    const toNull = (s) => {
        const v = (s || "").trim();
        return v ? v : null;
    };
    return {
        // Cabeçalho
        data_operacao: byId('data_operacao') || null,                           // YYYY-MM-DD
        sala_id: parseInt(byId('sala_id') || "", 10) || null,                   // FK (smallint)
        turno: byId('turno') || null,                                           // 'Matutino' | 'Vespertino'

        // Horários automáticos (sem inputs visíveis)
        hora_inicio_testes: _entradaPagina ? hhmmss(_entradaPagina) : null,     // HH:MM:SS
        hora_termino_testes: hhmmss(now),                                       // HH:MM:SS

        // NOVO: Recursos/Parâmetros
        usb_01: toNull(byId('usb_01')),                                         // opcional
        usb_02: toNull(byId('usb_02')),                                         // opcional

        // Observações
        observacoes: toNull(byId('observacoes')),                                // opcional

        // Itens do teste
        itens: readItens()                                                       // [{nome,status,descricao_falha}, ...]
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1) Define data padrão e captura horário de entrada (inicio dos testes)
    document.getElementById('data_operacao').valueAsDate = new Date();
    _entradaPagina = new Date();

    // 2) Carrega salas
    await loadSalas();

    // 3) Liga lógica de "Falha" -> textarea
    bindConditionalFailures();

    // 4) Submit (envia para o back-end Django)
    document.getElementById('form-checklist').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const form = ev.currentTarget;
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const payload = buildPayload();

        const btn = form.querySelector('button[type="submit"]');
        const old = btn ? btn.textContent : null;
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

        try {
            const url = AppConfig.apiUrl(AppConfig.endpoints.forms.checklist);

            let resp;
            if (window.Auth && Auth.authFetch) {
                resp = await Auth.authFetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                const headers = new Headers({ 'Content-Type': 'application/json' });
                const tok = localStorage.getItem('auth_token') || '';
                if (tok) headers.set('Authorization', 'Bearer ' + tok);
                resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
            }

            if (resp.status === 401 || resp.status === 403) {
                alert('Sua sessão expirou ou você não tem permissão. Faça login novamente.');
                window.location.href = '/index.html';
                return;
            }

            const data = await resp.json().catch(() => ({}));

            if (resp.ok) {
                // Sucesso: não exibe ID, só a mensagem simples
                alert('Formulário enviado com sucesso!');
                form.reset();
                _entradaPagina = new Date(); // reinicia contador de entrada
            } else {
                const msg = data?.message || data?.error || ('Falha ao salvar (HTTP ' + resp.status + ')');
                alert('Não foi possível salvar. ' + msg);
            }
        } catch (e) {
            console.error(e);
            alert('Erro de rede ao tentar salvar o checklist.');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = old || 'Salvar'; }
        }
    });

});

(function () {
    // Referências do formulário e campos ocultos
    const form = document.getElementById('form-checklist');
    const inputInicio = document.getElementById('hora_inicio_testes');
    const inputTermino = document.getElementById('hora_termino_testes');
    const btnVoltar = document.getElementById('btn-voltar'); // se existir

    // Utilitários de formatação "HH:MM:SS"
    const pad2 = n => String(n).padStart(2, '0');
    const fmtTime = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

    // 1) Grava o horário exato de ENTRADA na página
    const pageEnter = new Date();
    if (inputInicio) {
        inputInicio.value = fmtTime(pageEnter);
    }

    // 2) No SUBMIT, grava o horário exato de TÉRMINO e deixa o navegador enviar
    if (form) {
        form.addEventListener('submit', function () {
            if (inputTermino) {
                inputTermino.value = fmtTime(new Date());
            }
        }, { capture: true }); // garante que rode antes de qualquer handler posterior
    }

    // 3) Botão "Voltar" para a Home (se o botão existir na página)
    if (btnVoltar) {
        btnVoltar.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = '/home.html';
        });
    }
})();