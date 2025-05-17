import { useState, useEffect, useRef } from "react";
import { useUser } from "../lib/useUser";
import { supabase } from "../lib/supabaseClient";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Message } from "../types";
import { Loader2, Check, CheckCheck, Paperclip, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui";
import FileUpload from "./FileUpload";

interface ChatProps {
  orderId: string;
}

interface MessageWithAttachment extends Message {
  attachment?: {
    url: string;
    filename: string;
  };
}

export default function Chat({ orderId }: ChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<MessageWithAttachment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Загрузка сообщений
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();
  }, [orderId]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Подписка на новые сообщения и индикаторы набора
  useEffect(() => {
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages((prev) => [
            ...prev,
            payload.new as MessageWithAttachment,
          ]);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state).reduce(
          (acc: Record<string, boolean>, presence: any) => {
            presence.forEach((p: any) => {
              if (p.typing && p.user_id !== user?.id) {
                acc[p.user_id] = true;
              }
            });
            return acc;
          },
          {}
        );
        setTyping(typingUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user?.id, typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user?.id]);

  // Обработка набора текста
  const handleTyping = async () => {
    const channel = supabase.channel(`order:${orderId}`);
    await channel.track({ user_id: user?.id, typing: true });

    if (typingTimeoutRef.current[user?.id || ""]) {
      clearTimeout(typingTimeoutRef.current[user?.id || ""]);
    }
    typingTimeoutRef.current[user?.id || ""] = setTimeout(async () => {
      await channel.track({ user_id: user?.id, typing: false });
    }, 2000);
  };

  // Обработка загрузки файла
  const handleFileUpload = (url: string, filename: string) => {
    setAttachment({ url, filename });
    setShowUpload(false);
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if ((!text.trim() && !attachment) || !user) return;

    setLoading(true);
    try {
      const messageData: any = {
        order_id: orderId,
        sender_id: user.id,
        content: text.trim() || "Прикрепленный файл",
      };

      if (attachment) {
        messageData.metadata = {
          attachment: {
            url: attachment.url,
            filename: attachment.filename,
          },
        };
      }

      const { error } = await supabase.from("messages").insert([messageData]);

      if (error) throw error;
      setText("");
      setAttachment(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === user?.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              {message.metadata?.attachment && (
                <div className="mb-2">
                  {isImage(message.metadata.attachment.url) ? (
                    <img
                      src={message.metadata.attachment.url}
                      alt={message.metadata.attachment.filename}
                      className="max-w-full rounded"
                    />
                  ) : (
                    <a
                      href={message.metadata.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm hover:underline"
                    >
                      <Paperclip size={16} />
                      <span>{message.metadata.attachment.filename}</span>
                    </a>
                  )}
                </div>
              )}
              <p className="break-words">{message.content}</p>
              <div className="flex items-center justify-end mt-1 space-x-1">
                <span className="text-xs opacity-75">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
                {message.sender_id === user?.id && (
                  <span className="text-xs">
                    {message.read_at ? (
                      <CheckCheck size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {Object.keys(typing).length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Loader2 className="animate-spin" size={16} />
            <span>
              {Object.keys(typing).length === 1
                ? "Собеседник печатает..."
                : "Несколько человек печатают..."}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showUpload && (
        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Загрузка файла</h3>
            <button
              onClick={() => setShowUpload(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <FileUpload orderId={orderId} onUpload={handleFileUpload} />
        </div>
      )}

      <div className="border-t p-4 dark:border-gray-700">
        {attachment && (
          <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="flex items-center space-x-2">
              <Paperclip size={16} />
              <span className="text-sm truncate">{attachment.filename}</span>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowUpload(!showUpload)}
            variant="outline"
            size="icon"
            aria-label="Прикрепить файл"
          >
            <Paperclip size={20} />
          </Button>
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Введите сообщение..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Отправить"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
