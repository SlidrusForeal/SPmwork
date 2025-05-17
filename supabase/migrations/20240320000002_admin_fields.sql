-- Создаем тип для ролей пользователей
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

-- Добавляем поля для администрирования в таблицу users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Создаем таблицу для жалоб
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Создаем функцию для логирования действий администраторов
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Функция для логирования действий администраторов
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS admin_logs AS $$
DECLARE
  v_log admin_logs;
BEGIN
  INSERT INTO admin_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details
  )
  RETURNING * INTO v_log;
  
  RETURN v_log;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для логирования изменений статуса пользователя
CREATE OR REPLACE FUNCTION log_user_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.is_banned IS DISTINCT FROM NEW.is_banned) OR
     (OLD.role IS DISTINCT FROM NEW.role) THEN
    PERFORM log_admin_action(
      auth.uid(),
      CASE
        WHEN NEW.is_banned THEN 'user_banned'
        WHEN OLD.is_banned THEN 'user_unbanned'
        WHEN NEW.role != OLD.role THEN 'role_changed'
      END,
      'user',
      NEW.id,
      jsonb_build_object(
        'old_status', jsonb_build_object(
          'is_banned', OLD.is_banned,
          'role', OLD.role
        ),
        'new_status', jsonb_build_object(
          'is_banned', NEW.is_banned,
          'role', NEW.role
        ),
        'reason', NEW.ban_reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_status_change
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_status_change(); 