// URLs de PRODUÇÃO (workflow ATIVO)
const SALAS_URL = AppConfig.apiUrl(AppConfig.endpoints.lookups.salas);
const OPERADORES_URL = AppConfig.apiUrl(AppConfig.endpoints.lookups.operadores);

// Helpers
function fillSelect(selectEl, rows, valueKey, labelKey, placeholder = "Selecione") {
    const opts = ['<option value="' + '' + '">' + placeholder + '</option>']
        .concat(rows.map(r => '<option value="' + r[valueKey] + '">' + r[labelKey] + '</option>'))
        .join('');
    selectEl.innerHTML = opts;
    selectEl.disabled = false;
}
function isVisible(el) { return window.getComputedStyle(el).display !== 'none'; }

async function loadLookups() {
    try {
        const [salasRes, opsRes] = await Promise.all([
            fetch(SALAS_URL, { cache: 'no-store' }),
            fetch(OPERADORES_URL, { cache: 'no-store' })
        ]);
        const salasJson = await salasRes.json();
        const opsJson = await opsRes.json();

        fillSelect(document.getElementById('sala_id'), salasJson.data || [], 'id', 'nome', 'Selecione uma sala');

        const allOps = opsJson.data || [];
        ['operador_1', 'operador_2', 'operador_3'].forEach(id => {
            const el = document.getElementById(id);
            if (el) fillSelect(el, allOps, 'id', 'nome_completo', 'Selecione um operador');
        });
    } catch (err) {
        console.error('Falha ao carregar dados de lookup:', err);
    }
}

// Lógica de adicionar/remover operadores conforme regras
function setupOperatorsUI() {
    const row2 = document.getElementById('op-row-2');
    const row3 = document.getElementById('op-row-3');
    const addTop = document.getElementById('btn-add-top');
    const addTopLegend = document.getElementById('btn-add-top-legend');
    const add2 = document.getElementById('btn-add-op-2');
    const rem2 = document.getElementById('btn-remove-op-2');

    function showRow2() { row2.style.display = 'grid'; }
    function hideRow2() { row2.style.display = 'none'; document.getElementById('operador_2').value = ''; }
    function showRow3() { row3.style.display = 'grid'; }
    function hideRow3() { row3.style.display = 'none'; document.getElementById('operador_3').value = ''; }

    function updateButtons() {
        const has2 = isVisible(row2);
        const has3 = isVisible(row3);
        addTop.style.display = has2 ? 'none' : '';
        addTopLegend.style.display = has2 ? 'none' : '';
        add2.style.display = (has2 && !has3) ? '' : 'none';
        rem2.style.display = has2 ? '' : 'none';
    }

    function addOperator() {
        if (!isVisible(row2)) showRow2();
        else if (!isVisible(row3)) showRow3();
        updateButtons();
    }

    addTop.addEventListener('click', addOperator);
    addTopLegend.addEventListener('click', addOperator);
    add2.addEventListener('click', () => { if (!isVisible(row3)) showRow3(); updateButtons(); });
    rem2.addEventListener('click', () => {
        if (isVisible(row3)) hideRow3();
        else hideRow2();
        updateButtons();
    });

    hideRow2(); hideRow3(); updateButtons();
}

// Inicialização
loadLookups();
setupOperatorsUI();

// Submissão: envia para o backend Django
const form = document.getElementById('form-roa');
form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitBtn = form.querySelector('.btn-primary[type="submit"], button.btn-primary[type="submit"], button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
    }

    const FORM_URL = AppConfig.apiUrl(AppConfig.endpoints.forms.operacao);

    try {
        const formData = new FormData(form);

        let resp;
        if (window.Auth && Auth.authFetch) {
            resp = await Auth.authFetch(FORM_URL, { method: 'POST', body: formData });
        } else {
            // fallback sem JWT (não deve acontecer em produção, mas evita quebra feia)
            resp = await fetch(FORM_URL, { method: 'POST', body: formData, credentials: 'omit' });
        }

        if (resp.status === 401) {
            // Sessão expirada ou inválida
            if (window.Auth && Auth.doLogout) {
                Auth.doLogout();
                return;
            }
            alert('Sua sessão expirou. Faça login novamente.');
            window.location.href = '/index.html';
            return;
        }

        let data;
        try {
            data = await resp.json();
        } catch (_) {
            data = null;
        }

        if (!resp.ok) {
            let msg = `Erro ao salvar (HTTP ${resp.status}).`;
            if (data && data.errors) {
                const parts = [];
                for (const [campo, texto] of Object.entries(data.errors)) {
                    parts.push(`${campo}: ${texto}`);
                }
                if (parts.length) msg = 'Erros de validação:\n\n' + parts.join('\n');
            } else if (data && data.error) {
                msg = String(data.error);
            }
            alert(msg);
            return;
        }

        const id = data && typeof data.registro_id !== 'undefined' ? data.registro_id : '';
        const houveAnormalidade = data && data.houve_anormalidade === true;

        if (!houveAnormalidade) {
            // Comportamento atual quando NÃO houve anormalidade
            alert(`Registro salvo com sucesso!${id ? `\n\nID: ${id}` : ''}`);
            form.reset();
        } else {
            // Novo fluxo: houve anormalidade → ir para o formulário de anormalidades
            if (!id) {
                alert("Registro salvo com sucesso, mas não foi possível obter o ID para redirecionar ao formulário de anormalidades.");
                return;
            }

            alert("Formulário enviado com sucesso!\nRedirecionando ao formulário de registro de anormalidades.");
            window.location.href = `/forms/operacao/anormalidade.html?registro_id=${encodeURIComponent(id)}`;
        }

    } catch (err) {
        console.error('Erro ao enviar formulário:', err);
        alert('Erro inesperado ao salvar o registro. Tente novamente.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
});