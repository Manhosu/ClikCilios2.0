-- Função RPC para liberar usuários pré-criados (cancelamentos/reembolsos)
-- Permite que usuários ocupados voltem ao status disponível

create or replace function public.release_pre_user(
  p_buyer_email text,
  p_hotmart_transaction_id text,
  p_hotmart_notification_id text
) returns table(pre_user_id uuid, username text, released boolean) as $$
declare
  sel record;
begin
  -- Verifica se a notificação de cancelamento já foi processada
  if exists(
    select 1 from public.user_assignments 
    where hotmart_notification_id = p_hotmart_notification_id
  ) then
    raise notice 'cancellation_already_processed';
    return;
  end if;

  -- Busca a atribuição ativa do usuário
  select ua.pre_user_id, pu.username into sel
  from public.user_assignments ua
  join public.pre_users pu on pu.id = ua.pre_user_id
  where ua.buyer_email = p_buyer_email
    and ua.hotmart_transaction_id = p_hotmart_transaction_id
    and ua.status = 'active'
  limit 1;

  -- Se não encontrou atribuição ativa, registra o evento mas não falha
  if not found then
    -- Registra o evento de cancelamento mesmo sem atribuição ativa
    insert into public.user_assignments(
      pre_user_id, 
      buyer_email, 
      buyer_name, 
      hotmart_transaction_id, 
      hotmart_notification_id, 
      event, 
      assigned_at,
      status
    ) values (
      null, 
      p_buyer_email, 
      'Unknown', 
      p_hotmart_transaction_id, 
      p_hotmart_notification_id, 
      'purchase_cancelled', 
      now(),
      'cancelled'
    );
    
    raise notice 'no_active_assignment_found';
    return;
  end if;

  -- Libera o usuário (volta para disponível)
  update public.pre_users
    set status = 'available', 
        password_hash = null,
        updated_at = now()
    where id = sel.pre_user_id;

  -- Atualiza a atribuição existente para cancelada
  update public.user_assignments
    set status = 'cancelled',
        released_at = now()
    where pre_user_id = sel.pre_user_id
      and hotmart_transaction_id = p_hotmart_transaction_id
      and status = 'active';

  -- Registra o novo evento de cancelamento
  insert into public.user_assignments(
    pre_user_id, 
    buyer_email, 
    buyer_name, 
    hotmart_transaction_id, 
    hotmart_notification_id, 
    event, 
    assigned_at,
    status
  ) values (
    sel.pre_user_id, 
    p_buyer_email, 
    'Unknown', 
    p_hotmart_transaction_id, 
    p_hotmart_notification_id, 
    'purchase_cancelled', 
    now(),
    'cancelled'
  );

  -- Retorna os dados do usuário liberado
  pre_user_id := sel.pre_user_id;
  username := sel.username;
  released := true;
  return next;
end;
$$ language plpgsql security definer;

-- Concede permissões para execução
grant execute on function public.release_pre_user(text, text, text) to authenticated;
grant execute on function public.release_pre_user(text, text, text) to service_role;

-- Função auxiliar para obter estatísticas dos usuários
create or replace function public.get_pre_users_stats()
returns table(
  usuarios_disponiveis bigint,
  usuarios_ocupados bigint,
  usuarios_suspensos bigint,
  total_usuarios bigint,
  total_atribuicoes bigint,
  atribuicoes_ativas bigint,
  atribuicoes_canceladas bigint
) as $$
begin
  return query
  select 
    (select count(*) from public.pre_users where status = 'available') as usuarios_disponiveis,
    (select count(*) from public.pre_users where status = 'occupied') as usuarios_ocupados,
    (select count(*) from public.pre_users where status = 'suspended') as usuarios_suspensos,
    (select count(*) from public.pre_users) as total_usuarios,
    (select count(*) from public.user_assignments) as total_atribuicoes,
    (select count(*) from public.user_assignments where status = 'active') as atribuicoes_ativas,
    (select count(*) from public.user_assignments where status = 'cancelled') as atribuicoes_canceladas;
end;
$$ language plpgsql security definer;

-- Concede permissões para a função de estatísticas
grant execute on function public.get_pre_users_stats() to authenticated;
grant execute on function public.get_pre_users_stats() to service_role;