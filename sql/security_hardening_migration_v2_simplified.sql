-- ============================================================================
-- SIPS Security Hardening — SIMPLIFIED (2 requirements only)
-- 1. Inactive users (profiles.is_active = false) blocked at DB/RLS level.
-- 2. AI action execution authorized + atomic server-side.
--
-- NOT included (removed per request): projects.company_id, company
-- isolation, director/pm hardcoded module permissions, budget/schedule
-- role restrictions, project ownership scoping, project-delete RPC,
-- storage bucket changes. None of that is created by this file.
--
-- 100% additive: no DROP/TRUNCATE/DELETE/destructive UPDATE on data, no new
-- columns, no table recreation, no existing row touched. Only adds RLS
-- policies (rules, not data) and two new functions. Idempotent — safe to
-- re-run. Assumes no earlier draft of this migration was ever run; say so
-- if one was, and I'll add cleanup statements.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS (read-only, SECURITY DEFINER to avoid RLS recursion)
-- ----------------------------------------------------------------------------
create or replace function public.is_active_user() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and coalesce(is_active, true) = true
  );
$$;

-- Used ONLY so the one pre-existing user-management.html feature that lets
-- a director change another user's role/is_active keeps working at the DB
-- level (today it's a plain client update with no DB check at all). This
-- reads the existing `role` column already used everywhere in the app — it
-- is not a new permission system, just the current check moved server-side.
create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- REQUIREMENT 1 — BLOCK INACTIVE USERS AT THE DATABASE LEVEL
-- ----------------------------------------------------------------------------

-- ---- profiles ----
alter table profiles enable row level security;

drop policy if exists "profiles select" on profiles;
create policy "profiles select" on profiles for select
  using (
    id = auth.uid()          -- always see own row (so the UI can show "deactivated")
    or public.is_active_user()
  );

drop policy if exists "profiles update" on profiles;
create policy "profiles update" on profiles for update
  using (
    (id = auth.uid() and public.is_active_user())   -- self-edit, only while active
    or (public.is_active_user() and public.my_role() = 'director')  -- existing admin toggle
  )
  with check (
    (id = auth.uid() and public.is_active_user())
    or (public.is_active_user() and public.my_role() = 'director')
  );
-- No insert/delete policy: accounts are created via the invite-user Edge
-- Function (service role), unaffected by this.

-- ---- every other existing table: same rule, no role/company logic ----
-- "Active + authenticated" mirrors the app's original trust model, just now
-- enforced by the database instead of only by the frontend.
do $$
declare
  t text;
  tables text[] := array[
    'companies','projects','schedule_tasks','project_tasks','budget_items',
    'change_orders','drawings','ncrs','client_queries','payment_transactions',
    'payment_adjustments','schedule_change_requests','vendors',
    'vendor_deliveries','site_photos'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table %I enable row level security', t);
      execute format('drop policy if exists %L on %I', t || ' active users', t);
      execute format(
        'create policy %L on %I for all using (public.is_active_user()) with check (public.is_active_user())',
        t || ' active users', t);
    end if;
  end loop;
end $$;

-- ---- chat_conversations / chat_messages ----
-- Same simple rule here too. (Per-conversation membership restriction is
-- deliberately NOT added here — that would be an extra access-control layer
-- beyond requirement 1; the actual AI-action authorization is enforced
-- separately in execute_ai_action() below, per requirement 2.)
alter table chat_conversations enable row level security;
alter table chat_messages      enable row level security;

drop policy if exists "auth users - conversations" on chat_conversations;
drop policy if exists "conversations - members only" on chat_conversations;
drop policy if exists "chat_conversations active users" on chat_conversations;
create policy "chat_conversations active users" on chat_conversations for all
  using (public.is_active_user()) with check (public.is_active_user());

drop policy if exists "auth users - messages" on chat_messages;
drop policy if exists "messages - conversation members only" on chat_messages;
drop policy if exists "chat_messages active users" on chat_messages;
create policy "chat_messages active users" on chat_messages for all
  using (public.is_active_user()) with check (public.is_active_user());

-- ---- ai_action_log ----
alter table ai_action_log enable row level security;

drop policy if exists "auth users - ai_action_log" on ai_action_log;
drop policy if exists "ai_action_log select" on ai_action_log;
create policy "ai_action_log select" on ai_action_log for select
  using (public.is_active_user() and user_id = auth.uid());
-- No insert/update/delete policy: only written by execute_ai_action() below
-- (SECURITY DEFINER, bypasses RLS for its own writes) — this is what makes
-- AI-action logging tamper-proof and atomic (requirement 2).

-- ----------------------------------------------------------------------------
-- REQUIREMENT 2 — AUTHORIZED, ATOMIC AI ACTION EXECUTION
-- ----------------------------------------------------------------------------
-- Re-checks, server-side, everything the client already enforces in
-- collaboration.html's canDo() matrix — so a manipulated messageId/
-- target_id/project ID/task ID cannot get an action executed that the
-- user's existing permissions (role) don't already allow, and a
-- manipulated messageId from a conversation the user isn't part of cannot
-- be replayed either. Runs as one transaction: update + log write either
-- both happen or neither does.
create or replace function public.execute_ai_action(p_message_id bigint, p_confirmed boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg        chat_messages%rowtype;
  v_action     jsonb;
  v_type       text;
  v_target_id  text;
  v_payload    jsonb;
  v_conv       chat_conversations%rowtype;
  v_role       text;
  v_task       schedule_tasks%rowtype;
  v_scr_id     bigint;
begin
  if not public.is_active_user() then
    raise exception 'Account is not active.';
  end if;

  select * into v_msg from chat_messages where id = p_message_id;
  if not found or v_msg.ai_action is null then
    raise exception 'No pending AI action for this message.';
  end if;

  select * into v_conv from chat_conversations where id = v_msg.conversation_id;
  if not found or not (auth.uid() = any(v_conv.member_ids)) then
    raise exception 'Not authorized for this conversation.';
  end if;

  v_action := v_msg.ai_action;
  v_type   := v_action->>'type';
  v_role   := public.my_role();

  if not p_confirmed then
    update chat_messages set ai_action = v_action || jsonb_build_object('status','rejected')
      where id = p_message_id;
    return jsonb_build_object('status','rejected');
  end if;

  if v_type = 'task_status_update' then
    -- Mirrors AI_PERMISSIONS.task_status_update in collaboration.html
    if v_role not in ('director','pm','engineer') then
      raise exception 'permission_denied';
    end if;

    v_target_id := v_action->>'target_id';
    select * into v_task from schedule_tasks where id = v_target_id::bigint;
    if not found then
      raise exception 'Task not found.';
    end if;

    update schedule_tasks set status = 'completed' where id = v_target_id::bigint;

    insert into ai_action_log(conversation_id, message_id, user_id, action_type, target_table, target_id, payload, status)
      values (v_conv.id, p_message_id, auth.uid(), v_type, 'schedule_tasks', v_target_id, v_action->'payload', 'executed');

    update chat_messages set ai_action = v_action || jsonb_build_object('status','executed')
      where id = p_message_id;

    return jsonb_build_object('status','executed', 'type', v_type, 'payload', v_action->'payload');

  elsif v_type = 'schedule_shift_request' then
    -- Mirrors AI_PERMISSIONS.schedule_shift_request in collaboration.html
    if v_role not in ('director','pm','engineer') then
      raise exception 'permission_denied';
    end if;

    v_payload := v_action->'payload';
    select * into v_task from schedule_tasks where id = (v_payload->>'task_id')::bigint;
    if not found then
      raise exception 'Task not found.';
    end if;

    insert into schedule_change_requests(
        task_id, task_name, changed_by, original_start, original_end,
        proposed_start, proposed_end, days_shifted, reason,
        approval_status, impacted_task_ids, impacted_milestones)
      values (
        (v_payload->>'task_id')::bigint, v_payload->>'task_name',
        (select full_name from profiles where id = auth.uid()) || ' (via SIPS AI)',
        (v_payload->>'original_start')::date, (v_payload->>'original_end')::date,
        (v_payload->>'proposed_start')::date, (v_payload->>'proposed_end')::date,
        (v_payload->>'days_shifted')::int, 'Requested via Collaboration AI chat',
        'pending',
        coalesce((select array(select jsonb_array_elements_text(v_payload->'impacted_task_ids'))), '{}'),
        '{}')
      returning id into v_scr_id;

    update schedule_tasks set pending_request_id = v_scr_id where id = (v_payload->>'task_id')::bigint;

    insert into ai_action_log(conversation_id, message_id, user_id, action_type, target_table, target_id, payload, status)
      values (v_conv.id, p_message_id, auth.uid(), v_type, 'schedule_change_requests', v_scr_id::text, v_payload, 'executed');

    update chat_messages set ai_action = v_action || jsonb_build_object('status','executed')
      where id = p_message_id;

    return jsonb_build_object('status','executed', 'type', v_type, 'payload', v_payload);
  else
    raise exception 'Unknown action type: %', v_type;
  end if;
end;
$$;
