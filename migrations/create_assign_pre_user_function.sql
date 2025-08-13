-- Função RPC para alocar usuários pré-criados com transação segura
-- Evita condições de corrida usando FOR UPDATE SKIP LOCKED

create or replace function public.assign_pre_user(
  p_buyer_email text,
  p_buyer_name text,
  p_hotmart_transaction_id text,
  p_hotmart_notification_id text,
  p_password_hash text
) returns table(pre_user_id uuid, username text) as $$
declare
  sel record;
begin
  -- Verifica se a notificação já foi processada para evitar duplicatas
  if exists(select 1 from public.user_assignments where hotmart_notification_id = p_hotmart_notification_id) then
    raise notice 'already_processed';
    return;
  end if;

  -- Seleciona um usuário disponível com lock exclusivo
  -- SKIP LOCKED evita que outras transações esperem por este registro
  select id, username into sel
  from public.pre_users
  where status = 'available'
  for update skip locked
  limit 1;

  -- Se não encontrou usuário disponível, lança exceção
  if not found then
    raise exception 'no_available_user';
  end if;

  -- Atualiza o usuário para ocupado e define a senha
  update public.pre_users
    set status = 'occupied', 
        password_hash = p_password_hash, 
        updated_at = now()
    where id = sel.id;

  -- Registra a atribuição do usuário
  insert into public.user_assignments(
    pre_user_id, 
    buyer_email, 
    buyer_name, 
    hotmart_transaction_id, 
    hotmart_notification_id, 
    event, 
    assigned_at
  ) values (
    sel.id, 
    p_buyer_email,
    p_buyer_name, 
    p_hotmart_transaction_id, 
    p_hotmart_notification_id, 
    'purchase_approved', 
    now()
  );

  -- Retorna os dados do usuário alocado
  pre_user_id := sel.id;
  username := sel.username;
  return next;
end;
$$ language plpgsql security definer;

-- Concede permissões para execução
grant execute on function public.assign_pre_user(text, text, text, text, text) to authenticated;
grant execute on function public.assign_pre_user(text, text, text, text, text) to service_role;