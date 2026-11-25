-- Relatório diário: tabela única de lançamentos
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null default (now() at time zone 'America/Sao_Paulo')::date,
  tipo text not null check (tipo in ('cobranca','ligacao','mensagem','emissao','recebimento','negociacao')),
  produto text check (produto in ('multa','km_excedente','arrendamento')),
  documento text check (documento in ('autuacao','fatura','boleto')),
  cliente text,
  valor numeric(12,2) check (valor is null or valor >= 0),
  descricao text,
  quantidade integer not null default 1 check (quantidade between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists lancamentos_user_data_idx on public.lancamentos (user_id, data);

alter table public.lancamentos enable row level security;

create policy "ver os próprios" on public.lancamentos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "inserir os próprios" on public.lancamentos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "editar os próprios" on public.lancamentos
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "excluir os próprios" on public.lancamentos
  for delete to authenticated using ((select auth.uid()) = user_id);
