# cadastro.sala

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|smallint|não|nextval('cadastro.sala_id_seq'::regclass)||
|nome|text|não||Nome visível da sala (único).|
|ativo|boolean|não|true|Controle lógico de disponibilidade.|
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18615_18617_1_not_null
* CHECK: 18615_18617_2_not_null
* CHECK: 18615_18617_3_not_null
* CHECK: 18615_18617_4_not_null
* CHECK: 18615_18617_5_not_null
* PRIMARY KEY: sala_pkey
* UNIQUE: sala_nome_key

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX sala_nome_key ON cadastro.sala USING btree (nome)
* CREATE UNIQUE INDEX sala_pkey ON cadastro.sala USING btree (id)

---
# forms.checklist

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('forms.checklist_id_seq'::regclass)||
|data_operacao|date|não|||
|sala_id|smallint|não||FK para cadastro.sala.|
|turno|text|não||Matutino ou Vespertino (CHECK).|
|hora_inicio_testes|time without time zone|não|||
|hora_termino_testes|time without time zone|não|||
|observacoes|text|sim|||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 17854_18717_1_not_null
* CHECK: 17854_18717_2_not_null
* CHECK: 17854_18717_3_not_null
* CHECK: 17854_18717_4_not_null
* CHECK: 17854_18717_5_not_null
* CHECK: 17854_18717_6_not_null
* CHECK: 17854_18717_8_not_null
* CHECK: 17854_18717_9_not_null
* CHECK: ck_checklist_turno
* FOREIGN KEY: checklist_sala_id_fkey
* PRIMARY KEY: checklist_pkey

## Chaves estrangeiras

* checklist_sala_id_fkey: (sala_id) → cadastro.sala(id)

## Índices

* CREATE UNIQUE INDEX checklist_pkey ON forms.checklist USING btree (id)
* CREATE INDEX ix_checklist_data ON forms.checklist USING btree (data_operacao)
* CREATE INDEX ix_checklist_data_sala ON forms.checklist USING btree (data_operacao, sala_id)
* CREATE INDEX ix_checklist_sala ON forms.checklist USING btree (sala_id)

---
# forms.checklist_item_tipo

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|smallint|não|nextval('forms.checklist_item_tipo_id_seq'::regclass)||
|nome|text|não|||
|ativo|boolean|não|true||
|ordem|smallint|não|1||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 17854_18739_1_not_null
* CHECK: 17854_18739_2_not_null
* CHECK: 17854_18739_3_not_null
* CHECK: 17854_18739_4_not_null
* CHECK: 17854_18739_5_not_null
* CHECK: 17854_18739_6_not_null
* PRIMARY KEY: checklist_item_tipo_pkey
* UNIQUE: checklist_item_tipo_nome_key

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX checklist_item_tipo_nome_key ON forms.checklist_item_tipo USING btree (nome)
* CREATE UNIQUE INDEX checklist_item_tipo_pkey ON forms.checklist_item_tipo USING btree (id)
* CREATE INDEX ix_cli_tipo_ativo ON forms.checklist_item_tipo USING btree (ativo)
* CREATE INDEX ix_cli_tipo_ordem ON forms.checklist_item_tipo USING btree (ordem)

---
# forms.checklist_resposta

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('forms.checklist_resposta_id_seq'::regclass)||
|checklist_id|bigint|não|||
|item_tipo_id|smallint|não|||
|status|text|não|||
|descricao_falha|text|sim|||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 17854_18757_1_not_null
* CHECK: 17854_18757_2_not_null
* CHECK: 17854_18757_3_not_null
* CHECK: 17854_18757_4_not_null
* CHECK: 17854_18757_6_not_null
* CHECK: 17854_18757_7_not_null
* CHECK: ck_cli_resp_desc_quando_falha
* CHECK: ck_cli_resp_status
* FOREIGN KEY: checklist_resposta_checklist_id_fkey
* FOREIGN KEY: checklist_resposta_item_tipo_id_fkey
* PRIMARY KEY: checklist_resposta_pkey
* UNIQUE: uq_cli_resp_checklist_item

## Chaves estrangeiras

* checklist_resposta_checklist_id_fkey: (checklist_id) → forms.checklist(id)
* checklist_resposta_item_tipo_id_fkey: (item_tipo_id) → forms.checklist_item_tipo(id)

## Índices

* CREATE UNIQUE INDEX checklist_resposta_pkey ON forms.checklist_resposta USING btree (id)
* CREATE INDEX ix_cli_resp_checklist ON forms.checklist_resposta USING btree (checklist_id)
* CREATE INDEX ix_cli_resp_item ON forms.checklist_resposta USING btree (item_tipo_id)
* CREATE INDEX ix_cli_resp_status ON forms.checklist_resposta USING btree (status)
* CREATE UNIQUE INDEX uq_cli_resp_checklist_item ON forms.checklist_resposta USING btree (checklist_id, item_tipo_id)

---
# operacao.registro_anormalidade

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('operacao.registro_anormalidade_id_seq'::regclass)||
|registro_id|bigint|não|||
|data|date|não|||
|sala_id|smallint|não|||
|nome_evento|text|não||Cópia do nome do evento do registro pai para manter o histórico.|
|hora_inicio_anormalidade|time without time zone|não|||
|descricao_anormalidade|text|não|||
|houve_prejuizo|boolean|não|||
|descricao_prejuizo|text|sim|||
|houve_reclamacao|boolean|não|||
|autores_conteudo_reclamacao|text|sim|||
|acionou_manutencao|boolean|não|||
|hora_acionamento_manutencao|time without time zone|sim|||
|resolvida_pelo_operador|boolean|não|||
|procedimentos_adotados|text|sim|||
|data_solucao|date|não|||
|hora_solucao|time without time zone|sim|||
|responsavel_evento|text|não||Nome do responsável da comissão/mesa/evento informado no momento do registro.|
|operador_responsavel_id|uuid|não|||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18632_18681_10_not_null
* CHECK: 18632_18681_12_not_null
* CHECK: 18632_18681_14_not_null
* CHECK: 18632_18681_16_not_null
* CHECK: 18632_18681_18_not_null
* CHECK: 18632_18681_19_not_null
* CHECK: 18632_18681_1_not_null
* CHECK: 18632_18681_20_not_null
* CHECK: 18632_18681_21_not_null
* CHECK: 18632_18681_2_not_null
* CHECK: 18632_18681_3_not_null
* CHECK: 18632_18681_4_not_null
* CHECK: 18632_18681_5_not_null
* CHECK: 18632_18681_6_not_null
* CHECK: 18632_18681_7_not_null
* CHECK: 18632_18681_8_not_null
* CHECK: ck_datas_coerentes
* CHECK: ck_manutencao_hora
* CHECK: ck_prejuizo_desc
* CHECK: ck_reclamacao_desc
* FOREIGN KEY: registro_anormalidade_operador_responsavel_id_fkey
* FOREIGN KEY: registro_anormalidade_registro_id_fkey
* FOREIGN KEY: registro_anormalidade_sala_id_fkey
* PRIMARY KEY: registro_anormalidade_pkey

## Chaves estrangeiras

* registro_anormalidade_operador_responsavel_id_fkey: (operador_responsavel_id) → pessoa.operador(id)
* registro_anormalidade_registro_id_fkey: (registro_id) → operacao.registro_operacao_audio(id)
* registro_anormalidade_sala_id_fkey: (sala_id) → cadastro.sala(id)

## Índices

* CREATE INDEX ix_reganom_data ON operacao.registro_anormalidade USING btree (data)
* CREATE INDEX ix_reganom_operador ON operacao.registro_anormalidade USING btree (operador_responsavel_id)
* CREATE INDEX ix_reganom_registro ON operacao.registro_anormalidade USING btree (registro_id)
* CREATE INDEX ix_reganom_sala ON operacao.registro_anormalidade USING btree (sala_id)
* CREATE UNIQUE INDEX registro_anormalidade_pkey ON operacao.registro_anormalidade USING btree (id)

---
# operacao.registro_operacao_audio

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('operacao.registro_operacao_audio_id_seq'::regclass)||
|data|date|não|||
|nome_evento|text|não||Comissão/Evento + Nº/Nome da reunião (campo livre).|
|sala_id|smallint|não||FK para cadastro.sala.|
|horario_pauta|time without time zone|não|||
|horario_inicio|time without time zone|não|||
|horario_termino|time without time zone|não|||
|houve_anormalidade|boolean|não||Booleano (Sim/Não) indicando se houve anormalidade.|
|observacoes|text|sim|||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18632_18634_10_not_null
* CHECK: 18632_18634_11_not_null
* CHECK: 18632_18634_1_not_null
* CHECK: 18632_18634_2_not_null
* CHECK: 18632_18634_3_not_null
* CHECK: 18632_18634_4_not_null
* CHECK: 18632_18634_5_not_null
* CHECK: 18632_18634_6_not_null
* CHECK: 18632_18634_7_not_null
* CHECK: 18632_18634_8_not_null
* FOREIGN KEY: registro_operacao_audio_sala_id_fkey
* PRIMARY KEY: registro_operacao_audio_pkey

## Chaves estrangeiras

* registro_operacao_audio_sala_id_fkey: (sala_id) → cadastro.sala(id)

## Índices

* CREATE INDEX ix_regop_data ON operacao.registro_operacao_audio USING btree (data)
* CREATE INDEX ix_regop_data_sala ON operacao.registro_operacao_audio USING btree (data, sala_id)
* CREATE INDEX ix_regop_sala ON operacao.registro_operacao_audio USING btree (sala_id)
* CREATE UNIQUE INDEX registro_operacao_audio_pkey ON operacao.registro_operacao_audio USING btree (id)

---
# operacao.registro_operacao_operador

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('operacao.registro_operacao_operador_id_seq'::regclass)||
|registro_id|bigint|não|||
|operador_id|uuid|não|||
|ordem|smallint|não||Ordem de atuação (1, 2, 3...).|
|hora_entrada|time without time zone|não|||
|hora_saida|time without time zone|sim||Fim do turno; pode ser NULL no último operador.|
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18632_18655_1_not_null
* CHECK: 18632_18655_2_not_null
* CHECK: 18632_18655_3_not_null
* CHECK: 18632_18655_4_not_null
* CHECK: 18632_18655_5_not_null
* CHECK: 18632_18655_7_not_null
* CHECK: 18632_18655_8_not_null
* CHECK: ck_horas_coerentes
* CHECK: ck_regopop_ordem_pos
* FOREIGN KEY: registro_operacao_operador_operador_id_fkey
* FOREIGN KEY: registro_operacao_operador_registro_id_fkey
* PRIMARY KEY: registro_operacao_operador_pkey
* UNIQUE: uq_regopop_registro_ordem

## Chaves estrangeiras

* registro_operacao_operador_operador_id_fkey: (operador_id) → pessoa.operador(id)
* registro_operacao_operador_registro_id_fkey: (registro_id) → operacao.registro_operacao_audio(id)

## Índices

* CREATE INDEX ix_regopop_operador ON operacao.registro_operacao_operador USING btree (operador_id)
* CREATE INDEX ix_regopop_registro ON operacao.registro_operacao_operador USING btree (registro_id)
* CREATE UNIQUE INDEX registro_operacao_operador_pkey ON operacao.registro_operacao_operador USING btree (id)
* CREATE UNIQUE INDEX uq_regopop_registro_ordem ON operacao.registro_operacao_operador USING btree (registro_id, ordem)

---
# pessoa.administrador

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|uuid|não|gen_random_uuid()||
|nome_completo|text|não|||
|email|USER-DEFINED|não|||
|username|USER-DEFINED|não|||
|password_hash|text|não||Senha armazenada como hash (bcrypt via crypt()).|
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18437_18795_1_not_null
* CHECK: 18437_18795_2_not_null
* CHECK: 18437_18795_3_not_null
* CHECK: 18437_18795_4_not_null
* CHECK: 18437_18795_5_not_null
* CHECK: 18437_18795_6_not_null
* CHECK: 18437_18795_7_not_null
* PRIMARY KEY: administrador_pkey
* UNIQUE: uq_admin_email
* UNIQUE: uq_admin_username

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX administrador_pkey ON pessoa.administrador USING btree (id)
* CREATE UNIQUE INDEX uq_admin_email ON pessoa.administrador USING btree (email)
* CREATE UNIQUE INDEX uq_admin_username ON pessoa.administrador USING btree (username)

---
# pessoa.administrador_s

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('pessoa.administrador_s_id_seq'::regclass)||
|nome_completo|text|não|||
|email|text|não|||
|username|text|não|||
|senha|text|não|||
|ativo|boolean|não|true||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18437_19914_1_not_null
* CHECK: 18437_19914_2_not_null
* CHECK: 18437_19914_3_not_null
* CHECK: 18437_19914_4_not_null
* CHECK: 18437_19914_5_not_null
* CHECK: 18437_19914_6_not_null
* CHECK: 18437_19914_7_not_null
* CHECK: 18437_19914_8_not_null
* PRIMARY KEY: administrador_s_pkey
* UNIQUE: administrador_s_email_key
* UNIQUE: administrador_s_username_key

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX administrador_s_email_key ON pessoa.administrador_s USING btree (email)
* CREATE UNIQUE INDEX administrador_s_pkey ON pessoa.administrador_s USING btree (id)
* CREATE UNIQUE INDEX administrador_s_username_key ON pessoa.administrador_s USING btree (username)
* CREATE INDEX idx_administrador_s_username ON pessoa.administrador_s USING btree (username)

---
# pessoa.auth_sessions

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('pessoa.auth_sessions_id_seq'::regclass)||
|user_id|uuid|não|||
|refresh_token_hash|text|não|||
|created_at|timestamp with time zone|não|now()||
|last_activity|timestamp with time zone|não|now()||
|revoked|boolean|não|false||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18437_26627_1_not_null
* CHECK: 18437_26627_2_not_null
* CHECK: 18437_26627_3_not_null
* CHECK: 18437_26627_4_not_null
* CHECK: 18437_26627_5_not_null
* CHECK: 18437_26627_6_not_null
* PRIMARY KEY: auth_sessions_pkey

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX auth_sessions_pkey ON pessoa.auth_sessions USING btree (id)
* CREATE INDEX idx_auth_sessions_user ON pessoa.auth_sessions USING btree (user_id)
* CREATE UNIQUE INDEX uq_auth_sessions_rth ON pessoa.auth_sessions USING btree (refresh_token_hash)

---
# pessoa.operador

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|uuid|não|gen_random_uuid()||
|nome_completo|text|não|||
|email|USER-DEFINED|não|||
|username|USER-DEFINED|não|||
|foto_url|text|não|||
|password_hash|text|não|||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18437_18589_1_not_null
* CHECK: 18437_18589_2_not_null
* CHECK: 18437_18589_3_not_null
* CHECK: 18437_18589_4_not_null
* CHECK: 18437_18589_5_not_null
* CHECK: 18437_18589_6_not_null
* CHECK: 18437_18589_7_not_null
* CHECK: 18437_18589_8_not_null
* PRIMARY KEY: operador_pkey
* UNIQUE: uq_operador_email
* UNIQUE: uq_operador_username

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE INDEX ix_operador_email ON pessoa.operador USING btree (email)
* CREATE INDEX ix_operador_username ON pessoa.operador USING btree (username)
* CREATE UNIQUE INDEX operador_pkey ON pessoa.operador USING btree (id)
* CREATE UNIQUE INDEX uq_operador_email ON pessoa.operador USING btree (email)
* CREATE UNIQUE INDEX uq_operador_username ON pessoa.operador USING btree (username)

---
# pessoa.operador_s

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|bigint|não|nextval('pessoa.operador_s_id_seq'::regclass)||
|nome_completo|text|não|||
|email|text|não|||
|username|text|não|||
|senha|text|não|||
|ativo|boolean|não|true||
|criado_em|timestamp with time zone|não|now()||
|atualizado_em|timestamp with time zone|não|now()||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 18437_19898_1_not_null
* CHECK: 18437_19898_2_not_null
* CHECK: 18437_19898_3_not_null
* CHECK: 18437_19898_4_not_null
* CHECK: 18437_19898_5_not_null
* CHECK: 18437_19898_6_not_null
* CHECK: 18437_19898_7_not_null
* CHECK: 18437_19898_8_not_null
* PRIMARY KEY: operador_s_pkey
* UNIQUE: operador_s_email_key
* UNIQUE: operador_s_username_key

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE INDEX idx_operador_s_username ON pessoa.operador_s USING btree (username)
* CREATE UNIQUE INDEX operador_s_email_key ON pessoa.operador_s USING btree (email)
* CREATE UNIQUE INDEX operador_s_pkey ON pessoa.operador_s USING btree (id)
* CREATE UNIQUE INDEX operador_s_username_key ON pessoa.operador_s USING btree (username)

---
# public.annotation_tag_entity

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|name|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17168_1_not_null
* CHECK: 2200_17168_2_not_null
* CHECK: 2200_17168_3_not_null
* CHECK: 2200_17168_4_not_null
* PRIMARY KEY: PK_69dfa041592c30bbc0d4b84aa00

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "IDX_ae51b54c4bb430cf92f48b623f" ON public.annotation_tag_entity USING btree (name)
* CREATE UNIQUE INDEX "PK_69dfa041592c30bbc0d4b84aa00" ON public.annotation_tag_entity USING btree (id)

---
# public.auth_identity

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|userId|uuid|sim|||
|providerId|character varying|não|||
|providerType|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16695_2_not_null
* CHECK: 2200_16695_3_not_null
* CHECK: 2200_16695_4_not_null
* CHECK: 2200_16695_5_not_null
* FOREIGN KEY: auth_identity_userId_fkey
* PRIMARY KEY: auth_identity_pkey

## Chaves estrangeiras

* auth_identity_userId_fkey: (userId) → public.user(id)

## Índices

* CREATE UNIQUE INDEX auth_identity_pkey ON public.auth_identity USING btree ("providerId", "providerType")

---
# public.auth_provider_sync_history

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|nextval('auth_provider_sync_history_id_seq'::regclass)||
|providerType|character varying|não|||
|runMode|text|não|||
|status|text|não|||
|startedAt|timestamp with time zone|não|CURRENT_TIMESTAMP||
|endedAt|timestamp with time zone|não|CURRENT_TIMESTAMP||
|scanned|integer|não|||
|created|integer|não|||
|updated|integer|não|||
|disabled|integer|não|||
|error|text|sim|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16708_10_not_null
* CHECK: 2200_16708_1_not_null
* CHECK: 2200_16708_2_not_null
* CHECK: 2200_16708_3_not_null
* CHECK: 2200_16708_4_not_null
* CHECK: 2200_16708_5_not_null
* CHECK: 2200_16708_6_not_null
* CHECK: 2200_16708_7_not_null
* CHECK: 2200_16708_8_not_null
* CHECK: 2200_16708_9_not_null
* PRIMARY KEY: auth_provider_sync_history_pkey

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX auth_provider_sync_history_pkey ON public.auth_provider_sync_history USING btree (id)

---
# public.chat_hub_messages

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|uuid|não|||
|sessionId|uuid|não|||
|previousMessageId|uuid|sim|||
|revisionOfMessageId|uuid|sim|||
|retryOfMessageId|uuid|sim|||
|type|character varying|não||ChatHubMessageType enum: "human", "ai", "system", "tool", "generic"|
|name|character varying|não|||
|content|text|não|||
|provider|character varying|sim||ChatHubProvider enum: "openai", "anthropic", "google", "n8n"|
|model|character varying|sim||Model name used at the respective Model node, ie. "gpt-4"|
|workflowId|character varying|sim|||
|executionId|integer|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|status|character varying|não|'success'::character varying|ChatHubMessageStatus enum, eg. "success", "error", "running", "cancelled"|

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17626_10_not_null
* CHECK: 2200_17626_16_not_null
* CHECK: 2200_17626_17_not_null
* CHECK: 2200_17626_18_not_null
* CHECK: 2200_17626_1_not_null
* CHECK: 2200_17626_2_not_null
* CHECK: 2200_17626_7_not_null
* CHECK: 2200_17626_8_not_null
* FOREIGN KEY: FK_1f4998c8a7dec9e00a9ab15550e
* FOREIGN KEY: FK_25c9736e7f769f3a005eef4b372
* FOREIGN KEY: FK_6afb260449dd7a9b85355d4e0c9
* FOREIGN KEY: FK_acf8926098f063cdbbad8497fd1
* FOREIGN KEY: FK_e22538eb50a71a17954cd7e076c
* FOREIGN KEY: FK_e5d1fa722c5a8d38ac204746662
* PRIMARY KEY: PK_7704a5add6baed43eef835f0bfb

## Chaves estrangeiras

* FK_1f4998c8a7dec9e00a9ab15550e: (revisionOfMessageId) → public.chat_hub_messages(id)
* FK_25c9736e7f769f3a005eef4b372: (retryOfMessageId) → public.chat_hub_messages(id)
* FK_6afb260449dd7a9b85355d4e0c9: (executionId) → public.execution_entity(id)
* FK_acf8926098f063cdbbad8497fd1: (workflowId) → public.workflow_entity(id)
* FK_e22538eb50a71a17954cd7e076c: (sessionId) → public.chat_hub_sessions(id)
* FK_e5d1fa722c5a8d38ac204746662: (previousMessageId) → public.chat_hub_messages(id)

## Índices

* CREATE UNIQUE INDEX "PK_7704a5add6baed43eef835f0bfb" ON public.chat_hub_messages USING btree (id)

---
# public.chat_hub_sessions

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|uuid|não|||
|title|character varying|não|||
|ownerId|uuid|não|||
|lastMessageAt|timestamp with time zone|sim|||
|credentialId|character varying|sim|||
|provider|character varying|sim||ChatHubProvider enum: "openai", "anthropic", "google", "n8n"|
|model|character varying|sim||Model name used at the respective Model node, ie. "gpt-4"|
|workflowId|character varying|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17604_10_not_null
* CHECK: 2200_17604_1_not_null
* CHECK: 2200_17604_2_not_null
* CHECK: 2200_17604_3_not_null
* CHECK: 2200_17604_9_not_null
* FOREIGN KEY: FK_7bc13b4c7e6afbfaf9be326c189
* FOREIGN KEY: FK_9f9293d9f552496c40e0d1a8f80
* FOREIGN KEY: FK_e9ecf8ede7d989fcd18790fe36a
* PRIMARY KEY: PK_1eafef1273c70e4464fec703412

## Chaves estrangeiras

* FK_7bc13b4c7e6afbfaf9be326c189: (credentialId) → public.credentials_entity(id)
* FK_9f9293d9f552496c40e0d1a8f80: (workflowId) → public.workflow_entity(id)
* FK_e9ecf8ede7d989fcd18790fe36a: (ownerId) → public.user(id)

## Índices

* CREATE UNIQUE INDEX "PK_1eafef1273c70e4464fec703412" ON public.chat_hub_sessions USING btree (id)

---
# public.credentials_entity

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|name|character varying|não|||
|data|text|não|||
|type|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|id|character varying|não|||
|isManaged|boolean|não|false||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16411_2_not_null
* CHECK: 2200_16411_3_not_null
* CHECK: 2200_16411_4_not_null
* CHECK: 2200_16411_6_not_null
* CHECK: 2200_16411_7_not_null
* CHECK: 2200_16411_8_not_null
* CHECK: 2200_16411_9_not_null
* PRIMARY KEY: credentials_entity_pkey

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX credentials_entity_pkey ON public.credentials_entity USING btree (id)
* CREATE INDEX idx_07fde106c0b471d8cc80a64fc8 ON public.credentials_entity USING btree (type)
* CREATE UNIQUE INDEX pk_credentials_entity_id ON public.credentials_entity USING btree (id)

---
# public.data_table

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|name|character varying|não|||
|projectId|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17554_1_not_null
* CHECK: 2200_17554_2_not_null
* CHECK: 2200_17554_3_not_null
* CHECK: 2200_17554_4_not_null
* CHECK: 2200_17554_5_not_null
* FOREIGN KEY: FK_c2a794257dee48af7c9abf681de
* PRIMARY KEY: PK_e226d0001b9e6097cbfe70617cb
* UNIQUE: UQ_b23096ef747281ac944d28e8b0d

## Chaves estrangeiras

* FK_c2a794257dee48af7c9abf681de: (projectId) → public.project(id)

## Índices

* CREATE UNIQUE INDEX "PK_e226d0001b9e6097cbfe70617cb" ON public.data_table USING btree (id)
* CREATE UNIQUE INDEX "UQ_b23096ef747281ac944d28e8b0d" ON public.data_table USING btree ("projectId", name)

---
# public.data_table_column

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|name|character varying|não|||
|type|character varying|não||Expected: string, number, boolean, or date (not enforced as a constraint)|
|index|integer|não||Column order, starting from 0 (0 = first column)|
|dataTableId|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17568_1_not_null
* CHECK: 2200_17568_2_not_null
* CHECK: 2200_17568_3_not_null
* CHECK: 2200_17568_4_not_null
* CHECK: 2200_17568_5_not_null
* CHECK: 2200_17568_6_not_null
* CHECK: 2200_17568_7_not_null
* FOREIGN KEY: FK_930b6e8faaf88294cef23484160
* PRIMARY KEY: PK_673cb121ee4a8a5e27850c72c51
* UNIQUE: UQ_8082ec4890f892f0bc77473a123

## Chaves estrangeiras

* FK_930b6e8faaf88294cef23484160: (dataTableId) → public.data_table(id)

## Índices

* CREATE UNIQUE INDEX "PK_673cb121ee4a8a5e27850c72c51" ON public.data_table_column USING btree (id)
* CREATE UNIQUE INDEX "UQ_8082ec4890f892f0bc77473a123" ON public.data_table_column USING btree ("dataTableId", name)

---
# public.data_table_user_5EBBvwJHpAKSfA9V

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_27401_1_not_null
* CHECK: 2200_27401_2_not_null
* CHECK: 2200_27401_3_not_null
* PRIMARY KEY: PK_e3f17108f246c82a2859894a7d8

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "PK_e3f17108f246c82a2859894a7d8" ON public."data_table_user_5EBBvwJHpAKSfA9V" USING btree (id)

---
# public.event_destinations

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|uuid|não|||
|destination|jsonb|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16664_1_not_null
* CHECK: 2200_16664_2_not_null
* CHECK: 2200_16664_3_not_null
* CHECK: 2200_16664_4_not_null
* PRIMARY KEY: event_destinations_pkey

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX event_destinations_pkey ON public.event_destinations USING btree (id)

---
# public.execution_annotation_tags

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|annotationId|integer|não|||
|tagId|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17176_1_not_null
* CHECK: 2200_17176_2_not_null
* FOREIGN KEY: FK_a3697779b366e131b2bbdae2976
* FOREIGN KEY: FK_c1519757391996eb06064f0e7c8
* PRIMARY KEY: PK_979ec03d31294cca484be65d11f

## Chaves estrangeiras

* FK_a3697779b366e131b2bbdae2976: (tagId) → public.annotation_tag_entity(id)
* FK_c1519757391996eb06064f0e7c8: (annotationId) → public.execution_annotations(id)

## Índices

* CREATE INDEX "IDX_a3697779b366e131b2bbdae297" ON public.execution_annotation_tags USING btree ("tagId")
* CREATE INDEX "IDX_c1519757391996eb06064f0e7c" ON public.execution_annotation_tags USING btree ("annotationId")
* CREATE UNIQUE INDEX "PK_979ec03d31294cca484be65d11f" ON public.execution_annotation_tags USING btree ("annotationId", "tagId")

---
# public.execution_annotations

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|nextval('execution_annotations_id_seq'::regclass)||
|executionId|integer|não|||
|vote|character varying|sim|||
|note|text|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17152_1_not_null
* CHECK: 2200_17152_2_not_null
* CHECK: 2200_17152_5_not_null
* CHECK: 2200_17152_6_not_null
* FOREIGN KEY: FK_97f863fa83c4786f19565084960
* PRIMARY KEY: PK_7afcf93ffa20c4252869a7c6a23

## Chaves estrangeiras

* FK_97f863fa83c4786f19565084960: (executionId) → public.execution_entity(id)

## Índices

* CREATE UNIQUE INDEX "IDX_97f863fa83c4786f1956508496" ON public.execution_annotations USING btree ("executionId")
* CREATE UNIQUE INDEX "PK_7afcf93ffa20c4252869a7c6a23" ON public.execution_annotations USING btree (id)

---
# public.execution_data

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|executionId|integer|não|||
|workflowData|json|não|||
|data|text|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16803_1_not_null
* CHECK: 2200_16803_2_not_null
* CHECK: 2200_16803_3_not_null
* FOREIGN KEY: execution_data_fk
* PRIMARY KEY: execution_data_pkey

## Chaves estrangeiras

* execution_data_fk: (executionId) → public.execution_entity(id)

## Índices

* CREATE UNIQUE INDEX execution_data_pkey ON public.execution_data USING btree ("executionId")

---
# public.execution_entity

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|nextval('execution_entity_id_seq'::regclass)||
|finished|boolean|não|||
|mode|character varying|não|||
|retryOf|character varying|sim|||
|retrySuccessId|character varying|sim|||
|startedAt|timestamp with time zone|sim|||
|stoppedAt|timestamp with time zone|sim|||
|waitTill|timestamp with time zone|sim|||
|status|character varying|não|||
|workflowId|character varying|não|||
|deletedAt|timestamp with time zone|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16421_12_not_null
* CHECK: 2200_16421_13_not_null
* CHECK: 2200_16421_15_not_null
* CHECK: 2200_16421_1_not_null
* CHECK: 2200_16421_3_not_null
* CHECK: 2200_16421_4_not_null
* FOREIGN KEY: fk_execution_entity_workflow_id
* PRIMARY KEY: pk_e3e63bbf986767844bbe1166d4e

## Chaves estrangeiras

* fk_execution_entity_workflow_id: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE INDEX "IDX_execution_entity_deletedAt" ON public.execution_entity USING btree ("deletedAt")
* CREATE INDEX idx_execution_entity_stopped_at_status_deleted_at ON public.execution_entity USING btree ("stoppedAt", status, "deletedAt") WHERE (("stoppedAt" IS NOT NULL) AND ("deletedAt" IS NULL))
* CREATE INDEX idx_execution_entity_wait_till_status_deleted_at ON public.execution_entity USING btree ("waitTill", status, "deletedAt") WHERE (("waitTill" IS NOT NULL) AND ("deletedAt" IS NULL))
* CREATE INDEX idx_execution_entity_workflow_id_started_at ON public.execution_entity USING btree ("workflowId", "startedAt") WHERE (("startedAt" IS NOT NULL) AND ("deletedAt" IS NULL))
* CREATE UNIQUE INDEX pk_e3e63bbf986767844bbe1166d4e ON public.execution_entity USING btree (id)

---
# public.execution_metadata

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|nextval('execution_metadata_temp_id_seq'::regclass)||
|executionId|integer|não|||
|key|character varying|não|||
|value|text|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17127_1_not_null
* CHECK: 2200_17127_2_not_null
* CHECK: 2200_17127_3_not_null
* CHECK: 2200_17127_4_not_null
* FOREIGN KEY: FK_31d0b4c93fb85ced26f6005cda3
* PRIMARY KEY: PK_17a0b6284f8d626aae88e1c16e4

## Chaves estrangeiras

* FK_31d0b4c93fb85ced26f6005cda3: (executionId) → public.execution_entity(id)

## Índices

* CREATE UNIQUE INDEX "IDX_cec8eea3bf49551482ccb4933e" ON public.execution_metadata USING btree ("executionId", key)
* CREATE UNIQUE INDEX "PK_17a0b6284f8d626aae88e1c16e4" ON public.execution_metadata USING btree (id)

---
# public.folder

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|name|character varying|não|||
|parentFolderId|character varying|sim|||
|projectId|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17320_1_not_null
* CHECK: 2200_17320_2_not_null
* CHECK: 2200_17320_4_not_null
* CHECK: 2200_17320_5_not_null
* CHECK: 2200_17320_6_not_null
* FOREIGN KEY: FK_804ea52f6729e3940498bd54d78
* FOREIGN KEY: FK_a8260b0b36939c6247f385b8221
* PRIMARY KEY: PK_6278a41a706740c94c02e288df8

## Chaves estrangeiras

* FK_804ea52f6729e3940498bd54d78: (parentFolderId) → public.folder(id)
* FK_a8260b0b36939c6247f385b8221: (projectId) → public.project(id)

## Índices

* CREATE UNIQUE INDEX "IDX_14f68deffaf858465715995508" ON public.folder USING btree ("projectId", id)
* CREATE UNIQUE INDEX "PK_6278a41a706740c94c02e288df8" ON public.folder USING btree (id)

---
# public.folder_tag

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|folderId|character varying|não|||
|tagId|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17338_1_not_null
* CHECK: 2200_17338_2_not_null
* FOREIGN KEY: FK_94a60854e06f2897b2e0d39edba
* FOREIGN KEY: FK_dc88164176283de80af47621746
* PRIMARY KEY: PK_27e4e00852f6b06a925a4d83a3e

## Chaves estrangeiras

* FK_94a60854e06f2897b2e0d39edba: (folderId) → public.folder(id)
* FK_dc88164176283de80af47621746: (tagId) → public.tag_entity(id)

## Índices

* CREATE UNIQUE INDEX "PK_27e4e00852f6b06a925a4d83a3e" ON public.folder_tag USING btree ("folderId", "tagId")

---
# public.insights_by_period

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|||
|metaId|integer|não|||
|type|integer|não||0: time_saved_minutes, 1: runtime_milliseconds, 2: success, 3: failure|
|value|bigint|não|||
|periodUnit|integer|não||0: hour, 1: day, 2: week|
|periodStart|timestamp with time zone|sim|CURRENT_TIMESTAMP||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17434_1_not_null
* CHECK: 2200_17434_2_not_null
* CHECK: 2200_17434_3_not_null
* CHECK: 2200_17434_4_not_null
* CHECK: 2200_17434_5_not_null
* FOREIGN KEY: FK_6414cfed98daabbfdd61a1cfbc0
* PRIMARY KEY: PK_b606942249b90cc39b0265f0575

## Chaves estrangeiras

* FK_6414cfed98daabbfdd61a1cfbc0: (metaId) → public.insights_metadata(metaId)

## Índices

* CREATE UNIQUE INDEX "IDX_60b6a84299eeb3f671dfec7693" ON public.insights_by_period USING btree ("periodStart", type, "periodUnit", "metaId")
* CREATE UNIQUE INDEX "PK_b606942249b90cc39b0265f0575" ON public.insights_by_period USING btree (id)

---
# public.insights_metadata

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|metaId|integer|não|||
|workflowId|character varying|sim|||
|projectId|character varying|sim|||
|workflowName|character varying|não|||
|projectName|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17405_1_not_null
* CHECK: 2200_17405_4_not_null
* CHECK: 2200_17405_5_not_null
* FOREIGN KEY: FK_1d8ab99d5861c9388d2dc1cf733
* FOREIGN KEY: FK_2375a1eda085adb16b24615b69c
* PRIMARY KEY: PK_f448a94c35218b6208ce20cf5a1

## Chaves estrangeiras

* FK_1d8ab99d5861c9388d2dc1cf733: (workflowId) → public.workflow_entity(id)
* FK_2375a1eda085adb16b24615b69c: (projectId) → public.project(id)

## Índices

* CREATE UNIQUE INDEX "IDX_1d8ab99d5861c9388d2dc1cf73" ON public.insights_metadata USING btree ("workflowId")
* CREATE UNIQUE INDEX "PK_f448a94c35218b6208ce20cf5a1" ON public.insights_metadata USING btree ("metaId")

---
# public.insights_raw

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|||
|metaId|integer|não|||
|type|integer|não||0: time_saved_minutes, 1: runtime_milliseconds, 2: success, 3: failure|
|value|bigint|não|||
|timestamp|timestamp with time zone|não|CURRENT_TIMESTAMP||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17422_1_not_null
* CHECK: 2200_17422_2_not_null
* CHECK: 2200_17422_3_not_null
* CHECK: 2200_17422_4_not_null
* CHECK: 2200_17422_5_not_null
* FOREIGN KEY: FK_6e2e33741adef2a7c5d66befa4e
* PRIMARY KEY: PK_ec15125755151e3a7e00e00014f

## Chaves estrangeiras

* FK_6e2e33741adef2a7c5d66befa4e: (metaId) → public.insights_metadata(metaId)

## Índices

* CREATE UNIQUE INDEX "PK_ec15125755151e3a7e00e00014f" ON public.insights_raw USING btree (id)

---
# public.installed_nodes

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|name|character varying|não|||
|type|character varying|não|||
|latestVersion|integer|não|1||
|package|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16613_1_not_null
* CHECK: 2200_16613_2_not_null
* CHECK: 2200_16613_3_not_null
* CHECK: 2200_16613_4_not_null
* FOREIGN KEY: FK_73f857fc5dce682cef8a99c11dbddbc969618951
* PRIMARY KEY: PK_8ebd28194e4f792f96b5933423fc439df97d9689

## Chaves estrangeiras

* FK_73f857fc5dce682cef8a99c11dbddbc969618951: (package) → public.installed_packages(packageName)

## Índices

* CREATE UNIQUE INDEX "PK_8ebd28194e4f792f96b5933423fc439df97d9689" ON public.installed_nodes USING btree (name)

---
# public.installed_packages

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|packageName|character varying|não|||
|installedVersion|character varying|não|||
|authorName|character varying|sim|||
|authorEmail|character varying|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16606_1_not_null
* CHECK: 2200_16606_2_not_null
* CHECK: 2200_16606_5_not_null
* CHECK: 2200_16606_6_not_null
* PRIMARY KEY: PK_08cc9197c39b028c1e9beca225940576fd1a5804

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "PK_08cc9197c39b028c1e9beca225940576fd1a5804" ON public.installed_packages USING btree ("packageName")

---
# public.invalid_auth_token

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|token|character varying|não|||
|expiresAt|timestamp with time zone|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17141_1_not_null
* CHECK: 2200_17141_2_not_null
* PRIMARY KEY: PK_5779069b7235b256d91f7af1a15

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "PK_5779069b7235b256d91f7af1a15" ON public.invalid_auth_token USING btree (token)

---
# public.migrations

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|nextval('migrations_id_seq'::regclass)||
|timestamp|bigint|não|||
|name|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16402_1_not_null
* CHECK: 2200_16402_2_not_null
* CHECK: 2200_16402_3_not_null
* PRIMARY KEY: PK_8c82d7f526340ab734260ea46be

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "PK_8c82d7f526340ab734260ea46be" ON public.migrations USING btree (id)

---
# public.processed_data

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|workflowId|character varying|não|||
|context|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|value|text|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17209_1_not_null
* CHECK: 2200_17209_3_not_null
* CHECK: 2200_17209_4_not_null
* CHECK: 2200_17209_5_not_null
* CHECK: 2200_17209_6_not_null
* FOREIGN KEY: FK_06a69a7032c97a763c2c7599464
* PRIMARY KEY: PK_ca04b9d8dc72de268fe07a65773

## Chaves estrangeiras

* FK_06a69a7032c97a763c2c7599464: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE UNIQUE INDEX "PK_ca04b9d8dc72de268fe07a65773" ON public.processed_data USING btree ("workflowId", context)

---
# public.project

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|name|character varying|não|||
|type|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|icon|json|sim|||
|description|character varying|sim|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17046_1_not_null
* CHECK: 2200_17046_2_not_null
* CHECK: 2200_17046_3_not_null
* CHECK: 2200_17046_4_not_null
* CHECK: 2200_17046_5_not_null
* PRIMARY KEY: PK_4d68b1358bb5b766d3e78f32f57

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "PK_4d68b1358bb5b766d3e78f32f57" ON public.project USING btree (id)

---
# public.project_relation

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|projectId|character varying|não|||
|userId|uuid|não|||
|role|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17053_1_not_null
* CHECK: 2200_17053_2_not_null
* CHECK: 2200_17053_3_not_null
* CHECK: 2200_17053_4_not_null
* CHECK: 2200_17053_5_not_null
* FOREIGN KEY: FK_5f0643f6717905a05164090dde7
* FOREIGN KEY: FK_61448d56d61802b5dfde5cdb002
* FOREIGN KEY: FK_c6b99592dc96b0d836d7a21db91
* PRIMARY KEY: PK_1caaa312a5d7184a003be0f0cb6

## Chaves estrangeiras

* FK_5f0643f6717905a05164090dde7: (userId) → public.user(id)
* FK_61448d56d61802b5dfde5cdb002: (projectId) → public.project(id)
* FK_c6b99592dc96b0d836d7a21db91: (role) → public.role(slug)

## Índices

* CREATE INDEX "IDX_5f0643f6717905a05164090dde" ON public.project_relation USING btree ("userId")
* CREATE INDEX "IDX_61448d56d61802b5dfde5cdb00" ON public.project_relation USING btree ("projectId")
* CREATE UNIQUE INDEX "PK_1caaa312a5d7184a003be0f0cb6" ON public.project_relation USING btree ("projectId", "userId")
* CREATE INDEX project_relation_role_idx ON public.project_relation USING btree (role)
* CREATE INDEX project_relation_role_project_idx ON public.project_relation USING btree ("projectId", role)

---
# public.role

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|slug|character varying|não||Unique identifier of the role for example: "global:owner"|
|displayName|text|sim||Name used to display in the UI|
|description|text|sim||Text describing the scope in more detail of users|
|roleType|text|sim||Type of the role, e.g., global, project, or workflow|
|systemRole|boolean|não|false|Indicates if the role is managed by the system and cannot be edited|
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17490_1_not_null
* CHECK: 2200_17490_5_not_null
* CHECK: 2200_17490_6_not_null
* CHECK: 2200_17490_7_not_null
* PRIMARY KEY: PK_35c9b140caaf6da09cfabb0d675

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "IDX_UniqueRoleDisplayName" ON public.role USING btree ("displayName")
* CREATE UNIQUE INDEX "PK_35c9b140caaf6da09cfabb0d675" ON public.role USING btree (slug)

---
# public.role_scope

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|roleSlug|character varying|não|||
|scopeSlug|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17498_1_not_null
* CHECK: 2200_17498_2_not_null
* FOREIGN KEY: FK_role
* FOREIGN KEY: FK_scope
* PRIMARY KEY: PK_role_scope

## Chaves estrangeiras

* FK_role: (roleSlug) → public.role(slug)
* FK_scope: (scopeSlug) → public.scope(slug)

## Índices

* CREATE INDEX "IDX_role_scope_scopeSlug" ON public.role_scope USING btree ("scopeSlug")
* CREATE UNIQUE INDEX "PK_role_scope" ON public.role_scope USING btree ("roleSlug", "scopeSlug")

---
# public.scope

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|slug|character varying|não||Unique identifier of the scope for example: "project:create"|
|displayName|text|sim||Name used to display in the UI|
|description|text|sim||Text describing the scope in more detail of users|

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17483_1_not_null
* PRIMARY KEY: PK_bfc45df0481abd7f355d6187da1

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "PK_bfc45df0481abd7f355d6187da1" ON public.scope USING btree (slug)

---
# public.settings

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|key|character varying|não|||
|value|text|não|||
|loadOnStartup|boolean|não|false||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16598_1_not_null
* CHECK: 2200_16598_2_not_null
* CHECK: 2200_16598_3_not_null
* PRIMARY KEY: PK_dc0fe14e6d9943f268e7b119f69ab8bd

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX "PK_dc0fe14e6d9943f268e7b119f69ab8bd" ON public.settings USING btree (key)

---
# public.shared_credentials

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|credentialsId|character varying|não|||
|projectId|character varying|não|||
|role|text|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17081_1_not_null
* CHECK: 2200_17081_2_not_null
* CHECK: 2200_17081_3_not_null
* CHECK: 2200_17081_4_not_null
* CHECK: 2200_17081_5_not_null
* FOREIGN KEY: FK_416f66fc846c7c442970c094ccf
* FOREIGN KEY: FK_812c2852270da1247756e77f5a4
* PRIMARY KEY: PK_8ef3a59796a228913f251779cff

## Chaves estrangeiras

* FK_416f66fc846c7c442970c094ccf: (credentialsId) → public.credentials_entity(id)
* FK_812c2852270da1247756e77f5a4: (projectId) → public.project(id)

## Índices

* CREATE UNIQUE INDEX "PK_8ef3a59796a228913f251779cff" ON public.shared_credentials USING btree ("credentialsId", "projectId")

---
# public.shared_workflow

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|workflowId|character varying|não|||
|projectId|character varying|não|||
|role|text|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17107_1_not_null
* CHECK: 2200_17107_2_not_null
* CHECK: 2200_17107_3_not_null
* CHECK: 2200_17107_4_not_null
* CHECK: 2200_17107_5_not_null
* FOREIGN KEY: FK_a45ea5f27bcfdc21af9b4188560
* FOREIGN KEY: FK_daa206a04983d47d0a9c34649ce
* PRIMARY KEY: PK_5ba87620386b847201c9531c58f

## Chaves estrangeiras

* FK_a45ea5f27bcfdc21af9b4188560: (projectId) → public.project(id)
* FK_daa206a04983d47d0a9c34649ce: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE UNIQUE INDEX "PK_5ba87620386b847201c9531c58f" ON public.shared_workflow USING btree ("workflowId", "projectId")

---
# public.tag_entity

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|name|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|id|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16449_2_not_null
* CHECK: 2200_16449_3_not_null
* CHECK: 2200_16449_4_not_null
* CHECK: 2200_16449_5_not_null
* PRIMARY KEY: tag_entity_pkey

## Chaves estrangeiras

* (nenhuma)

## Índices

* CREATE UNIQUE INDEX idx_812eb05f7451ca757fb98444ce ON public.tag_entity USING btree (name)
* CREATE UNIQUE INDEX pk_tag_entity_id ON public.tag_entity USING btree (id)
* CREATE UNIQUE INDEX tag_entity_pkey ON public.tag_entity USING btree (id)

---
# public.test_case_execution

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|testRunId|character varying|não|||
|executionId|integer|sim|||
|status|character varying|não|||
|runAt|timestamp with time zone|sim|||
|completedAt|timestamp with time zone|sim|||
|errorCode|character varying|sim|||
|errorDetails|json|sim|||
|metrics|json|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|inputs|json|sim|||
|outputs|json|sim|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17461_10_not_null
* CHECK: 2200_17461_11_not_null
* CHECK: 2200_17461_1_not_null
* CHECK: 2200_17461_2_not_null
* CHECK: 2200_17461_4_not_null
* FOREIGN KEY: FK_8e4b4774db42f1e6dda3452b2af
* FOREIGN KEY: FK_e48965fac35d0f5b9e7f51d8c44
* PRIMARY KEY: PK_90c121f77a78a6580e94b794bce

## Chaves estrangeiras

* FK_8e4b4774db42f1e6dda3452b2af: (testRunId) → public.test_run(id)
* FK_e48965fac35d0f5b9e7f51d8c44: (executionId) → public.execution_entity(id)

## Índices

* CREATE INDEX "IDX_8e4b4774db42f1e6dda3452b2a" ON public.test_case_execution USING btree ("testRunId")
* CREATE UNIQUE INDEX "PK_90c121f77a78a6580e94b794bce" ON public.test_case_execution USING btree (id)

---
# public.test_run

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|workflowId|character varying|não|||
|status|character varying|não|||
|errorCode|character varying|sim|||
|errorDetails|json|sim|||
|runAt|timestamp with time zone|sim|||
|completedAt|timestamp with time zone|sim|||
|metrics|json|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17446_10_not_null
* CHECK: 2200_17446_1_not_null
* CHECK: 2200_17446_2_not_null
* CHECK: 2200_17446_3_not_null
* CHECK: 2200_17446_9_not_null
* FOREIGN KEY: FK_d6870d3b6e4c185d33926f423c8
* PRIMARY KEY: PK_011c050f566e9db509a0fadb9b9

## Chaves estrangeiras

* FK_d6870d3b6e4c185d33926f423c8: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE INDEX "IDX_d6870d3b6e4c185d33926f423c" ON public.test_run USING btree ("workflowId")
* CREATE UNIQUE INDEX "PK_011c050f566e9db509a0fadb9b9" ON public.test_run USING btree (id)

---
# public.user

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|uuid|não|uuid_in((OVERLAY(OVERLAY(md5((((random())::text || ':'::text) || (clock_timestamp())::text)) PLACING '4'::text FROM 13) PLACING to_hex((floor(((random() * (((11 - 8) + 1))::double precision) + (8)::double precision)))::integer) FROM 17))::cstring)||
|email|character varying|sim|||
|firstName|character varying|sim|||
|lastName|character varying|sim|||
|password|character varying|sim|||
|personalizationAnswers|json|sim|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|settings|json|sim|||
|disabled|boolean|não|false||
|mfaEnabled|boolean|não|false||
|mfaSecret|text|sim|||
|mfaRecoveryCodes|text|sim|||
|lastActiveAt|date|sim|||
|roleSlug|character varying|não|'global:member'::character varying||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16535_10_not_null
* CHECK: 2200_16535_14_not_null
* CHECK: 2200_16535_15_not_null
* CHECK: 2200_16535_1_not_null
* CHECK: 2200_16535_20_not_null
* CHECK: 2200_16535_9_not_null
* FOREIGN KEY: FK_eaea92ee7bfb9c1b6cd01505d56
* PRIMARY KEY: PK_ea8f538c94b6e352418254ed6474a81f
* UNIQUE: UQ_e12875dfb3b1d92d7d7c5377e2

## Chaves estrangeiras

* FK_eaea92ee7bfb9c1b6cd01505d56: (roleSlug) → public.role(slug)

## Índices

* CREATE UNIQUE INDEX "PK_ea8f538c94b6e352418254ed6474a81f" ON public."user" USING btree (id)
* CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e2" ON public."user" USING btree (email)
* CREATE INDEX user_role_idx ON public."user" USING btree ("roleSlug")

---
# public.user_api_keys

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|character varying|não|||
|userId|uuid|não|||
|label|character varying|não|||
|apiKey|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|scopes|json|sim|||
|audience|character varying|não|'public-api'::character varying||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17193_1_not_null
* CHECK: 2200_17193_2_not_null
* CHECK: 2200_17193_3_not_null
* CHECK: 2200_17193_4_not_null
* CHECK: 2200_17193_5_not_null
* CHECK: 2200_17193_6_not_null
* CHECK: 2200_17193_8_not_null
* FOREIGN KEY: FK_e131705cbbc8fb589889b02d457
* PRIMARY KEY: PK_978fa5caa3468f463dac9d92e69

## Chaves estrangeiras

* FK_e131705cbbc8fb589889b02d457: (userId) → public.user(id)

## Índices

* CREATE UNIQUE INDEX "IDX_1ef35bac35d20bdae979d917a3" ON public.user_api_keys USING btree ("apiKey")
* CREATE UNIQUE INDEX "IDX_63d7bbae72c767cf162d459fcc" ON public.user_api_keys USING btree ("userId", label)
* CREATE UNIQUE INDEX "PK_978fa5caa3468f463dac9d92e69" ON public.user_api_keys USING btree (id)

---
# public.variables

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|key|character varying|não|||
|type|character varying|não|'string'::character varying||
|value|character varying|sim|||
|id|character varying|não|||
|projectId|character varying|sim|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16719_2_not_null
* CHECK: 2200_16719_3_not_null
* CHECK: 2200_16719_5_not_null
* FOREIGN KEY: FK_42f6c766f9f9d2edcc15bdd6e9b
* PRIMARY KEY: variables_pkey

## Chaves estrangeiras

* FK_42f6c766f9f9d2edcc15bdd6e9b: (projectId) → public.project(id)

## Índices

* CREATE UNIQUE INDEX variables_global_key_unique ON public.variables USING btree (key) WHERE ("projectId" IS NULL)
* CREATE UNIQUE INDEX variables_pkey ON public.variables USING btree (id)
* CREATE UNIQUE INDEX variables_project_key_unique ON public.variables USING btree ("projectId", key) WHERE ("projectId" IS NOT NULL)

---
# public.webhook_entity

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|webhookPath|character varying|não|||
|method|character varying|não|||
|node|character varying|não|||
|webhookId|character varying|sim|||
|pathLength|integer|sim|||
|workflowId|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16439_2_not_null
* CHECK: 2200_16439_3_not_null
* CHECK: 2200_16439_4_not_null
* CHECK: 2200_16439_7_not_null
* FOREIGN KEY: fk_webhook_entity_workflow_id
* PRIMARY KEY: PK_b21ace2e13596ccd87dc9bf4ea6

## Chaves estrangeiras

* fk_webhook_entity_workflow_id: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE UNIQUE INDEX "PK_b21ace2e13596ccd87dc9bf4ea6" ON public.webhook_entity USING btree ("webhookPath", method)
* CREATE INDEX idx_16f4436789e804e3e1c9eeb240 ON public.webhook_entity USING btree ("webhookId", method, "pathLength")

---
# public.workflow_dependency

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|id|integer|não|||
|workflowId|character varying|não|||
|workflowVersionId|integer|não||Version of the workflow|
|dependencyType|character varying|não||Type of dependency: "credential", "nodeType", "webhookPath", or "workflowCall"|
|dependencyKey|character varying|não||ID or name of the dependency|
|dependencyInfo|character varying|sim||Additional info about the dependency, interpreted based on type|
|indexVersionId|smallint|não|1|Version of the index structure|
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_17674_1_not_null
* CHECK: 2200_17674_2_not_null
* CHECK: 2200_17674_3_not_null
* CHECK: 2200_17674_4_not_null
* CHECK: 2200_17674_5_not_null
* CHECK: 2200_17674_7_not_null
* CHECK: 2200_17674_8_not_null
* FOREIGN KEY: FK_a4ff2d9b9628ea988fa9e7d0bf8
* PRIMARY KEY: PK_52325e34cd7a2f0f67b0f3cad65

## Chaves estrangeiras

* FK_a4ff2d9b9628ea988fa9e7d0bf8: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE INDEX "IDX_a4ff2d9b9628ea988fa9e7d0bf" ON public.workflow_dependency USING btree ("workflowId")
* CREATE INDEX "IDX_e48a201071ab85d9d09119d640" ON public.workflow_dependency USING btree ("dependencyKey")
* CREATE INDEX "IDX_e7fe1cfda990c14a445937d0b9" ON public.workflow_dependency USING btree ("dependencyType")
* CREATE UNIQUE INDEX "PK_52325e34cd7a2f0f67b0f3cad65" ON public.workflow_dependency USING btree (id)

---
# public.workflow_entity

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|name|character varying|não|||
|active|boolean|não|||
|nodes|json|não|||
|connections|json|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|settings|json|sim|||
|staticData|json|sim|||
|pinData|json|sim|||
|versionId|character|sim|||
|triggerCount|integer|não|0||
|id|character varying|não|||
|meta|json|sim|||
|parentFolderId|character varying|sim|NULL::character varying||
|isArchived|boolean|não|false||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16431_13_not_null
* CHECK: 2200_16431_14_not_null
* CHECK: 2200_16431_17_not_null
* CHECK: 2200_16431_2_not_null
* CHECK: 2200_16431_3_not_null
* CHECK: 2200_16431_4_not_null
* CHECK: 2200_16431_5_not_null
* CHECK: 2200_16431_6_not_null
* CHECK: 2200_16431_7_not_null
* FOREIGN KEY: fk_workflow_parent_folder
* PRIMARY KEY: workflow_entity_pkey

## Chaves estrangeiras

* fk_workflow_parent_folder: (parentFolderId) → public.folder(id)

## Índices

* CREATE INDEX "IDX_workflow_entity_name" ON public.workflow_entity USING btree (name)
* CREATE UNIQUE INDEX pk_workflow_entity_id ON public.workflow_entity USING btree (id)
* CREATE UNIQUE INDEX workflow_entity_pkey ON public.workflow_entity USING btree (id)

---
# public.workflow_history

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|versionId|character varying|não|||
|workflowId|character varying|não|||
|authors|character varying|não|||
|createdAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|updatedAt|timestamp with time zone|não|CURRENT_TIMESTAMP(3)||
|nodes|json|não|||
|connections|json|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16817_1_not_null
* CHECK: 2200_16817_2_not_null
* CHECK: 2200_16817_5_not_null
* CHECK: 2200_16817_6_not_null
* CHECK: 2200_16817_7_not_null
* CHECK: 2200_16817_8_not_null
* CHECK: 2200_16817_9_not_null
* FOREIGN KEY: FK_1e31657f5fe46816c34be7c1b4b
* PRIMARY KEY: PK_b6572dd6173e4cd06fe79937b58

## Chaves estrangeiras

* FK_1e31657f5fe46816c34be7c1b4b: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE INDEX "IDX_1e31657f5fe46816c34be7c1b4" ON public.workflow_history USING btree ("workflowId")
* CREATE UNIQUE INDEX "PK_b6572dd6173e4cd06fe79937b58" ON public.workflow_history USING btree ("versionId")

---
# public.workflow_statistics

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|count|integer|sim|0||
|latestEvent|timestamp with time zone|sim|||
|name|character varying|não|||
|workflowId|character varying|não|||
|rootCount|integer|sim|0||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16634_3_not_null
* CHECK: 2200_16634_5_not_null
* FOREIGN KEY: fk_workflow_statistics_workflow_id
* PRIMARY KEY: pk_workflow_statistics

## Chaves estrangeiras

* fk_workflow_statistics_workflow_id: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE UNIQUE INDEX pk_workflow_statistics ON public.workflow_statistics USING btree ("workflowId", name)

---
# public.workflows_tags

## Colunas

|nome|tipo|nulo|default|descrição|
|---|---|---|---|---|
|workflowId|character varying|não|||
|tagId|character varying|não|||

## Restrições (PK/FK/UQ/CHK)

* CHECK: 2200_16456_3_not_null
* CHECK: 2200_16456_4_not_null
* FOREIGN KEY: fk_workflows_tags_tag_id
* FOREIGN KEY: fk_workflows_tags_workflow_id
* PRIMARY KEY: pk_workflows_tags

## Chaves estrangeiras

* fk_workflows_tags_tag_id: (tagId) → public.tag_entity(id)
* fk_workflows_tags_workflow_id: (workflowId) → public.workflow_entity(id)

## Índices

* CREATE INDEX idx_workflows_tags_workflow_id ON public.workflows_tags USING btree ("workflowId")
* CREATE UNIQUE INDEX pk_workflows_tags ON public.workflows_tags USING btree ("workflowId", "tagId")

---
