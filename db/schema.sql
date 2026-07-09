create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('student', 'teacher', 'adult')),
  selected_tool text check (selected_tool in ('codex', 'claude', 'antigravity')),
  selected_service_type text check (selected_service_type in ('web', 'mobile-web', 'software')),
  project_summary text,
  current_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_inputs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references user_sessions(id) on delete cascade,
  input_type text not null check (input_type in ('upload', 'idea')),
  original_filename text,
  extracted_text text,
  user_idea text,
  created_at timestamptz not null default now()
);

create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references user_sessions(id) on delete cascade,
  project_input_id uuid references project_inputs(id) on delete set null,
  summary text not null,
  target_users jsonb not null default '[]'::jsonb,
  main_features jsonb not null default '[]'::jsonb,
  recommended_tool text not null,
  recommended_service_type text not null,
  recommended_stack jsonb not null default '[]'::jsonb,
  difficulty text not null,
  roadmap jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists checklist_progress (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references user_sessions(id) on delete cascade,
  checklist_id text not null,
  status text not null check (status in ('pending', 'active', 'done', 'blocked')),
  note text,
  updated_at timestamptz not null default now(),
  unique (session_id, checklist_id)
);

create table if not exists error_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references user_sessions(id) on delete cascade,
  tool text,
  current_step text,
  error_message text not null,
  ai_summary text,
  ai_solution jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references user_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
