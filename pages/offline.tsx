// pages/offline.tsx
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui";

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
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Вы офлайн</h1>
        <p className="mb-6 text-center">
          Пожалуйста, проверьте подключение к интернету и повторите попытку.
        </p>
        <Button onClick={() => window.location.reload()} aria-label="Повторить">
          Попробовать снова
        </Button>
      </div>
    </Layout>
  );
}
