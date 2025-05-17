-- Создание типа для разных видов уведомлений
CREATE TYPE notification_type AS ENUM (
  'new_message',
  'order_status',
  'new_review',
  'payment_status',
  'system_alert'
);

-- Создание таблицы уведомлений
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Внешние ключи для связанных сущностей
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Функция для создания уведомления
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_order_id UUID DEFAULT NULL,
  p_message_id UUID DEFAULT NULL,
  p_review_id UUID DEFAULT NULL
) RETURNS notifications AS $$
DECLARE
  v_notification notifications;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    metadata,
    order_id,
    message_id,
    review_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata,
    p_order_id,
    p_message_id,
    p_review_id
  )
  RETURNING * INTO v_notification;
  
  RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для уведомлений о новых сообщениях
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
BEGIN
  -- Находим получателей сообщения (участников заказа)
  WITH order_participants AS (
    SELECT 
      CASE 
        WHEN o.buyer_id != NEW.sender_id THEN o.buyer_id
        ELSE s.user_id
      END AS recipient_id
    FROM orders o
    LEFT JOIN offers s ON s.order_id = o.id AND s.status = 'accepted'
    WHERE o.id = NEW.order_id
  )
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    message_id,
    order_id
  )
  SELECT
    p.recipient_id,
    'new_message',
    'Новое сообщение',
    substring(NEW.content from 1 for 100) || CASE WHEN length(NEW.content) > 100 THEN '...' ELSE '' END,
    '/orders/' || NEW.order_id,
    NEW.id,
    NEW.order_id
  FROM order_participants p;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Триггер для уведомлений об изменении статуса заказа
CREATE OR REPLACE FUNCTION notify_order_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    -- Уведомление для покупателя
    PERFORM create_notification(
      NEW.buyer_id,
      'order_status',
      'Статус заказа изменен',
      'Заказ #' || substring(NEW.id::text from 1 for 8) || ' теперь в статусе: ' || NEW.status,
      '/orders/' || NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
      NEW.id
    );
    
    -- Уведомление для продавца, если есть принятое предложение
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      order_id,
      metadata
    )
    SELECT
      s.user_id,
      'order_status',
      'Статус заказа изменен',
      'Заказ #' || substring(NEW.id::text from 1 for 8) || ' теперь в статусе: ' || NEW.status,
      '/orders/' || NEW.id,
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    FROM offers s
    WHERE s.order_id = NEW.id AND s.status = 'accepted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change(); 