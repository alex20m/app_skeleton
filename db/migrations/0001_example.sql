-- An example so the migration path is exercised from the first deploy rather
-- than the first time it matters. Delete it and write your own — but keep the
-- conventions it demonstrates:
--
--   * four digits, then lower_snake_case;
--   * the whole file is the up migration, with no up/down markers: rolling a
--     live schema back is a restore-from-branch decision, not a script;
--   * additive only. The migration runs while the *previous* deployment is
--     still serving, so old code meets this schema. Add nullable columns;
--     leave renames and drops to a later change.
--
-- The runner wraps this in one transaction, so it must not contain `begin`,
-- `commit`, or anything Postgres refuses to run inside one (`create index
-- concurrently`).

create table if not exists examples (
  id          bigint generated always as identity primary key,
  label       text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists examples_created_at_idx on examples (created_at desc);
