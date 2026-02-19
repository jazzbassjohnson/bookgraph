-- BookGraph: Initial Schema
-- Requires Supabase with auth.users table

-- Books table: user's personal library
create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  authors text[] not null default '{}',
  topics text[] not null default '{}',
  themes text[] not null default '{}',
  tags text[] not null default '{}',
  year integer,
  rating integer check (rating >= 1 and rating <= 5),
  date_read date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_user_id_idx on books(user_id);

-- Book analyses: Claude's AI analysis per book
create table book_analyses (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null unique references books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_topics text[] not null default '{}',
  ai_themes text[] not null default '{}',
  ai_tags text[] not null default '{}',
  ai_summary text,
  raw_response jsonb,
  model_used text,
  analyzed_at timestamptz not null default now()
);

create index book_analyses_book_id_idx on book_analyses(book_id);
create index book_analyses_user_id_idx on book_analyses(user_id);

-- Book connections: AI-identified relationships between books
create table book_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_a_id uuid not null references books(id) on delete cascade,
  book_b_id uuid not null references books(id) on delete cascade,
  connection_type text not null check (connection_type in ('thematic', 'stylistic', 'topical', 'influence', 'author')),
  strength real not null default 0.5 check (strength >= 0 and strength <= 1),
  explanation text,
  created_at timestamptz not null default now(),
  constraint book_connections_ordered check (book_a_id < book_b_id),
  constraint book_connections_unique unique (book_a_id, book_b_id, connection_type)
);

create index book_connections_user_id_idx on book_connections(user_id);
create index book_connections_book_a_idx on book_connections(book_a_id);
create index book_connections_book_b_idx on book_connections(book_b_id);

-- Book suggestions: Claude's recommendations
create table book_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  authors text[] not null default '{}',
  reason text,
  related_book_ids uuid[] not null default '{}',
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create index book_suggestions_user_id_idx on book_suggestions(user_id);

-- Row Level Security
alter table books enable row level security;
alter table book_analyses enable row level security;
alter table book_connections enable row level security;
alter table book_suggestions enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can view their own books"
  on books for select using (auth.uid() = user_id);
create policy "Users can insert their own books"
  on books for insert with check (auth.uid() = user_id);
create policy "Users can update their own books"
  on books for update using (auth.uid() = user_id);
create policy "Users can delete their own books"
  on books for delete using (auth.uid() = user_id);

create policy "Users can view their own analyses"
  on book_analyses for select using (auth.uid() = user_id);
create policy "Users can insert their own analyses"
  on book_analyses for insert with check (auth.uid() = user_id);
create policy "Users can update their own analyses"
  on book_analyses for update using (auth.uid() = user_id);
create policy "Users can delete their own analyses"
  on book_analyses for delete using (auth.uid() = user_id);

create policy "Users can view their own connections"
  on book_connections for select using (auth.uid() = user_id);
create policy "Users can insert their own connections"
  on book_connections for insert with check (auth.uid() = user_id);
create policy "Users can update their own connections"
  on book_connections for update using (auth.uid() = user_id);
create policy "Users can delete their own connections"
  on book_connections for delete using (auth.uid() = user_id);

create policy "Users can view their own suggestions"
  on book_suggestions for select using (auth.uid() = user_id);
create policy "Users can insert their own suggestions"
  on book_suggestions for insert with check (auth.uid() = user_id);
create policy "Users can update their own suggestions"
  on book_suggestions for update using (auth.uid() = user_id);
create policy "Users can delete their own suggestions"
  on book_suggestions for delete using (auth.uid() = user_id);

-- Auto-update updated_at on books
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on books
  for each row execute function update_updated_at();
