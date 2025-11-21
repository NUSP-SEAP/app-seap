// Carrega o componente e inicializa saudação e logout
(async () => {
    try {
        const wrap = document.getElementById('header');
        const html = await fetch('/components/header.html', { cache: 'no-store' }).then(r => r.text());
        wrap.innerHTML = html;

        // injeta os JS que já funcionam nas demais páginas
        const s1 = document.createElement('script'); s1.src = '/js/initHeader.js'; document.body.appendChild(s1);
        const s2 = document.createElement('script'); s2.src = '/js/logout.js'; document.body.appendChild(s2);
    } catch (e) {
        console.error('Falha ao carregar header:', e);
    }
})();

const API = {
    LIST_SALAS: AppConfig.apiUrl(AppConfig.endpoints.lookups.salas),
    LIST_OPERADORES: AppConfig.apiUrl(AppConfig.endpoints.lookups.operadores),
    SALVAR: AppConfig.apiUrl(AppConfig.endpoints.forms.cessaoSala)
};

/** Util: token JWT do seu front (localStorage) e fetch com Authorization */
function getJwtToken() {
    // tenta usar as chaves mais comuns do seu projeto
    return localStorage.getItem('auth_token')
        || localStorage.getItem('token')
        || '';
}
async function authFetch(url, options = {}) {
    const token = getJwtToken();
    const headers = Object.assign({}, options.headers || {}, token ? { Authorization: 'Bearer ' + token } : {});
    return fetch(url, Object.assign({}, options, { headers }));
}

/** UI helpers */
const byId = (id) => document.getElementById(id);
const msg = byId('msg');
function showMsg(html) { msg.innerHTML = html; msg.style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' }); }

/** Carrega salas do banco */
async function loadSalas() {
    const sel = byId('sala_id');
    sel.innerHTML = '<option value="">Carregando salas...</option>';
    try {
        const r = await authFetch(API.LIST_SALAS, { method: 'GET' });
        if (!r.ok) throw new Error('HTTP ' + r.status);

        const json = await r.json();

        // Normaliza: o seu workflow retorna { data: [...] }
        const arr = Array.isArray(json) ? json
            : Array.isArray(json.data) ? json.data
                : Array.isArray(json.salas) ? json.salas
                    : Array.isArray(json.items) ? json.items
                        : [];

        if (!arr.length) throw new Error('lista vazia');

        sel.innerHTML = '<option value="">Selecione uma sala</option>';
        arr.forEach(s => {
            const o = document.createElement('option');
            // aceita {id,nome} ou {value,label}
            o.value = (s.id ?? s.value);
            o.textContent = (s.nome ?? s.label ?? String(o.value));
            sel.appendChild(o);
        });
    } catch (e) {
        console.error('Falha ao carregar salas:', e);
        sel.innerHTML = '<option value="">[Erro ao carregar salas]</option>';
    }
}

/** Carrega operadores e prepara o "Adicionar" */
let operadoresCache = [];
function fillOpSelect(selectEl) {
    selectEl.innerHTML = '<option value="">Selecione um operador</option>';
    operadoresCache.forEach(p => {
        const o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.nome;
        selectEl.appendChild(o);
    });
}
async function loadOperadores() {
    try {
        const r = await authFetch(API.LIST_OPERADORES);
        const json = await r.json();

        // Aceita {data:[...]}, {items:[...]}, ou array direto
        const arr = Array.isArray(json) ? json
            : Array.isArray(json.data) ? json.data
                : Array.isArray(json.items) ? json.items
                    : [];

        if (!arr.length) throw new Error('Lista de operadores vazia');

        // Padroniza para o shape usado no front: { id, nome }
        operadoresCache = arr.map(o => ({
            id: o.id,
            nome: o.nome ?? o.nome_completo ?? o.label ?? ''
        }));

        document.querySelectorAll('.op-select').forEach(fillOpSelect);
    } catch (e) {
        document.querySelectorAll('.op-select')
            .forEach(s => s.innerHTML = '<option value="">[Erro ao carregar]</option>');
    }
}
const MAX_OPS = 3;

function opCount() {
    return document.querySelectorAll('.op-item').length;
}
function updateOpUI() {
    // Desativa/ativa o botão +adicionar
    const addBtn = document.getElementById('add-op');
    if (addBtn) addBtn.disabled = opCount() >= MAX_OPS;

    // Renumera rótulos "Operador N"
    document.querySelectorAll('.op-item').forEach((row, idx) => {
        const lab = row.querySelector('label');
        if (lab) lab.firstChild.nodeValue = `Operador ${idx + 1} `;
    });
}
function addOperadorRow() {
    if (opCount() >= MAX_OPS) { updateOpUI(); return; }

    const list = document.getElementById('operadores');
    const idx = opCount() + 1;

    const row = document.createElement('div');
    row.className = 'row op-item';
    row.dataset.i = String(idx);
    row.innerHTML = `
    <div class="col" style="flex:2 1 320px">
      <label>Operador ${idx} <span class="req">*</span></label>
      <select class="op-select" required></select>
    </div>
    <div class="col" style="max-width:120px">
      <button class="btn small btn-remove" type="button">– remover</button>
    </div>
  `;
    list.appendChild(row);
    const sel = row.querySelector('.op-select');
    fillOpSelect(sel);
    row.querySelector('.btn-remove').addEventListener('click', () => {
        row.remove();
        updateOpUI();
    });
    updateOpUI();
}

/** Valida e monta payload */
function getHouveAnom() { return (document.querySelector('input[name="anom"]:checked') || {}).value || 'Não'; }
function readPayload() {
    const ops = Array.from(document.querySelectorAll('.op-item .op-select')).map((sel, idx) => ({
        operador_id: sel.value,
        ordem: idx + 1
    })).filter(o => o.operador_id);

    return {
        data_evento: byId('data_evento').value,
        horario_pauta: byId('horario_pauta').value || null,
        hora_inicio: byId('hora_inicio').value,
        hora_termino: byId('hora_termino').value,
        sala_id: byId('sala_id').value,
        nome_evento: byId('nome_evento').value.trim(),
        orgao_unidade_solicitante: byId('orgao_unidade_solicitante').value.trim(),
        contato_responsavel: byId('contato_responsavel').value.trim() || null,
        recursos_utilizados: byId('recursos_utilizados').value.trim() || null,
        observacoes: byId('observacoes').value.trim() || null,
        houve_anormalidade: getHouveAnom(),
        operadores: ops
    };
}
function validatePayload(p) {
    const errs = [];
    if (!p.data_evento) errs.push('• Data do evento é obrigatória.');
    if (!p.hora_inicio) errs.push('• Hora de início é obrigatória.');
    if (!p.hora_termino) errs.push('• Hora de término é obrigatória.');
    if (!p.sala_id) errs.push('• Espaço solicitado é obrigatório.');
    if (!p.nome_evento) errs.push('• Nome do evento é obrigatório.');
    if (!p.orgao_unidade_solicitante) errs.push('• Órgão/Unidade solicitante é obrigatório.');
    if (!p.operadores.length) errs.push('• Informe ao menos 1 operador.');
    return errs;
}

/** Eventos */
document.addEventListener('DOMContentLoaded', async () => {
    // saudação e botão "Sair" são geridos pelo seu initHeader.js
    // (mostrar elementos quando logado)
    const nameSpan = document.getElementById('auth-user-name');
    const btnOut = document.getElementById('logout-btn');
    nameSpan && (nameSpan.style.display = '');
    btnOut && (btnOut.style.display = '');

    // data padrão = hoje
    byId('data_evento').valueAsDate = new Date();

    await loadSalas();
    await loadOperadores();

    document.getElementById('add-op')?.addEventListener('click', addOperadorRow);
    updateOpUI();

    document.getElementById('btn-clear').addEventListener('click', () => location.reload());

    document.getElementById('btn-save').addEventListener('click', async () => {
        msg.style.display = 'none';
        const payload = readPayload();
        const errs = validatePayload(payload);
        if (errs.length) {
            showMsg('<b>Corrija os seguintes pontos:</b><br>' + errs.join('<br>'));
            return;
        }

        try {
            const r = await authFetch(API.SALVAR, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok || !data.ok) {
                showMsg('<b>Falha ao salvar.</b> ' + (data.error || 'Verifique os dados e tente novamente.'));
                return;
            }
            if (data.redirectAnormalidade) {
                window.location.href = data.redirectAnormalidade;
            } else {
                showMsg('<b>Registro salvo com sucesso!</b> ID: ' + data.id);
            }
        } catch (e) {
            showMsg('<b>Erro de comunicação com o servidor.</b> Tente novamente.');
        }
    });
});