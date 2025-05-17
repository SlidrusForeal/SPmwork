import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { X } from "lucide-react";

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Установить приложение</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Установите SPmwork на ваше устройство для быстрого доступа и работы
            офлайн
          </p>
          <div className="flex space-x-2">
            <Button onClick={handleInstall} variant="primary">
              Установить
            </Button>
            <Button onClick={() => setVisible(false)} variant="ghost">
              Не сейчас
            </Button>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
