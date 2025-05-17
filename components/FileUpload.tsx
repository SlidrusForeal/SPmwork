import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface FileUploadProps {
  orderId: string;
  onUpload: (url: string, filename: string) => void;
}

export default function FileUpload({ orderId, onUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      // Проверяем размер файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Файл слишком большой (максимум 10MB)");
      }

      // Генерируем уникальное имя файла
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;
      const filePath = `${orderId}/${fileName}`;

      // Загружаем файл
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Получаем публичную ссылку
      const { data } = await supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      if (data) {
        onUpload(data.publicUrl, file.name);
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative ${
        uploading ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 dark:border-gray-700"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
          <Upload className="w-6 h-6 text-gray-400" />
          <p className="text-sm text-gray-500">
            Перетащите файл сюда или нажмите для выбора
          </p>
          <p className="text-xs text-gray-400">Максимальный размер: 10MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}
