BEGIN;
create or replace function public.ef_complete_article(p_article text,p_answers integer[]) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); k integer[]; r public.ef_article_progress%rowtype; n integer:=0; i integer;
begin
if u is null then raise exception 'Sign in first'; end if;
k:=case p_article when 'curiosity' then array[0,1,2] when 'ai' then array[1,0,2] when 'stone' then array[0,1,2] when 'macaques' then array[1,0,2] when 'control' then array[0,1,2] else null end;
if k is null or coalesce(array_length(p_answers,1),0)<>3 then raise exception 'Invalid answers'; end if;
for i in 1..3 loop if p_answers[i]=k[i] then n:=n+1; end if; end loop;
if n<2 then raise exception 'Comprehension check not passed'; end if;
insert into public.ef_article_progress(user_id,article_id) values(u,p_article) on conflict (user_id,article_id) do nothing;
select * into r from public.ef_article_progress where user_id=u and article_id=p_article for update;
if not found then raise exception 'Article progress unavailable'; end if;
if r.completed then return false; end if;
update public.ef_article_progress set completed=true where user_id=u and article_id=p_article;
insert into public.ef_daily_activity(user_id,activity_date) values(u,(now() at time zone 'Asia/Tashkent')::date) on conflict do nothing;
return true;
end $$;
revoke all on function public.ef_complete_article(text,integer[]) from public,anon;
grant execute on function public.ef_complete_article(text,integer[]) to authenticated;

COMMIT;
NOTIFY pgrst, 'reload schema';
