-- ============================================================================
-- SIPS Collaboration Center — additive schema only.
-- Does NOT touch any existing table (projects, schedule_tasks, budget_items,
-- schedule_change_requests, profiles, ncrs, vendors, etc). Safe to run once
-- in the Supabase SQL editor. Re-running is safe (IF NOT EXISTS everywhere).
-- ============================================================================

create table if not exists chat_conversations (
  id              bigint generated always as identity primary key,
  type            text not null check (type in ('dm','group','ai')),
  title           text,                          -- used for groups + shown in AI thread
  project_id      bigint references projects(id) on delete set null,
  member_ids      uuid[] not null default '{}',  -- profiles.id of every participant
  created_by      uuid,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_preview    text
);

create table if not exists chat_messages (
  id              bigint generated always as identity primary key,
  conversation_id bigint not null references chat_conversations(id) on delete cascade,
  sender_id       uuid,                 -- null when is_ai = true
  sender_name     text not null,
  sender_role     text,
  body            text not null,
  is_ai           boolean not null default false,
  ai_action       jsonb,                -- {type, status, target_table, target_id, payload}
  read_by         uuid[] not null default '{}',
  created_at      timestamptz not null default now()
);

create table if not exists ai_action_log (
  id              bigint generated always as identity primary key,
  conversation_id bigint references chat_conversations(id) on delete cascade,
  message_id      bigint references chat_messages(id) on delete set null,
  user_id         uuid not null,
  action_type     text not null,        -- task_status_update | schedule_shift_request | ...
  target_table    text,
  target_id       text,
  payload         jsonb,
  status          text not null default 'proposed'
                  check (status in ('proposed','confirmed','executed','rejected')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_chat_messages_conv on chat_messages(conversation_id, created_at);
create index if not exists idx_chat_conversations_members on chat_conversations using gin(member_ids);

-- ---------------------------------------------------------------------------
-- RLS: mirrors the trust model already used by the rest of SIPS (client
-- queries directly with the anon key; every authenticated user is trusted
-- the same way schedule.html / budget.html already are). Tighten later if
-- you introduce per-company data isolation.
-- ---------------------------------------------------------------------------
alter table chat_conversations enable row level security;
alter table chat_messages       enable row level security;
alter table ai_action_log       enable row level security;

drop policy if exists "auth users - conversations" on chat_conversations;
create policy "auth users - conversations" on chat_conversations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth users - messages" on chat_messages;
create policy "auth users - messages" on chat_messages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth users - ai_action_log" on ai_action_log;
create policy "auth users - ai_action_log" on ai_action_log
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
