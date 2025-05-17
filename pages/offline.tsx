// pages/offline.tsx
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui";
import { WifiOff, Database, MessageSquare, RefreshCw } from "lucide-react";

export default function Offline() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
      if (navigator.onLine) window.location.reload();
    }
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <WifiOff size={64} className="text-gray-400 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Вы офлайн</h1>

        <div className="max-w-md text-center mb-8">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Отсутствует подключение к интернету. Но не волнуйтесь, некоторые
            функции доступны офлайн:
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <Database className="text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold">Кэшированные заказы</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Доступен просмотр ранее загруженных заказов
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MessageSquare className="text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold">История чатов</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Можно просматривать историю сообщений
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Проверить подключение</span>
        </Button>
      </div>
    </Layout>
  );
}
