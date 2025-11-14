-- doc_schema.sql
\pset tuples_only on
\pset format unaligned

-- Lista de tabelas
WITH t AS (
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema')
  ORDER BY table_schema, table_name
)
SELECT
  '# '||table_schema||'.'||table_name||E'\n\n'||
  '## Colunas'||E'\n\n'||
  '|'||'nome' ||'|'||'tipo'||'|'||'nulo'||'|'||'default'||'|'||'descrição'||'|'||E'\n'||
  '|---|---|---|---|---|'||E'\n'||
  (
    SELECT string_agg(
      '|'||c.column_name||'|'||c.data_type||
      '|'||(CASE WHEN c.is_nullable='YES' THEN 'sim' ELSE 'não' END)||'|'||
      COALESCE(c.column_default,'')||'|'||
      COALESCE(d.description,'')||'|'
      , E'\n'
      ORDER BY c.ordinal_position
    )
    FROM information_schema.columns c
    LEFT JOIN pg_catalog.pg_class pc
      ON pc.relname = t.table_name
     AND pc.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname=t.table_schema)
    LEFT JOIN pg_catalog.pg_attribute pa
      ON pa.attrelid=pc.oid AND pa.attname=c.column_name
    LEFT JOIN pg_catalog.pg_description d
      ON d.objoid=pc.oid AND d.objsubid=pa.attnum
    WHERE c.table_schema=t.table_schema AND c.table_name=t.table_name
  )||E'\n\n'||
  '## Restrições (PK/FK/UQ/CHK)'||E'\n\n'||
  COALESCE((
    SELECT string_agg(
      '* '||tc.constraint_type||': '||tc.constraint_name, E'\n' ORDER BY tc.constraint_type, tc.constraint_name
    )
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema=t.table_schema AND tc.table_name=t.table_name
  ), '* (nenhuma)')||E'\n\n'||
  '## Chaves estrangeiras'||E'\n\n'||
  COALESCE((
    SELECT string_agg(
      '* '||tc.constraint_name||': ('||kcu.column_name||') → '||
      ccu.table_schema||'.'||ccu.table_name||'('||ccu.column_name||')', E'\n'
      ORDER BY tc.constraint_name
    )
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.table_schema
    WHERE tc.constraint_type='FOREIGN KEY'
      AND tc.table_schema=t.table_schema AND tc.table_name=t.table_name
  ), '* (nenhuma)')||E'\n\n'||
  '## Índices'||E'\n\n'||
  COALESCE((
    SELECT string_agg('* '||indexdef, E'\n' ORDER BY indexname)
    FROM pg_indexes
    WHERE schemaname=t.table_schema AND tablename=t.table_name
  ), '* (nenhum)')||E'\n\n'||
  '---' AS md
FROM t;