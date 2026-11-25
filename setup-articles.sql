-- Run after existing vocabulary and progress setup. No auth changes.
create table if not exists public.ef_daily_activity(user_id uuid not null references auth.users(id) on delete cascade,activity_date date not null,created_at timestamptz not null default now(),primary key(user_id,activity_date));
alter table public.ef_daily_activity enable row level security;
drop policy if exists "EF users can view own activity" on public.ef_daily_activity;
create policy "EF users can view own activity" on public.ef_daily_activity for select to authenticated using(auth.uid()=user_id);
grant select on public.ef_daily_activity to authenticated;
create table if not exists public.ef_article_progress(user_id uuid not null references auth.users(id) on delete cascade,article_id text not null check(article_id in ('curiosity','ai','stone','macaques','control')),bookmarked boolean not null default false,seconds integer not null default 0 check(seconds>=0),depth integer not null default 0 check(depth between 0 and 100),completed boolean not null default false,primary key(user_id,article_id));
alter table public.ef_article_progress enable row level security;
drop policy if exists own_articles on public.ef_article_progress;
create policy own_articles on public.ef_article_progress for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.ef_article_progress from anon,authenticated;
grant select on public.ef_article_progress to authenticated;
grant insert(user_id,article_id,bookmarked,seconds,depth),update(bookmarked,seconds,depth) on public.ef_article_progress to authenticated;
create or replace function public.ef_complete_article(p_article text,p_answers integer[]) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); k integer[]; r public.ef_article_progress%rowtype; n integer:=0; i integer;
begin
if u is null then raise exception 'Sign in first'; end if;
k:=case p_article when 'curiosity' then array[0,1,2] when 'ai' then array[1,0,2] when 'stone' then array[0,1,2] when 'macaques' then array[1,0,2] when 'control' then array[0,1,2] else null end;
if k is null or coalesce(array_length(p_answers,1),0)<>3 then raise exception 'Invalid answers'; end if;
for i in 1..3 loop if p_answers[i]=k[i] then n:=n+1; end if; end loop;
if n<2 then raise exception 'Comprehension check not passed'; end if;
select * into r from public.ef_article_progress where user_id=u and article_id=p_article for update;
if not found or r.seconds<180 or r.depth<90 then raise exception 'Reading requirements not met'; end if;
if r.completed then return false; end if;
update public.ef_article_progress set completed=true where user_id=u and article_id=p_article;
insert into public.ef_daily_activity(user_id,activity_date) values(u,(now() at time zone 'Asia/Tashkent')::date) on conflict do nothing;
return true;
end $$;
revoke all on function public.ef_complete_article(text,integer[]) from public,anon;
grant execute on function public.ef_complete_article(text,integer[]) to authenticated;
