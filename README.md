# operacao-audio-frontend

Front-end estático (HTML/CSS/JS) do sistema de **Operação de Áudio do Senado**, responsável por:

- Telas de **login** e **home** dos operadores.
- Formulários de:
  - **Checklist diário** das salas.
  - **Registro de Operação de Áudio (ROA)**.
  - **Registro de Anormalidades (RAOA)**.
- Área **Administrativa**:
  - Dashboard de operadores.
  - Verificação de salas (checklists).
  - Operações de áudio.
  - Anormalidades (RAOA) agrupadas por sala.
  - Cadastros de operadores e administradores.
  - Formulários de detalhes (somente leitura).

Este frontend consome as APIs expostas pelo backend Django (`operacao-audio-service`) sob o prefixo `/webhook/...`, e é servido em produção via **Nginx** a partir de `/var/www/app`.

---

## Arquitetura e stack

O frontend é um conjunto de **arquivos estáticos**, sem build step obrigatório (sem bundler obrigatório), organizados em HTML, CSS e JavaScript puro.

### Organização geral

Estrutura simplificada do diretório `app/` (ou `/var/www/app` em produção):

```text
app/
├── index.html                # Tela de login
├── home.html                 # Home do operador (menu principal)
├── admin/
│   ├── index.html            # Dashboard: operadores + verificação de salas
│   ├── operacoes_audio.html  # Dashboard: operações de áudio + anormalidades
│   ├── novo_operador.html    # Cadastro de operadores
│   ├── novo_admin.html       # Cadastro de administradores
│   ├── form_checklist.html   # Detalhe de checklist (somente leitura)
│   ├── form_operacao.html    # Detalhe de operação (entrada de operador)
│   └── form_anormalidade.html# Detalhe de RAOA
├── forms/
│   ├── checklist/            # Telas relacionadas ao checklist diário
│   └── operacao/             # Telas de ROA e RAOA (ex.: anormalidade.html)
├── js/
│   ├── config.js             # Configurações globais (ex.: API_BASE_URL)
│   ├── app/                  # Scripts de aplicação
│   │   ├── auth.js           # Gerenciamento de login/sessão (Auth)
│   │   ├── home.js           # Lógica da home do operador
│   │   ├── checklist.js      # Tela de checklist diário
│   │   ├── operacao_audio.js # Tela de ROA (registro de operação)
│   │   ├── anormalidade.js   # Tela de RAOA
│   │   ├── admin_dashboard.js# Lógica das tabelas do dashboard
│   │   ├── admin_cadastros.js# Cadastro de operadores/admins
│   │   └── utils.js          # Helpers compartilhados (formatação etc.)
│   └── vendor/               # Bibliotecas de terceiros (se houver)
├── css/
│   ├── main.css              # Estilos gerais
│   ├── forms.css             # Estilos de formulários
│   └── admin.css             # Estilos das telas administrativas
└── imgs/                     # Logos, ícones, backgrounds etc.
```

> Os nomes exatos podem variar, mas a organização conceitual é esta:  
> HTML por página, JS por contexto (auth, checklist, operação, admin), CSS segmentado.

### Principais responsabilidades do frontend

- **Autenticação e sessão**
  - Tela de login (`index.html`):
    - Envia `POST /webhook/login`.
    - Em caso de sucesso, armazena JWT (ex.: em `localStorage`) e redireciona para `home.html`.
  - Módulo `Auth` (em `js/app/auth.js`):
    - Gerencia token JWT e dados do usuário logado.
    - Função `authFetch` (ou equivalente) que inclui automaticamente o header `Authorization: Bearer <token>`.
    - Helpers como `Auth.requireAuth()` para proteger páginas.

- **Navegação principal**
  - `home.html`:
    - Acesso às telas de checklist, ROA e RAOA.
    - Exibe informações básicas do operador logado.
  - Páginas admin em `/admin`:
    - Menus para dashboard e cadastros.

- **Formulários operacionais**
  - Checklist diário:
    - Seleção de sala via API de lookup.
    - Campos para horários e itens de checklist.
    - Campos condicionais quando há problemas.
  - ROA (Registro de Operação de Áudio):
    - Seleção de sala (obrigatória para habilitar demais campos).
    - Campos de data, horários, tipo/comissão, nome do evento, USBs, observações, etc.
    - Regras de habilitação/edição conforme estado da sessão (0, 1 ou 2 entradas do operador).
    - Botão de "Finalizar sessão" que só habilita quando o operador já salvou ao menos uma entrada.
  - RAOA:
    - Formulário condicionado a uma entrada de operação (linkado via `registro_id` e `entrada_id`).
    - Campos condicionais para prejuízo, reclamação, manutenção, solução.

- **Dashboard administrativo**
  - Listagens com paginação, filtros e ordenação:
    - Operadores.
    - Checklists.
    - Operações (sessões e entradas).
    - Anormalidades agrupadas por sala.
  - Formulários de detalhe em modais ou páginas separadas:
    - Checklist.
    - Operação (entrada).
    - Anormalidade.

---

## Configuração do frontend

### Arquivo `config.js`

O frontend utiliza um arquivo de configuração (por exemplo `js/config.js`) para centralizar:

- `window.API_BASE_URL` — URL base da API (prefixo `/webhook`).
  - Ex.: `http://localhost:8000` em desenvolvimento.
  - Ex.: `https://seu-dominio` em produção.
- Endpoints específicos usados pelo JavaScript:
  - `/webhook/login`
  - `/webhook/whoami`
  - `/webhook/forms/lookup/...`
  - `/webhook/operacao/audio/...`
  - `/webhook/operacao/anormalidade/registro`
  - `/webhook/admin/dashboard/...`
  - `/webhook/admin/...` (cadastros)
- Parametrizações de UI (mensagens padrão, limites de paginação, etc.), se necessário.

> Sempre que o backend mudar de domínio/porta, ou quando for subir um ambiente novo (dev/homolog/produção), **ajuste esse arquivo** em vez de alterar cada script individual.

---

## Fluxos principais de tela

### 1. Login (`index.html`)

- Formulário simples com:
  - Usuário (username ou email).
  - Senha.
- Ao enviar:
  - Chama `fetch(API_BASE_URL + '/webhook/login', { method: 'POST', body: JSON.stringify(...) })`.
  - Em sucesso:
    - Salva JWT em `localStorage` (ex.: `localStorage.setItem('auth_token', token)`).
    - Armazena dados básicos do usuário (nome, perfil, username).
    - Redireciona para `home.html` (para operador) ou para `/admin/index.html` (caso haja lógica específica para admin).
  - Em erro:
    - Exibe mensagem de erro no formulário (sem quebrar a página).

### 2. Home do operador (`home.html`)

- Usa `Auth.requireAuth()` ao carregar:
  - Se não houver token → redireciona para `index.html`.
- Exibe:
  - Boas-vindas com nome do operador.
  - Botões/links para:
    - **Checklist diário**.
    - **Registro de Operação de Áudio (ROA)**.
    - **Registro de Anormalidade (RAOA)**.
- Botão de **Logout**:
  - Chama `POST /webhook/auth/logout`.
  - Limpa dados do `Auth` e redireciona para login.

### 3. Checklist diário (`/forms/checklist/...`)

- Carregamento inicial:
  - Busca lista de salas (`GET /webhook/forms/lookup/salas`).
- Form:
  - Sala (obrigatória).
  - Data/hora de início (normalmente sugerida como "agora").
  - Itens do checklist (cada um com:
    - status OK/Problema,
    - campo de descrição em caso de problema).
  - Observações gerais.
- Envio:
  - `POST /webhook/forms/checklist/registro`.
  - Em sucesso, pode:
    - Limpar o formulário mantendo sala/data, ou
    - Exibir confirmação visual (toast/alert).

### 4. ROA (Registro de Operação de Áudio)

- Caminho típico: `/forms/operacao/...` (por ex. `operacao_audio.html`).
- Ao carregar:
  - Verifica token (`Auth.requireAuth()`).
  - Busca salas (`lookup/salas`).
- Regras de UI:
  - Enquanto nenhuma sala estiver selecionada:
    - Campos principais e botões de salvar ficam desabilitados.
  - Após escolher sala:
    - Front chama `GET /webhook/operacao/audio/estado-sessao?sala_id=...`.
    - Ajusta tela conforme resposta:
      - Sem sessão → campos liberados para primeira entrada.
      - Sessão aberta com 1 entrada do operador → tela preparada para 2ª entrada.
      - Operador com 2 entradas → campos em modo somente leitura + botões de editar entrada 1/2.
- Campos:
  - Data da operação.
  - Horário de pauta, horário de início/fim.
  - Sala (readonly depois de selecionada).
  - **Tipo/Comissão** (quando aplicável):
    - Dropdown alimentado pelo lookup de comissões.
    - Exibido/ocultado conforme tipo de sala (Auditório / Plenário / outras).
  - Dados técnicos (USBs, trilha, etc.).
  - Observações.
  - `Houve anormalidade?` (Sim/Não):
    - Sempre visível, mas a decisão final de criar RAOA depende de regra no backend.
- Botões:
  - **Salvar** / **Salvar novo registro** / **Salvar edição**:
    - Chamam `POST /webhook/operacao/audio/salvar-entrada`.
    - Em caso de `tipo_evento="operacao"` + anormalidade, backend responde orientando front a redirecionar para RAOA.
  - **Limpar**:
    - Reseta campos mantendo sala e, normalmente, tipo.
  - **Finalizar Registro da Sala/Operação**:
    - Habilitado somente após o operador salvar pelo menos uma entrada.
    - Chama `POST /webhook/operacao/audio/finalizar-sessao`.
    - Não mexe nos valores dos campos de entrada (só encerra a sessão no backend).

### 5. RAOA (Registro de Anormalidade)

- Tela típica: `/forms/operacao/anormalidade.html`.
- Abertura:
  - Normalmente via parâmetros de query (`?registro_id=...&entrada_id=...`), vindos do backend ao salvar a entrada.
  - Também pode ser acessada em modo edição pela área administrativa (editando uma RAOA existente).
- Conteúdo:
  - Dados do evento (sala, data, nome do evento) — geralmente somente leitura.
  - Campos de anormalidade:
    - Descrição do problema.
    - `Houve prejuízo?` + campo de descrição.
    - `Houve reclamação?` + autores/conteúdo.
    - `Acionou manutenção?` + horário de acionamento.
    - `Anormalidade solucionada?` + data/hora da solução.
    - Procedimentos adotados.
    - Responsável pelo evento.
- Envio:
  - `POST /webhook/operacao/anormalidade/registro`.
  - Front cuida de mostrar erros vindos do backend (por exemplo, omissão de campos obrigatórios condicionais).

### 6. Área Administrativa (dashboards)

- `/admin/index.html`
  - Dashboard de **Operadores** e **Checklists**.
- `/admin/operacoes_audio.html`
  - Dashboard de **Operações** e **Anormalidades**.

Comportamento comum das tabelas:

- Estado de tabela no JS:
  - `page`, `limit`, `search`, `sort`, `dir`.
- Interações:
  - Campo de busca com debounce (ex.: 300–400 ms) → atualiza `search`.
  - Clique no cabeçalho de coluna com `data-sort="..."`:
    - Alterna entre `asc` e `desc`.
    - Refaz a requisição com novos parâmetros.
- Resposta do backend:
  - `data`: linhas da tabela.
  - `meta`: `{ total, page, pages, limit }`.

Tabelas específicas:

- **Operadores**
  - Colunas: nome, e-mail, (futuros) “No Senado”, “Entrada”, “Saída”.
  - Duplo clique na linha:
    - Hoje pode exibir alerta (“em desenvolvimento”).
    - Futuro: leva para `admin/info_operador.html`.

- **Checklists**
  - Exibição em estilo “accordion”:
    - Linha principal: sala, data, operador, status.
    - Ao expandir:
      - Itens do checklist (OK/Problema + descrição).
  - Botão/Link “Formulário” abre `form_checklist.html` com dados via `/admin/checklist/detalhe`.

- **Operações**
  - Tabela pai com sessões.
  - Ao expandir, mostra entradas (operadores) atreladas à sessão.
  - Link em cada entrada abre `form_operacao.html`, em modo somente leitura.

- **Anormalidades**
  - Lista de salas com resumo de anormalidades.
  - Ao expandir:
    - Tabela por sala, com paginação própria.
    - Cada RAOA tem ação que abre `form_anormalidade.html` com dados detalhados.

---

## Execução do código (frontend)

### Rodando localmente (sem Nginx)

Não há build step obrigatório. Para desenvolvimento rápido:

1. Navegar até o diretório `app/`:

   ```bash
   cd app
   ```

2. Subir um servidor HTTP simples (para respeitar CORS e path relativo):

   ```bash
   python -m http.server 8080
   ```

3. Acessar no navegador:

   - `http://localhost:8080/index.html` (login)
   - `http://localhost:8080/home.html` (home)
   - `http://localhost:8080/admin/index.html` (dashboard admin)

4. Configurar `API_BASE_URL` em `js/config.js` apontando para o backend local:

   ```js
   // js/config.js
   window.API_BASE_URL = 'http://localhost:8000';
   ```

> Em ambiente local, o backend deve estar rodando em `http://localhost:8000` (via `python manage.py runserver`) ou porta equivalente.

### Rodando em ambiente de homologação/produção (via Nginx)

Em produção, o Nginx é configurado para:

- Servir o conteúdo de `/var/www/app` como raiz do site:

  ```nginx
  root /var/www/app;
  index index.html;
  ```

- Rotas:
  - `/` → `index.html` (login).
  - `/home` → `home.html`.
  - `/admin/` → `admin/index.html`.
  - `/forms/...` → formulários.
  - `/css/`, `/js/`, `/imgs/` → pastas estáticas.
  - `/files/` → arquivos públicos gerados pelo backend (fotos, anexos, etc.).

- Proxy das APIs para o backend Django:

  ```nginx
  location /webhook/ {
      proxy_pass http://127.0.0.1:8000;
      # (demais headers e configs omitidas aqui)
  }
  ```

---

## Alterações, teste e validação

### Recomendações para desenvolvimento

- Manter scripts JS separados por contexto (auth, forms, admin), evitando arquivos “monolíticos”.
- Centralizar texto de mensagens e URLs comuns em módulos de config/constants.
- Usar o módulo `Auth` em toda chamada de API que requer autenticação.
- Ao alterar o contrato de uma API, **atualizar simultaneamente**:
  - o código JS que consome a rota,
  - a documentação da API no README do backend.

### Testes manuais

Dado que o frontend é puramente estático, grande parte da validação é feita via testes manuais em navegador:

1. **Login / Logout**
   - Testar login válido e inválido.
   - Verificar redirecionamento correto.
   - Confirmar que logout limpa sessão e bloqueia acesso a páginas protegidas.

2. **Checklist**
   - Preencher checklist com todos OK.
   - Criar pelo menos um item com problema e confirmar que o campo de descrição é obrigatório.

3. **ROA**
   - Abrir sessão nova em sala vazia (sem sessão aberta).
   - Criar 1ª entrada e validar habilitação da 2ª.
   - Forçar cenário com 2 entradas e verificar se campos de edição ficam corretos (modo somente leitura + botões de edição específicos).

4. **RAOA**
   - Criar entrada com anormalidade e confirmar redirecionamento para tela de RAOA.
   - Preencher diferentes combinações de flags (prejuízo, reclamação, manutenção, solução) e checar obrigatoriedade dos campos.

5. **Dashboard admin**
   - Testar paginação, ordenação e busca em todas as tabelas.
   - Checar se botões “Formulário” abrem corretamente os detalhes.

### Testes automatizados (opcional)

Caso se adote testes automatizados de frontend, recomenda-se:

- Utilizar ferramentas como:
  - **Cypress** / **Playwright** para testes end-to-end.
  - Linter JavaScript (ESLint) para manter estilo e detectar problemas comuns.

---

## Atualização e publicação

### Deploy de arquivos estáticos

Em servidores onde o frontend está em `/var/www/app`, um fluxo simples de atualização pode ser:

```bash
ssh usuario@servidor

# Exemplo: se o código estiver versionado em /srv/senado/frontend/app
cd /srv/senado/frontend
git pull origin main

# Copiar ou sincronizar arquivos para /var/www/app
sudo rsync -av --delete app/ /var/www/app/

# Opcionalmente, validar permissões
sudo chown -R www-data:www-data /var/www/app
```

> Ajuste caminhos e usuário (`www-data`) conforme a configuração real da sua VPS.

### Rollback rápido

- Manter um backup da versão anterior de `/var/www/app` (por exemplo `/var/www/app.bak-YYYYMMDD-HHMM`).
- Em caso de problema, restaurar rapidamente:

  ```bash
  sudo rm -rf /var/www/app
  sudo cp -R /var/www/app.bak-YYYYMMDD-HHMM /var/www/app
  ```

---
