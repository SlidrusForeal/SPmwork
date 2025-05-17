-- Создаем хранилище для вложений
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Политики доступа к хранилищу
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Files are publicly accessible"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'chat-attachments');

-- Добавляем поле metadata в таблицу messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Создаем индекс для поиска по вложениям
CREATE INDEX IF NOT EXISTS idx_messages_attachments
ON messages USING gin ((metadata->'attachment')); 