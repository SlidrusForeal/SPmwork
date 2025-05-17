-- Create review function
create or replace function create_review(
  p_order_id uuid,
  p_reviewer_id uuid,
  p_rating int,
  p_comment text default null
) returns json
language plpgsql
security definer
as $$
declare
  v_order record;
  v_review record;
begin
  -- Check if order exists and user is authorized
  select * into v_order from orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;

  -- Only allow buyer to review completed orders
  if v_order.buyer_id != p_reviewer_id then
    raise exception 'Only the buyer can review the order';
  end if;

  if v_order.status != 'completed' then
    raise exception 'Can only review completed orders';
  end if;

  -- Create review
  insert into reviews (
    order_id,
    reviewer_id,
    rating,
    comment
  ) values (
    p_order_id,
    p_reviewer_id,
    p_rating,
    p_comment
  )
  returning * into v_review;

  -- Return review data
  return json_build_object(
    'id', v_review.id,
    'orderId', v_review.order_id,
    'rating', v_review.rating,
    'comment', v_review.comment,
    'created_at', v_review.created_at
  );
end;
$$; 