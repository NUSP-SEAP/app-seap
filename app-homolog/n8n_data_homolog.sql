--
-- PostgreSQL database dump
--

\restrict Xbnrcw4NkhbfCKNBxQBGuKUmdkV0vBGZScXjnzS5339vfcXwDacR7G0Qa6rp2c5

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 18.0

-- Started on 2026-02-06 11:39:06 -03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 9 (class 2615 OID 54437)
-- Name: cadastro; Type: SCHEMA; Schema: -; Owner: n8n_user
--

CREATE SCHEMA cadastro;


ALTER SCHEMA cadastro OWNER TO n8n_user;

--
-- TOC entry 10 (class 2615 OID 54438)
-- Name: forms; Type: SCHEMA; Schema: -; Owner: n8n_user
--

CREATE SCHEMA forms;


ALTER SCHEMA forms OWNER TO n8n_user;

--
-- TOC entry 11 (class 2615 OID 54439)
-- Name: operacao; Type: SCHEMA; Schema: -; Owner: n8n_user
--

CREATE SCHEMA operacao;


ALTER SCHEMA operacao OWNER TO n8n_user;

--
-- TOC entry 12 (class 2615 OID 54440)
-- Name: pessoa; Type: SCHEMA; Schema: -; Owner: n8n_user
--

CREATE SCHEMA pessoa;


ALTER SCHEMA pessoa OWNER TO n8n_user;

--
-- TOC entry 376 (class 1255 OID 54594)
-- Name: set_updated_at(); Type: FUNCTION; Schema: cadastro; Owner: n8n_user
--

CREATE FUNCTION cadastro.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION cadastro.set_updated_at() OWNER TO n8n_user;

--
-- TOC entry 421 (class 1255 OID 54595)
-- Name: set_updated_at(); Type: FUNCTION; Schema: forms; Owner: n8n_user
--

CREATE FUNCTION forms.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION forms.set_updated_at() OWNER TO n8n_user;

--
-- TOC entry 403 (class 1255 OID 54596)
-- Name: set_updated_at(); Type: FUNCTION; Schema: operacao; Owner: n8n_user
--

CREATE FUNCTION operacao.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION operacao.set_updated_at() OWNER TO n8n_user;

--
-- TOC entry 393 (class 1255 OID 54597)
-- Name: sync_houve_anormalidade(); Type: FUNCTION; Schema: operacao; Owner: n8n_user
--

CREATE FUNCTION operacao.sync_houve_anormalidade() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_entrada_id_new bigint;
  v_entrada_id_old bigint;
BEGIN
  -- Pega os IDs de entrada envolvidos na operação
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_entrada_id_new := NEW.entrada_id;
  END IF;

  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    v_entrada_id_old := OLD.entrada_id;
  END IF;

  -- 1) Sempre recalcula a situação da NOVA entrada (quando houver)
  IF v_entrada_id_new IS NOT NULL THEN
    UPDATE operacao.registro_operacao_operador e
       SET houve_anormalidade = EXISTS (
             SELECT 1
               FROM operacao.registro_anormalidade a
              WHERE a.entrada_id = v_entrada_id_new
           )
     WHERE e.id = v_entrada_id_new;
  END IF;

  -- 2) Em UPDATE, se a entrada mudou, recalcula também a ANTIGA
  IF TG_OP = 'UPDATE'
     AND v_entrada_id_old IS NOT NULL
     AND v_entrada_id_old <> v_entrada_id_new THEN
    UPDATE operacao.registro_operacao_operador e
       SET houve_anormalidade = EXISTS (
             SELECT 1
               FROM operacao.registro_anormalidade a
              WHERE a.entrada_id = v_entrada_id_old
           )
     WHERE e.id = v_entrada_id_old;
  END IF;

  -- 3) Em DELETE puro (sem UPDATE), recalcula a entrada antiga
  IF TG_OP = 'DELETE'
     AND v_entrada_id_old IS NOT NULL THEN
    UPDATE operacao.registro_operacao_operador e
       SET houve_anormalidade = EXISTS (
             SELECT 1
               FROM operacao.registro_anormalidade a
              WHERE a.entrada_id = v_entrada_id_old
           )
     WHERE e.id = v_entrada_id_old;
  END IF;

  -- AFTER trigger: não precisamos devolver linha
  RETURN NULL;
END;
$$;


ALTER FUNCTION operacao.sync_houve_anormalidade() OWNER TO n8n_user;

--
-- TOC entry 385 (class 1255 OID 54598)
-- Name: set_updated_at(); Type: FUNCTION; Schema: pessoa; Owner: n8n_user
--

CREATE FUNCTION pessoa.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION pessoa.set_updated_at() OWNER TO n8n_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 54599)
-- Name: comissao; Type: TABLE; Schema: cadastro; Owner: n8n_user
--

CREATE TABLE cadastro.comissao (
    id bigint NOT NULL,
    nome text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ordem smallint,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    criado_por uuid,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_por uuid
);


ALTER TABLE cadastro.comissao OWNER TO n8n_user;

--
-- TOC entry 223 (class 1259 OID 54607)
-- Name: comissao_id_seq; Type: SEQUENCE; Schema: cadastro; Owner: n8n_user
--

CREATE SEQUENCE cadastro.comissao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE cadastro.comissao_id_seq OWNER TO n8n_user;

--
-- TOC entry 3985 (class 0 OID 0)
-- Dependencies: 223
-- Name: comissao_id_seq; Type: SEQUENCE OWNED BY; Schema: cadastro; Owner: n8n_user
--

ALTER SEQUENCE cadastro.comissao_id_seq OWNED BY cadastro.comissao.id;


--
-- TOC entry 224 (class 1259 OID 54608)
-- Name: sala; Type: TABLE; Schema: cadastro; Owner: n8n_user
--

CREATE TABLE cadastro.sala (
    id smallint NOT NULL,
    nome text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    ordem smallint
);


ALTER TABLE cadastro.sala OWNER TO n8n_user;

--
-- TOC entry 3986 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE sala; Type: COMMENT; Schema: cadastro; Owner: n8n_user
--

COMMENT ON TABLE cadastro.sala IS 'Cadastro de salas/localizações fixas usadas nos formulários e registros.';


--
-- TOC entry 3987 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN sala.nome; Type: COMMENT; Schema: cadastro; Owner: n8n_user
--

COMMENT ON COLUMN cadastro.sala.nome IS 'Nome visível da sala (único).';


--
-- TOC entry 3988 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN sala.ativo; Type: COMMENT; Schema: cadastro; Owner: n8n_user
--

COMMENT ON COLUMN cadastro.sala.ativo IS 'Controle lógico de disponibilidade.';


--
-- TOC entry 225 (class 1259 OID 54616)
-- Name: sala_id_seq; Type: SEQUENCE; Schema: cadastro; Owner: n8n_user
--

CREATE SEQUENCE cadastro.sala_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE cadastro.sala_id_seq OWNER TO n8n_user;

--
-- TOC entry 3990 (class 0 OID 0)
-- Dependencies: 225
-- Name: sala_id_seq; Type: SEQUENCE OWNED BY; Schema: cadastro; Owner: n8n_user
--

ALTER SEQUENCE cadastro.sala_id_seq OWNED BY cadastro.sala.id;


--
-- TOC entry 226 (class 1259 OID 54617)
-- Name: checklist; Type: TABLE; Schema: forms; Owner: n8n_user
--

CREATE TABLE forms.checklist (
    id bigint NOT NULL,
    data_operacao date NOT NULL,
    sala_id smallint NOT NULL,
    turno text NOT NULL,
    hora_inicio_testes time without time zone NOT NULL,
    hora_termino_testes time without time zone NOT NULL,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    usb_01 text,
    usb_02 text,
    criado_por uuid,
    atualizado_por uuid,
    CONSTRAINT ck_checklist_turno CHECK ((turno = ANY (ARRAY['Matutino'::text, 'Vespertino'::text])))
);


ALTER TABLE forms.checklist OWNER TO n8n_user;

--
-- TOC entry 3991 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE checklist; Type: COMMENT; Schema: forms; Owner: n8n_user
--

COMMENT ON TABLE forms.checklist IS 'Cabeçalho do checklist (uma execução por operação/turno/local).';


--
-- TOC entry 3992 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN checklist.sala_id; Type: COMMENT; Schema: forms; Owner: n8n_user
--

COMMENT ON COLUMN forms.checklist.sala_id IS 'FK para cadastro.sala.';


--
-- TOC entry 3993 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN checklist.turno; Type: COMMENT; Schema: forms; Owner: n8n_user
--

COMMENT ON COLUMN forms.checklist.turno IS 'Matutino ou Vespertino (CHECK).';


--
-- TOC entry 227 (class 1259 OID 54625)
-- Name: checklist_id_seq; Type: SEQUENCE; Schema: forms; Owner: n8n_user
--

CREATE SEQUENCE forms.checklist_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE forms.checklist_id_seq OWNER TO n8n_user;

--
-- TOC entry 3995 (class 0 OID 0)
-- Dependencies: 227
-- Name: checklist_id_seq; Type: SEQUENCE OWNED BY; Schema: forms; Owner: n8n_user
--

ALTER SEQUENCE forms.checklist_id_seq OWNED BY forms.checklist.id;


--
-- TOC entry 228 (class 1259 OID 54626)
-- Name: checklist_item_tipo; Type: TABLE; Schema: forms; Owner: n8n_user
--

CREATE TABLE forms.checklist_item_tipo (
    id smallint NOT NULL,
    nome text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ordem smallint DEFAULT 1 NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    tipo_widget text DEFAULT 'radio'::text NOT NULL,
    CONSTRAINT checklist_item_tipo_tipo_widget_check CHECK ((tipo_widget = ANY (ARRAY['radio'::text, 'text'::text])))
);


ALTER TABLE forms.checklist_item_tipo OWNER TO n8n_user;

--
-- TOC entry 229 (class 1259 OID 54635)
-- Name: checklist_item_tipo_id_seq; Type: SEQUENCE; Schema: forms; Owner: n8n_user
--

CREATE SEQUENCE forms.checklist_item_tipo_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE forms.checklist_item_tipo_id_seq OWNER TO n8n_user;

--
-- TOC entry 3997 (class 0 OID 0)
-- Dependencies: 229
-- Name: checklist_item_tipo_id_seq; Type: SEQUENCE OWNED BY; Schema: forms; Owner: n8n_user
--

ALTER SEQUENCE forms.checklist_item_tipo_id_seq OWNED BY forms.checklist_item_tipo.id;


--
-- TOC entry 230 (class 1259 OID 54636)
-- Name: checklist_resposta; Type: TABLE; Schema: forms; Owner: n8n_user
--

CREATE TABLE forms.checklist_resposta (
    id bigint NOT NULL,
    checklist_id bigint NOT NULL,
    item_tipo_id smallint NOT NULL,
    status text NOT NULL,
    descricao_falha text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    criado_por uuid,
    atualizado_por uuid,
    valor_texto text,
    CONSTRAINT ck_cli_resp_desc_quando_falha CHECK (((status <> 'Falha'::text) OR (descricao_falha IS NOT NULL))),
    CONSTRAINT ck_cli_resp_status CHECK ((status = ANY (ARRAY['Ok'::text, 'Falha'::text])))
);


ALTER TABLE forms.checklist_resposta OWNER TO n8n_user;

--
-- TOC entry 231 (class 1259 OID 54645)
-- Name: checklist_resposta_id_seq; Type: SEQUENCE; Schema: forms; Owner: n8n_user
--

CREATE SEQUENCE forms.checklist_resposta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE forms.checklist_resposta_id_seq OWNER TO n8n_user;

--
-- TOC entry 3999 (class 0 OID 0)
-- Dependencies: 231
-- Name: checklist_resposta_id_seq; Type: SEQUENCE OWNED BY; Schema: forms; Owner: n8n_user
--

ALTER SEQUENCE forms.checklist_resposta_id_seq OWNED BY forms.checklist_resposta.id;


--
-- TOC entry 322 (class 1259 OID 56793)
-- Name: checklist_sala_config; Type: TABLE; Schema: forms; Owner: n8n_user
--

CREATE TABLE forms.checklist_sala_config (
    id integer NOT NULL,
    sala_id smallint NOT NULL,
    item_tipo_id smallint NOT NULL,
    ordem smallint DEFAULT 1 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    obrigatorio boolean DEFAULT true NOT NULL
);


ALTER TABLE forms.checklist_sala_config OWNER TO n8n_user;

--
-- TOC entry 321 (class 1259 OID 56792)
-- Name: checklist_sala_config_id_seq; Type: SEQUENCE; Schema: forms; Owner: n8n_user
--

CREATE SEQUENCE forms.checklist_sala_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE forms.checklist_sala_config_id_seq OWNER TO n8n_user;

--
-- TOC entry 4000 (class 0 OID 0)
-- Dependencies: 321
-- Name: checklist_sala_config_id_seq; Type: SEQUENCE OWNED BY; Schema: forms; Owner: n8n_user
--

ALTER SEQUENCE forms.checklist_sala_config_id_seq OWNED BY forms.checklist_sala_config.id;


--
-- TOC entry 232 (class 1259 OID 54646)
-- Name: registro_anormalidade; Type: TABLE; Schema: operacao; Owner: n8n_user
--

CREATE TABLE operacao.registro_anormalidade (
    id bigint NOT NULL,
    registro_id bigint NOT NULL,
    data date NOT NULL,
    sala_id smallint NOT NULL,
    nome_evento text NOT NULL,
    hora_inicio_anormalidade time without time zone NOT NULL,
    descricao_anormalidade text NOT NULL,
    houve_prejuizo boolean NOT NULL,
    descricao_prejuizo text,
    houve_reclamacao boolean NOT NULL,
    autores_conteudo_reclamacao text,
    acionou_manutencao boolean NOT NULL,
    hora_acionamento_manutencao time without time zone,
    resolvida_pelo_operador boolean NOT NULL,
    procedimentos_adotados text,
    data_solucao date,
    hora_solucao time without time zone,
    responsavel_evento text NOT NULL,
    criado_por uuid NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_por uuid,
    entrada_id bigint,
    CONSTRAINT ck_datas_coerentes CHECK (((data_solucao IS NULL) OR ((data_solucao > data) OR ((data_solucao = data) AND ((hora_solucao IS NULL) OR (hora_solucao >= hora_inicio_anormalidade)))))),
    CONSTRAINT ck_manutencao_hora CHECK (((NOT acionou_manutencao) OR (hora_acionamento_manutencao IS NOT NULL))),
    CONSTRAINT ck_prejuizo_desc CHECK (((NOT houve_prejuizo) OR (descricao_prejuizo IS NOT NULL))),
    CONSTRAINT ck_reclamacao_desc CHECK (((NOT houve_reclamacao) OR (autores_conteudo_reclamacao IS NOT NULL)))
);


ALTER TABLE operacao.registro_anormalidade OWNER TO n8n_user;

--
-- TOC entry 4001 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE registro_anormalidade; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON TABLE operacao.registro_anormalidade IS 'Registros de anormalidades ocorridas durante a operação de áudio.';


--
-- TOC entry 4002 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN registro_anormalidade.nome_evento; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade.nome_evento IS 'Cópia do nome do evento do registro pai para manter o histórico.';


--
-- TOC entry 4003 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN registro_anormalidade.responsavel_evento; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade.responsavel_evento IS 'Nome do responsável da comissão/mesa/evento informado no momento do registro.';


--
-- TOC entry 233 (class 1259 OID 54657)
-- Name: registro_anormalidade_admin; Type: TABLE; Schema: operacao; Owner: n8n_user
--

CREATE TABLE operacao.registro_anormalidade_admin (
    registro_anormalidade_id bigint NOT NULL,
    observacao_supervisor text,
    observacao_chefe text,
    criado_por uuid,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_por uuid,
    atualizado_em timestamp with time zone
);


ALTER TABLE operacao.registro_anormalidade_admin OWNER TO n8n_user;

--
-- TOC entry 4005 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE registro_anormalidade_admin; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON TABLE operacao.registro_anormalidade_admin IS 'Observações de supervisor e chefe de serviço para os registros de anormalidade.';


--
-- TOC entry 4006 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN registro_anormalidade_admin.registro_anormalidade_id; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade_admin.registro_anormalidade_id IS 'FK para operacao.registro_anormalidade.id (1:1 com o registro de anormalidade).';


--
-- TOC entry 4007 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN registro_anormalidade_admin.observacao_supervisor; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade_admin.observacao_supervisor IS 'Observações lançadas pelo supervisor autorizado.';


--
-- TOC entry 4008 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN registro_anormalidade_admin.observacao_chefe; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade_admin.observacao_chefe IS 'Observações lançadas pelo chefe de serviço (evandrop).';


--
-- TOC entry 4009 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN registro_anormalidade_admin.criado_por; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade_admin.criado_por IS 'ID do administrador (pessoa.administrador.id) que criou o registro de observação.';


--
-- TOC entry 4010 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN registro_anormalidade_admin.criado_em; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade_admin.criado_em IS 'Data/hora (timezone-aware) em que o registro de observação foi criado.';


--
-- TOC entry 4011 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN registro_anormalidade_admin.atualizado_por; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade_admin.atualizado_por IS 'ID do administrador (pessoa.administrador.id) que lançou a segunda observação (atualização).';


--
-- TOC entry 4012 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN registro_anormalidade_admin.atualizado_em; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_anormalidade_admin.atualizado_em IS 'Data/hora em que a segunda observação foi registrada.';


--
-- TOC entry 234 (class 1259 OID 54663)
-- Name: registro_anormalidade_id_seq; Type: SEQUENCE; Schema: operacao; Owner: n8n_user
--

CREATE SEQUENCE operacao.registro_anormalidade_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE operacao.registro_anormalidade_id_seq OWNER TO n8n_user;

--
-- TOC entry 4014 (class 0 OID 0)
-- Dependencies: 234
-- Name: registro_anormalidade_id_seq; Type: SEQUENCE OWNED BY; Schema: operacao; Owner: n8n_user
--

ALTER SEQUENCE operacao.registro_anormalidade_id_seq OWNED BY operacao.registro_anormalidade.id;


--
-- TOC entry 235 (class 1259 OID 54664)
-- Name: registro_operacao_audio; Type: TABLE; Schema: operacao; Owner: n8n_user
--

CREATE TABLE operacao.registro_operacao_audio (
    id bigint NOT NULL,
    data date NOT NULL,
    sala_id smallint NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    criado_por uuid,
    em_aberto boolean DEFAULT true NOT NULL,
    fechado_em timestamp with time zone,
    fechado_por uuid,
    checklist_do_dia_id bigint,
    checklist_do_dia_ok boolean
);


ALTER TABLE operacao.registro_operacao_audio OWNER TO n8n_user;

--
-- TOC entry 4015 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE registro_operacao_audio; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON TABLE operacao.registro_operacao_audio IS 'Registro de Operação de Áudio por sessão/evento.';


--
-- TOC entry 4016 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN registro_operacao_audio.sala_id; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_operacao_audio.sala_id IS 'FK para cadastro.sala.';


--
-- TOC entry 236 (class 1259 OID 54669)
-- Name: registro_operacao_audio_id_seq; Type: SEQUENCE; Schema: operacao; Owner: n8n_user
--

CREATE SEQUENCE operacao.registro_operacao_audio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE operacao.registro_operacao_audio_id_seq OWNER TO n8n_user;

--
-- TOC entry 4018 (class 0 OID 0)
-- Dependencies: 236
-- Name: registro_operacao_audio_id_seq; Type: SEQUENCE OWNED BY; Schema: operacao; Owner: n8n_user
--

ALTER SEQUENCE operacao.registro_operacao_audio_id_seq OWNED BY operacao.registro_operacao_audio.id;


--
-- TOC entry 237 (class 1259 OID 54670)
-- Name: registro_operacao_operador; Type: TABLE; Schema: operacao; Owner: n8n_user
--

CREATE TABLE operacao.registro_operacao_operador (
    id bigint NOT NULL,
    registro_id bigint NOT NULL,
    operador_id uuid NOT NULL,
    ordem smallint NOT NULL,
    hora_entrada time without time zone,
    hora_saida time without time zone,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    criado_por uuid,
    atualizado_por uuid,
    seq smallint DEFAULT 1 NOT NULL,
    usb_01 text,
    usb_02 text,
    observacoes text,
    houve_anormalidade boolean,
    nome_evento text,
    horario_pauta time without time zone,
    horario_inicio time without time zone,
    horario_termino time without time zone,
    tipo_evento text DEFAULT 'operacao'::text NOT NULL,
    comissao_id bigint,
    responsavel_evento text,
    CONSTRAINT ck_horas_coerentes CHECK (((hora_saida IS NULL) OR (hora_saida > hora_entrada))),
    CONSTRAINT ck_regopop_ordem_pos CHECK ((ordem >= 1)),
    CONSTRAINT ck_regopop_seq_1_2 CHECK ((seq = ANY (ARRAY[1, 2]))),
    CONSTRAINT ck_regopop_tipo_evento CHECK ((tipo_evento = ANY (ARRAY['operacao'::text, 'cessao'::text, 'outros'::text])))
);


ALTER TABLE operacao.registro_operacao_operador OWNER TO n8n_user;

--
-- TOC entry 4019 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE registro_operacao_operador; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON TABLE operacao.registro_operacao_operador IS 'Escala de operadores por registro de operação de áudio.';


--
-- TOC entry 4020 (class 0 OID 0)
-- Dependencies: 237
-- Name: COLUMN registro_operacao_operador.ordem; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_operacao_operador.ordem IS 'Ordem de atuação (1, 2, 3...).';


--
-- TOC entry 4021 (class 0 OID 0)
-- Dependencies: 237
-- Name: COLUMN registro_operacao_operador.hora_saida; Type: COMMENT; Schema: operacao; Owner: n8n_user
--

COMMENT ON COLUMN operacao.registro_operacao_operador.hora_saida IS 'Fim do turno; pode ser NULL no último operador.';


--
-- TOC entry 238 (class 1259 OID 54683)
-- Name: registro_operacao_operador_id_seq; Type: SEQUENCE; Schema: operacao; Owner: n8n_user
--

CREATE SEQUENCE operacao.registro_operacao_operador_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE operacao.registro_operacao_operador_id_seq OWNER TO n8n_user;

--
-- TOC entry 4023 (class 0 OID 0)
-- Dependencies: 238
-- Name: registro_operacao_operador_id_seq; Type: SEQUENCE OWNED BY; Schema: operacao; Owner: n8n_user
--

ALTER SEQUENCE operacao.registro_operacao_operador_id_seq OWNED BY operacao.registro_operacao_operador.id;


--
-- TOC entry 239 (class 1259 OID 54684)
-- Name: administrador; Type: TABLE; Schema: pessoa; Owner: n8n_user
--

CREATE TABLE pessoa.administrador (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome_completo text NOT NULL,
    email pessoa.citext NOT NULL,
    username pessoa.citext NOT NULL,
    password_hash text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pessoa.administrador OWNER TO n8n_user;

--
-- TOC entry 4024 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE administrador; Type: COMMENT; Schema: pessoa; Owner: n8n_user
--

COMMENT ON TABLE pessoa.administrador IS 'Contas administrativas com acesso diferenciado.';


--
-- TOC entry 4025 (class 0 OID 0)
-- Dependencies: 239
-- Name: COLUMN administrador.password_hash; Type: COMMENT; Schema: pessoa; Owner: n8n_user
--

COMMENT ON COLUMN pessoa.administrador.password_hash IS 'Senha armazenada como hash (bcrypt via crypt()).';


--
-- TOC entry 240 (class 1259 OID 54692)
-- Name: administrador_s; Type: TABLE; Schema: pessoa; Owner: n8n_user
--

CREATE TABLE pessoa.administrador_s (
    id bigint NOT NULL,
    nome_completo text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    senha text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pessoa.administrador_s OWNER TO n8n_user;

--
-- TOC entry 241 (class 1259 OID 54700)
-- Name: administrador_s_id_seq; Type: SEQUENCE; Schema: pessoa; Owner: n8n_user
--

CREATE SEQUENCE pessoa.administrador_s_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pessoa.administrador_s_id_seq OWNER TO n8n_user;

--
-- TOC entry 4028 (class 0 OID 0)
-- Dependencies: 241
-- Name: administrador_s_id_seq; Type: SEQUENCE OWNED BY; Schema: pessoa; Owner: n8n_user
--

ALTER SEQUENCE pessoa.administrador_s_id_seq OWNED BY pessoa.administrador_s.id;


--
-- TOC entry 242 (class 1259 OID 54701)
-- Name: auth_sessions; Type: TABLE; Schema: pessoa; Owner: n8n_user
--

CREATE TABLE pessoa.auth_sessions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_activity timestamp with time zone DEFAULT now() NOT NULL,
    revoked boolean DEFAULT false NOT NULL
);


ALTER TABLE pessoa.auth_sessions OWNER TO n8n_user;

--
-- TOC entry 243 (class 1259 OID 54709)
-- Name: auth_sessions_id_seq; Type: SEQUENCE; Schema: pessoa; Owner: n8n_user
--

CREATE SEQUENCE pessoa.auth_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pessoa.auth_sessions_id_seq OWNER TO n8n_user;

--
-- TOC entry 4030 (class 0 OID 0)
-- Dependencies: 243
-- Name: auth_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: pessoa; Owner: n8n_user
--

ALTER SEQUENCE pessoa.auth_sessions_id_seq OWNED BY pessoa.auth_sessions.id;


--
-- TOC entry 244 (class 1259 OID 54710)
-- Name: operador; Type: TABLE; Schema: pessoa; Owner: n8n_user
--

CREATE TABLE pessoa.operador (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome_completo text NOT NULL,
    email pessoa.citext NOT NULL,
    username pessoa.citext NOT NULL,
    foto_url text,
    password_hash text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    nome_exibicao text NOT NULL,
    CONSTRAINT operador_nome_exibicao_not_blank CHECK ((length(btrim(nome_exibicao)) > 0))
);


ALTER TABLE pessoa.operador OWNER TO n8n_user;

--
-- TOC entry 245 (class 1259 OID 54719)
-- Name: operador_s; Type: TABLE; Schema: pessoa; Owner: n8n_user
--

CREATE TABLE pessoa.operador_s (
    id bigint NOT NULL,
    nome_completo text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    senha text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pessoa.operador_s OWNER TO n8n_user;

--
-- TOC entry 246 (class 1259 OID 54727)
-- Name: operador_s_id_seq; Type: SEQUENCE; Schema: pessoa; Owner: n8n_user
--

CREATE SEQUENCE pessoa.operador_s_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE pessoa.operador_s_id_seq OWNER TO n8n_user;

--
-- TOC entry 4033 (class 0 OID 0)
-- Dependencies: 246
-- Name: operador_s_id_seq; Type: SEQUENCE OWNED BY; Schema: pessoa; Owner: n8n_user
--

ALTER SEQUENCE pessoa.operador_s_id_seq OWNED BY pessoa.operador_s.id;


--
-- TOC entry 3655 (class 2604 OID 55000)
-- Name: comissao id; Type: DEFAULT; Schema: cadastro; Owner: n8n_user
--

ALTER TABLE ONLY cadastro.comissao ALTER COLUMN id SET DEFAULT nextval('cadastro.comissao_id_seq'::regclass);


--
-- TOC entry 3659 (class 2604 OID 55001)
-- Name: sala id; Type: DEFAULT; Schema: cadastro; Owner: n8n_user
--

ALTER TABLE ONLY cadastro.sala ALTER COLUMN id SET DEFAULT nextval('cadastro.sala_id_seq'::regclass);


--
-- TOC entry 3663 (class 2604 OID 55002)
-- Name: checklist id; Type: DEFAULT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist ALTER COLUMN id SET DEFAULT nextval('forms.checklist_id_seq'::regclass);


--
-- TOC entry 3666 (class 2604 OID 55003)
-- Name: checklist_item_tipo id; Type: DEFAULT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_item_tipo ALTER COLUMN id SET DEFAULT nextval('forms.checklist_item_tipo_id_seq'::regclass);


--
-- TOC entry 3672 (class 2604 OID 55004)
-- Name: checklist_resposta id; Type: DEFAULT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_resposta ALTER COLUMN id SET DEFAULT nextval('forms.checklist_resposta_id_seq'::regclass);


--
-- TOC entry 3705 (class 2604 OID 56796)
-- Name: checklist_sala_config id; Type: DEFAULT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_sala_config ALTER COLUMN id SET DEFAULT nextval('forms.checklist_sala_config_id_seq'::regclass);


--
-- TOC entry 3675 (class 2604 OID 55005)
-- Name: registro_anormalidade id; Type: DEFAULT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade ALTER COLUMN id SET DEFAULT nextval('operacao.registro_anormalidade_id_seq'::regclass);


--
-- TOC entry 3679 (class 2604 OID 55006)
-- Name: registro_operacao_audio id; Type: DEFAULT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_audio ALTER COLUMN id SET DEFAULT nextval('operacao.registro_operacao_audio_id_seq'::regclass);


--
-- TOC entry 3682 (class 2604 OID 55007)
-- Name: registro_operacao_operador id; Type: DEFAULT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador ALTER COLUMN id SET DEFAULT nextval('operacao.registro_operacao_operador_id_seq'::regclass);


--
-- TOC entry 3690 (class 2604 OID 55008)
-- Name: administrador_s id; Type: DEFAULT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.administrador_s ALTER COLUMN id SET DEFAULT nextval('pessoa.administrador_s_id_seq'::regclass);


--
-- TOC entry 3694 (class 2604 OID 55009)
-- Name: auth_sessions id; Type: DEFAULT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.auth_sessions ALTER COLUMN id SET DEFAULT nextval('pessoa.auth_sessions_id_seq'::regclass);


--
-- TOC entry 3701 (class 2604 OID 55010)
-- Name: operador_s id; Type: DEFAULT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.operador_s ALTER COLUMN id SET DEFAULT nextval('pessoa.operador_s_id_seq'::regclass);


--
-- TOC entry 3723 (class 2606 OID 55029)
-- Name: comissao comissao_pkey; Type: CONSTRAINT; Schema: cadastro; Owner: n8n_user
--

ALTER TABLE ONLY cadastro.comissao
    ADD CONSTRAINT comissao_pkey PRIMARY KEY (id);


--
-- TOC entry 3725 (class 2606 OID 55031)
-- Name: sala sala_nome_key; Type: CONSTRAINT; Schema: cadastro; Owner: n8n_user
--

ALTER TABLE ONLY cadastro.sala
    ADD CONSTRAINT sala_nome_key UNIQUE (nome);


--
-- TOC entry 3727 (class 2606 OID 55033)
-- Name: sala sala_pkey; Type: CONSTRAINT; Schema: cadastro; Owner: n8n_user
--

ALTER TABLE ONLY cadastro.sala
    ADD CONSTRAINT sala_pkey PRIMARY KEY (id);


--
-- TOC entry 3734 (class 2606 OID 55035)
-- Name: checklist_item_tipo checklist_item_tipo_nome_key; Type: CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_item_tipo
    ADD CONSTRAINT checklist_item_tipo_nome_key UNIQUE (nome);


--
-- TOC entry 3736 (class 2606 OID 55037)
-- Name: checklist_item_tipo checklist_item_tipo_pkey; Type: CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_item_tipo
    ADD CONSTRAINT checklist_item_tipo_pkey PRIMARY KEY (id);


--
-- TOC entry 3729 (class 2606 OID 55039)
-- Name: checklist checklist_pkey; Type: CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist
    ADD CONSTRAINT checklist_pkey PRIMARY KEY (id);


--
-- TOC entry 3740 (class 2606 OID 55041)
-- Name: checklist_resposta checklist_resposta_pkey; Type: CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_resposta
    ADD CONSTRAINT checklist_resposta_pkey PRIMARY KEY (id);


--
-- TOC entry 3803 (class 2606 OID 56801)
-- Name: checklist_sala_config checklist_sala_config_pkey; Type: CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_sala_config
    ADD CONSTRAINT checklist_sala_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3805 (class 2606 OID 56803)
-- Name: checklist_sala_config checklist_sala_config_sala_id_item_tipo_id_key; Type: CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_sala_config
    ADD CONSTRAINT checklist_sala_config_sala_id_item_tipo_id_key UNIQUE (sala_id, item_tipo_id);


--
-- TOC entry 3745 (class 2606 OID 55043)
-- Name: checklist_resposta uq_cli_resp_checklist_item; Type: CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_resposta
    ADD CONSTRAINT uq_cli_resp_checklist_item UNIQUE (checklist_id, item_tipo_id);


--
-- TOC entry 3754 (class 2606 OID 55045)
-- Name: registro_anormalidade_admin registro_anormalidade_admin_pkey; Type: CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade_admin
    ADD CONSTRAINT registro_anormalidade_admin_pkey PRIMARY KEY (registro_anormalidade_id);


--
-- TOC entry 3751 (class 2606 OID 55047)
-- Name: registro_anormalidade registro_anormalidade_pkey; Type: CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade
    ADD CONSTRAINT registro_anormalidade_pkey PRIMARY KEY (id);


--
-- TOC entry 3759 (class 2606 OID 55049)
-- Name: registro_operacao_audio registro_operacao_audio_pkey; Type: CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_audio
    ADD CONSTRAINT registro_operacao_audio_pkey PRIMARY KEY (id);


--
-- TOC entry 3765 (class 2606 OID 55051)
-- Name: registro_operacao_operador registro_operacao_operador_pkey; Type: CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador
    ADD CONSTRAINT registro_operacao_operador_pkey PRIMARY KEY (id);


--
-- TOC entry 3767 (class 2606 OID 55053)
-- Name: registro_operacao_operador uq_regopop_registro_operador_seq; Type: CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador
    ADD CONSTRAINT uq_regopop_registro_operador_seq UNIQUE (registro_id, operador_id, seq);


--
-- TOC entry 3769 (class 2606 OID 55055)
-- Name: registro_operacao_operador uq_regopop_registro_ordem; Type: CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador
    ADD CONSTRAINT uq_regopop_registro_ordem UNIQUE (registro_id, ordem);


--
-- TOC entry 3771 (class 2606 OID 55057)
-- Name: administrador administrador_pkey; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.administrador
    ADD CONSTRAINT administrador_pkey PRIMARY KEY (id);


--
-- TOC entry 3777 (class 2606 OID 55059)
-- Name: administrador_s administrador_s_email_key; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.administrador_s
    ADD CONSTRAINT administrador_s_email_key UNIQUE (email);


--
-- TOC entry 3779 (class 2606 OID 55061)
-- Name: administrador_s administrador_s_pkey; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.administrador_s
    ADD CONSTRAINT administrador_s_pkey PRIMARY KEY (id);


--
-- TOC entry 3781 (class 2606 OID 55063)
-- Name: administrador_s administrador_s_username_key; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.administrador_s
    ADD CONSTRAINT administrador_s_username_key UNIQUE (username);


--
-- TOC entry 3784 (class 2606 OID 55065)
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3790 (class 2606 OID 55067)
-- Name: operador operador_pkey; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.operador
    ADD CONSTRAINT operador_pkey PRIMARY KEY (id);


--
-- TOC entry 3797 (class 2606 OID 55069)
-- Name: operador_s operador_s_email_key; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.operador_s
    ADD CONSTRAINT operador_s_email_key UNIQUE (email);


--
-- TOC entry 3799 (class 2606 OID 55071)
-- Name: operador_s operador_s_pkey; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.operador_s
    ADD CONSTRAINT operador_s_pkey PRIMARY KEY (id);


--
-- TOC entry 3801 (class 2606 OID 55073)
-- Name: operador_s operador_s_username_key; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.operador_s
    ADD CONSTRAINT operador_s_username_key UNIQUE (username);


--
-- TOC entry 3773 (class 2606 OID 55075)
-- Name: administrador uq_admin_email; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.administrador
    ADD CONSTRAINT uq_admin_email UNIQUE (email);


--
-- TOC entry 3775 (class 2606 OID 55077)
-- Name: administrador uq_admin_username; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.administrador
    ADD CONSTRAINT uq_admin_username UNIQUE (username);


--
-- TOC entry 3792 (class 2606 OID 55079)
-- Name: operador uq_operador_email; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.operador
    ADD CONSTRAINT uq_operador_email UNIQUE (email);


--
-- TOC entry 3794 (class 2606 OID 55081)
-- Name: operador uq_operador_username; Type: CONSTRAINT; Schema: pessoa; Owner: n8n_user
--

ALTER TABLE ONLY pessoa.operador
    ADD CONSTRAINT uq_operador_username UNIQUE (username);


--
-- TOC entry 3730 (class 1259 OID 55178)
-- Name: ix_checklist_data; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_checklist_data ON forms.checklist USING btree (data_operacao);


--
-- TOC entry 3731 (class 1259 OID 55179)
-- Name: ix_checklist_data_sala; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_checklist_data_sala ON forms.checklist USING btree (data_operacao, sala_id);


--
-- TOC entry 3732 (class 1259 OID 55180)
-- Name: ix_checklist_sala; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_checklist_sala ON forms.checklist USING btree (sala_id);


--
-- TOC entry 3741 (class 1259 OID 55181)
-- Name: ix_cli_resp_checklist; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_cli_resp_checklist ON forms.checklist_resposta USING btree (checklist_id);


--
-- TOC entry 3742 (class 1259 OID 55182)
-- Name: ix_cli_resp_item; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_cli_resp_item ON forms.checklist_resposta USING btree (item_tipo_id);


--
-- TOC entry 3743 (class 1259 OID 55183)
-- Name: ix_cli_resp_status; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_cli_resp_status ON forms.checklist_resposta USING btree (status);


--
-- TOC entry 3737 (class 1259 OID 55184)
-- Name: ix_cli_tipo_ativo; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_cli_tipo_ativo ON forms.checklist_item_tipo USING btree (ativo);


--
-- TOC entry 3738 (class 1259 OID 55185)
-- Name: ix_cli_tipo_ordem; Type: INDEX; Schema: forms; Owner: n8n_user
--

CREATE INDEX ix_cli_tipo_ordem ON forms.checklist_item_tipo USING btree (ordem);


--
-- TOC entry 3761 (class 1259 OID 55186)
-- Name: idx_registro_operacao_operador_comissao; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX idx_registro_operacao_operador_comissao ON operacao.registro_operacao_operador USING btree (comissao_id);


--
-- TOC entry 3746 (class 1259 OID 55187)
-- Name: ix_reganom_data; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_reganom_data ON operacao.registro_anormalidade USING btree (data);


--
-- TOC entry 3747 (class 1259 OID 55188)
-- Name: ix_reganom_operador; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_reganom_operador ON operacao.registro_anormalidade USING btree (criado_por);


--
-- TOC entry 3748 (class 1259 OID 55189)
-- Name: ix_reganom_registro; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_reganom_registro ON operacao.registro_anormalidade USING btree (registro_id);


--
-- TOC entry 3749 (class 1259 OID 55190)
-- Name: ix_reganom_sala; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_reganom_sala ON operacao.registro_anormalidade USING btree (sala_id);


--
-- TOC entry 3755 (class 1259 OID 55191)
-- Name: ix_regop_data; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_regop_data ON operacao.registro_operacao_audio USING btree (data);


--
-- TOC entry 3756 (class 1259 OID 55192)
-- Name: ix_regop_data_sala; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_regop_data_sala ON operacao.registro_operacao_audio USING btree (data, sala_id);


--
-- TOC entry 3757 (class 1259 OID 55193)
-- Name: ix_regop_sala; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_regop_sala ON operacao.registro_operacao_audio USING btree (sala_id);


--
-- TOC entry 3762 (class 1259 OID 55194)
-- Name: ix_regopop_operador; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_regopop_operador ON operacao.registro_operacao_operador USING btree (operador_id);


--
-- TOC entry 3763 (class 1259 OID 55195)
-- Name: ix_regopop_registro; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE INDEX ix_regopop_registro ON operacao.registro_operacao_operador USING btree (registro_id);


--
-- TOC entry 3752 (class 1259 OID 55196)
-- Name: uq_reganom_entrada_unica; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE UNIQUE INDEX uq_reganom_entrada_unica ON operacao.registro_anormalidade USING btree (entrada_id) WHERE (entrada_id IS NOT NULL);


--
-- TOC entry 3760 (class 1259 OID 55197)
-- Name: uq_regop_sala_aberta; Type: INDEX; Schema: operacao; Owner: n8n_user
--

CREATE UNIQUE INDEX uq_regop_sala_aberta ON operacao.registro_operacao_audio USING btree (sala_id) WHERE em_aberto;


--
-- TOC entry 3782 (class 1259 OID 55198)
-- Name: idx_administrador_s_username; Type: INDEX; Schema: pessoa; Owner: n8n_user
--

CREATE INDEX idx_administrador_s_username ON pessoa.administrador_s USING btree (username);


--
-- TOC entry 3785 (class 1259 OID 55199)
-- Name: idx_auth_sessions_user; Type: INDEX; Schema: pessoa; Owner: n8n_user
--

CREATE INDEX idx_auth_sessions_user ON pessoa.auth_sessions USING btree (user_id);


--
-- TOC entry 3795 (class 1259 OID 55200)
-- Name: idx_operador_s_username; Type: INDEX; Schema: pessoa; Owner: n8n_user
--

CREATE INDEX idx_operador_s_username ON pessoa.operador_s USING btree (username);


--
-- TOC entry 3787 (class 1259 OID 55201)
-- Name: ix_operador_email; Type: INDEX; Schema: pessoa; Owner: n8n_user
--

CREATE INDEX ix_operador_email ON pessoa.operador USING btree (email);


--
-- TOC entry 3788 (class 1259 OID 55202)
-- Name: ix_operador_username; Type: INDEX; Schema: pessoa; Owner: n8n_user
--

CREATE INDEX ix_operador_username ON pessoa.operador USING btree (username);


--
-- TOC entry 3786 (class 1259 OID 55203)
-- Name: uq_auth_sessions_rth; Type: INDEX; Schema: pessoa; Owner: n8n_user
--

CREATE UNIQUE INDEX uq_auth_sessions_rth ON pessoa.auth_sessions USING btree (refresh_token_hash);


--
-- TOC entry 3823 (class 2620 OID 55241)
-- Name: sala trg_sala_set_updated_at; Type: TRIGGER; Schema: cadastro; Owner: n8n_user
--

CREATE TRIGGER trg_sala_set_updated_at BEFORE UPDATE ON cadastro.sala FOR EACH ROW EXECUTE FUNCTION cadastro.set_updated_at();


--
-- TOC entry 3824 (class 2620 OID 55242)
-- Name: checklist trg_checklist_set_updated_at; Type: TRIGGER; Schema: forms; Owner: n8n_user
--

CREATE TRIGGER trg_checklist_set_updated_at BEFORE UPDATE ON forms.checklist FOR EACH ROW EXECUTE FUNCTION forms.set_updated_at();


--
-- TOC entry 3826 (class 2620 OID 55243)
-- Name: checklist_resposta trg_cli_resp_set_updated_at; Type: TRIGGER; Schema: forms; Owner: n8n_user
--

CREATE TRIGGER trg_cli_resp_set_updated_at BEFORE UPDATE ON forms.checklist_resposta FOR EACH ROW EXECUTE FUNCTION forms.set_updated_at();


--
-- TOC entry 3825 (class 2620 OID 55244)
-- Name: checklist_item_tipo trg_cli_tipo_set_updated_at; Type: TRIGGER; Schema: forms; Owner: n8n_user
--

CREATE TRIGGER trg_cli_tipo_set_updated_at BEFORE UPDATE ON forms.checklist_item_tipo FOR EACH ROW EXECUTE FUNCTION forms.set_updated_at();


--
-- TOC entry 3827 (class 2620 OID 55245)
-- Name: registro_anormalidade trg_reganom_set_updated_at; Type: TRIGGER; Schema: operacao; Owner: n8n_user
--

CREATE TRIGGER trg_reganom_set_updated_at BEFORE UPDATE ON operacao.registro_anormalidade FOR EACH ROW EXECUTE FUNCTION operacao.set_updated_at();


--
-- TOC entry 3829 (class 2620 OID 55246)
-- Name: registro_operacao_operador trg_regopop_set_updated_at; Type: TRIGGER; Schema: operacao; Owner: n8n_user
--

CREATE TRIGGER trg_regopop_set_updated_at BEFORE UPDATE ON operacao.registro_operacao_operador FOR EACH ROW EXECUTE FUNCTION operacao.set_updated_at();


--
-- TOC entry 3828 (class 2620 OID 55247)
-- Name: registro_anormalidade trg_sync_houve_anormalidade; Type: TRIGGER; Schema: operacao; Owner: n8n_user
--

CREATE TRIGGER trg_sync_houve_anormalidade AFTER INSERT OR DELETE OR UPDATE ON operacao.registro_anormalidade FOR EACH ROW EXECUTE FUNCTION operacao.sync_houve_anormalidade();


--
-- TOC entry 3830 (class 2620 OID 55248)
-- Name: administrador trg_admin_set_updated_at; Type: TRIGGER; Schema: pessoa; Owner: n8n_user
--

CREATE TRIGGER trg_admin_set_updated_at BEFORE UPDATE ON pessoa.administrador FOR EACH ROW EXECUTE FUNCTION pessoa.set_updated_at();


--
-- TOC entry 3831 (class 2620 OID 55249)
-- Name: operador trg_operador_set_updated_at; Type: TRIGGER; Schema: pessoa; Owner: n8n_user
--

CREATE TRIGGER trg_operador_set_updated_at BEFORE UPDATE ON pessoa.operador FOR EACH ROW EXECUTE FUNCTION pessoa.set_updated_at();


--
-- TOC entry 3807 (class 2606 OID 55250)
-- Name: checklist_resposta checklist_resposta_checklist_id_fkey; Type: FK CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_resposta
    ADD CONSTRAINT checklist_resposta_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES forms.checklist(id) ON DELETE CASCADE;


--
-- TOC entry 3808 (class 2606 OID 55255)
-- Name: checklist_resposta checklist_resposta_item_tipo_id_fkey; Type: FK CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_resposta
    ADD CONSTRAINT checklist_resposta_item_tipo_id_fkey FOREIGN KEY (item_tipo_id) REFERENCES forms.checklist_item_tipo(id);


--
-- TOC entry 3821 (class 2606 OID 56809)
-- Name: checklist_sala_config checklist_sala_config_item_tipo_id_fkey; Type: FK CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_sala_config
    ADD CONSTRAINT checklist_sala_config_item_tipo_id_fkey FOREIGN KEY (item_tipo_id) REFERENCES forms.checklist_item_tipo(id);


--
-- TOC entry 3822 (class 2606 OID 56804)
-- Name: checklist_sala_config checklist_sala_config_sala_id_fkey; Type: FK CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist_sala_config
    ADD CONSTRAINT checklist_sala_config_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES cadastro.sala(id);


--
-- TOC entry 3806 (class 2606 OID 55260)
-- Name: checklist checklist_sala_id_fkey; Type: FK CONSTRAINT; Schema: forms; Owner: n8n_user
--

ALTER TABLE ONLY forms.checklist
    ADD CONSTRAINT checklist_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES cadastro.sala(id);


--
-- TOC entry 3809 (class 2606 OID 55265)
-- Name: registro_anormalidade fk_reganom_entrada_operador; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade
    ADD CONSTRAINT fk_reganom_entrada_operador FOREIGN KEY (entrada_id) REFERENCES operacao.registro_operacao_operador(id) ON DELETE SET NULL;


--
-- TOC entry 3817 (class 2606 OID 55270)
-- Name: registro_operacao_operador fk_registro_operacao_operador_comissao; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador
    ADD CONSTRAINT fk_registro_operacao_operador_comissao FOREIGN KEY (comissao_id) REFERENCES cadastro.comissao(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3815 (class 2606 OID 55275)
-- Name: registro_operacao_audio fk_regop_checklist_do_dia; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_audio
    ADD CONSTRAINT fk_regop_checklist_do_dia FOREIGN KEY (checklist_do_dia_id) REFERENCES forms.checklist(id) ON DELETE SET NULL;


--
-- TOC entry 3812 (class 2606 OID 55280)
-- Name: registro_anormalidade_admin registro_anormalidade_admin_atualizado_por_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade_admin
    ADD CONSTRAINT registro_anormalidade_admin_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES pessoa.administrador(id);


--
-- TOC entry 3813 (class 2606 OID 55285)
-- Name: registro_anormalidade_admin registro_anormalidade_admin_criado_por_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade_admin
    ADD CONSTRAINT registro_anormalidade_admin_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES pessoa.administrador(id);


--
-- TOC entry 3814 (class 2606 OID 55290)
-- Name: registro_anormalidade_admin registro_anormalidade_admin_registro_anormalidade_id_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade_admin
    ADD CONSTRAINT registro_anormalidade_admin_registro_anormalidade_id_fkey FOREIGN KEY (registro_anormalidade_id) REFERENCES operacao.registro_anormalidade(id) ON DELETE CASCADE;


--
-- TOC entry 3810 (class 2606 OID 55295)
-- Name: registro_anormalidade registro_anormalidade_registro_id_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade
    ADD CONSTRAINT registro_anormalidade_registro_id_fkey FOREIGN KEY (registro_id) REFERENCES operacao.registro_operacao_audio(id) ON DELETE CASCADE;


--
-- TOC entry 3811 (class 2606 OID 55300)
-- Name: registro_anormalidade registro_anormalidade_sala_id_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_anormalidade
    ADD CONSTRAINT registro_anormalidade_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES cadastro.sala(id);


--
-- TOC entry 3816 (class 2606 OID 55305)
-- Name: registro_operacao_audio registro_operacao_audio_sala_id_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_audio
    ADD CONSTRAINT registro_operacao_audio_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES cadastro.sala(id);


--
-- TOC entry 3818 (class 2606 OID 55310)
-- Name: registro_operacao_operador registro_operacao_operador_comissao_id_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador
    ADD CONSTRAINT registro_operacao_operador_comissao_id_fkey FOREIGN KEY (comissao_id) REFERENCES cadastro.comissao(id);


--
-- TOC entry 3819 (class 2606 OID 55315)
-- Name: registro_operacao_operador registro_operacao_operador_operador_id_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador
    ADD CONSTRAINT registro_operacao_operador_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES pessoa.operador(id) ON DELETE RESTRICT;


--
-- TOC entry 3820 (class 2606 OID 55320)
-- Name: registro_operacao_operador registro_operacao_operador_registro_id_fkey; Type: FK CONSTRAINT; Schema: operacao; Owner: n8n_user
--

ALTER TABLE ONLY operacao.registro_operacao_operador
    ADD CONSTRAINT registro_operacao_operador_registro_id_fkey FOREIGN KEY (registro_id) REFERENCES operacao.registro_operacao_audio(id) ON DELETE CASCADE;


--
-- TOC entry 3980 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA cadastro; Type: ACL; Schema: -; Owner: n8n_user
--

GRANT USAGE ON SCHEMA cadastro TO metabase_read;


--
-- TOC entry 3981 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA forms; Type: ACL; Schema: -; Owner: n8n_user
--

GRANT USAGE ON SCHEMA forms TO metabase_read;


--
-- TOC entry 3982 (class 0 OID 0)
-- Dependencies: 11
-- Name: SCHEMA operacao; Type: ACL; Schema: -; Owner: n8n_user
--

GRANT USAGE ON SCHEMA operacao TO metabase_read;


--
-- TOC entry 3983 (class 0 OID 0)
-- Dependencies: 12
-- Name: SCHEMA pessoa; Type: ACL; Schema: -; Owner: n8n_user
--

GRANT USAGE ON SCHEMA pessoa TO metabase_read;


--
-- TOC entry 3984 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE comissao; Type: ACL; Schema: cadastro; Owner: n8n_user
--

GRANT SELECT ON TABLE cadastro.comissao TO metabase_read;


--
-- TOC entry 3989 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE sala; Type: ACL; Schema: cadastro; Owner: n8n_user
--

GRANT SELECT ON TABLE cadastro.sala TO metabase_read;


--
-- TOC entry 3994 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE checklist; Type: ACL; Schema: forms; Owner: n8n_user
--

GRANT SELECT ON TABLE forms.checklist TO metabase_read;


--
-- TOC entry 3996 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE checklist_item_tipo; Type: ACL; Schema: forms; Owner: n8n_user
--

GRANT SELECT ON TABLE forms.checklist_item_tipo TO metabase_read;


--
-- TOC entry 3998 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE checklist_resposta; Type: ACL; Schema: forms; Owner: n8n_user
--

GRANT SELECT ON TABLE forms.checklist_resposta TO metabase_read;


--
-- TOC entry 4004 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE registro_anormalidade; Type: ACL; Schema: operacao; Owner: n8n_user
--

GRANT SELECT ON TABLE operacao.registro_anormalidade TO metabase_read;


--
-- TOC entry 4013 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE registro_anormalidade_admin; Type: ACL; Schema: operacao; Owner: n8n_user
--

GRANT SELECT ON TABLE operacao.registro_anormalidade_admin TO metabase_read;


--
-- TOC entry 4017 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE registro_operacao_audio; Type: ACL; Schema: operacao; Owner: n8n_user
--

GRANT SELECT ON TABLE operacao.registro_operacao_audio TO metabase_read;


--
-- TOC entry 4022 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE registro_operacao_operador; Type: ACL; Schema: operacao; Owner: n8n_user
--

GRANT SELECT ON TABLE operacao.registro_operacao_operador TO metabase_read;


--
-- TOC entry 4026 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE administrador; Type: ACL; Schema: pessoa; Owner: n8n_user
--

GRANT SELECT ON TABLE pessoa.administrador TO metabase_read;


--
-- TOC entry 4027 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE administrador_s; Type: ACL; Schema: pessoa; Owner: n8n_user
--

GRANT SELECT ON TABLE pessoa.administrador_s TO metabase_read;


--
-- TOC entry 4029 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE auth_sessions; Type: ACL; Schema: pessoa; Owner: n8n_user
--

GRANT SELECT ON TABLE pessoa.auth_sessions TO metabase_read;


--
-- TOC entry 4031 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE operador; Type: ACL; Schema: pessoa; Owner: n8n_user
--

GRANT SELECT ON TABLE pessoa.operador TO metabase_read;


--
-- TOC entry 4032 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE operador_s; Type: ACL; Schema: pessoa; Owner: n8n_user
--

GRANT SELECT ON TABLE pessoa.operador_s TO metabase_read;


--
-- TOC entry 2429 (class 826 OID 55575)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: cadastro; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA cadastro GRANT SELECT ON TABLES TO metabase_read;


--
-- TOC entry 2430 (class 826 OID 55576)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: forms; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA forms GRANT SELECT ON TABLES TO metabase_read;


--
-- TOC entry 2431 (class 826 OID 55577)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: operacao; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA operacao GRANT SELECT ON TABLES TO metabase_read;


--
-- TOC entry 2432 (class 826 OID 55578)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pessoa; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA pessoa GRANT SELECT ON TABLES TO metabase_read;


-- Completed on 2026-02-06 11:39:11 -03

--
-- PostgreSQL database dump complete
--

\unrestrict Xbnrcw4NkhbfCKNBxQBGuKUmdkV0vBGZScXjnzS5339vfcXwDacR7G0Qa6rp2c5

