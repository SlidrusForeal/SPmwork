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

const TypingIndicator = () => (
  <div className="flex items-center space-x-1 text-sm text-gray-500">
    <span className="animate-pulse">•</span>
    <span className="animate-pulse animation-delay-200">•</span>
    <span className="animate-pulse animation-delay-400">•</span>
  </div>
);

interface ChatProps {
  orderId: string;
}

type MessageWithAttachment = Message & {
  metadata?: { attachment?: { url: string; filename: string } };
};

export default function Chat({ orderId }: ChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<MessageWithAttachment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeout = useRef<NodeJS.Timeout>();

  // Подписка на presence / typing
  useEffect(() => {
    const channel = supabase
      .channel(`order:${orderId}`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: Record<string, boolean> = {};
        Object.values(state).forEach((presArr: any) =>
          presArr.forEach((p: any) => {
            if (p.typing && p.user_id !== user?.id) typing[p.user_id] = true;
          })
        );
        setTypingUsers(typing);
      })
      .subscribe();

    return () => void supabase.removeChannel(channel);
  }, [orderId, user?.id]);

  const sendTyping = () => {
    const channel = supabase.channel(`order:${orderId}`);
    channel.track({ user_id: user?.id, typing: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      channel.track({ user_id: user?.id, typing: false });
    }, 1500);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("messages").insert([
        {
          order_id: orderId,
          sender_id: user!.id,
          content: text,
        },
      ]);
      if (error) throw error;
      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender_id === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                m.sender_id === user?.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <p>{m.content}</p>
              {m.metadata?.attachment && (
                <a
                  href={m.metadata.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center mt-2 text-sm hover:underline"
                >
                  <Paperclip size={14} className="mr-1" />
                  {m.metadata.attachment.filename}
                </a>
              )}
              <div className="flex items-center justify-end mt-1 space-x-1">
                <span className="text-xs opacity-75">
                  {formatDistanceToNow(new Date(m.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
                {m.sender_id === user?.id && (
                  <span className="text-xs">
                    {m.read_at ? (
                      <CheckCheck
                        className="text-green-400 animate-pulse"
                        size={14}
                      />
                    ) : (
                      <Check className="text-white/80" size={14} />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {Object.keys(typingUsers).length > 0 && <TypingIndicator />}
      </div>
      <div className="border-t p-4 dark:border-gray-700">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              sendTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Введите сообщение..."
            className="flex-grow"
          />
          <Button onClick={sendMessage} disabled={loading || !text.trim()}>
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Отправить"
            )}
          </Button>
        </div>
        <FileUpload orderId={orderId} onUpload={() => {}} />
      </div>
    </div>
  );
}
