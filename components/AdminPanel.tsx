import { useState } from "react";
import { useUser } from "../lib/useUser";
import { supabase } from "../lib/supabaseClient";
import { User } from "../types";
import { Button } from "./ui/Button";
import { Input } from "./ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/Table";
import ReportList from "./ReportList";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface AdminPanelProps {
  users: User[];
  orders: any[];
  reports: any[];
}

export default function AdminPanel({
  users: initialUsers,
  orders,
  reports: initialReports,
}: AdminPanelProps) {
  const { user } = useUser();
  const [users, setUsers] = useState(initialUsers);
  const [reports, setReports] = useState(initialReports);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "orders" | "reports">(
    "users"
  );

  // Фильтрация пользователей
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Блокировка/разблокировка пользователя
  const toggleUserBan = async (userId: string, isBanned: boolean = false) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_banned: !isBanned })
        .eq("id", userId);

      if (error) throw error;

      setUsers(
        users.map((u) => (u.id === userId ? { ...u, is_banned: !isBanned } : u))
      );
    } catch (error) {
      console.error("Error toggling user ban:", error);
      alert("Не удалось изменить статус пользователя");
    }
  };

  // Просмотр деталей пользователя
  const viewUserDetails = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          *,
          orders:orders(count),
          reviews:reviews(count),
          messages:messages(count)
        `
        )
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      setSelectedUser(userData);
    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("Не удалось загрузить информацию о пользователе");
    }
  };

  // Обработка жалобы
  const handleResolveReport = async (
    reportId: string,
    action: "approve" | "reject",
    comment: string
  ) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, comment }),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve report");
      }

      // Обновляем список жалоб
      setReports(
        reports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: action === "approve" ? "resolved" : "rejected",
                admin_comment: comment,
                resolved_at: new Date().toISOString(),
              }
            : r
        )
      );
    } catch (error) {
      console.error("Error resolving report:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <div className="flex space-x-4">
          <Button
            variant={activeTab === "users" ? "primary" : "ghost"}
            onClick={() => setActiveTab("users")}
          >
            Пользователи
          </Button>
          <Button
            variant={activeTab === "orders" ? "primary" : "ghost"}
            onClick={() => setActiveTab("orders")}
          >
            Заказы
          </Button>
          <Button
            variant={activeTab === "reports" ? "primary" : "ghost"}
            onClick={() => setActiveTab("reports")}
          >
            Жалобы
          </Button>
        </div>
      </div>

      {activeTab === "users" && (
        <div className="space-y-4">
          <Input
            type="search"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Minecraft</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.minecraftUsername || "—"}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </TableCell>
                  <TableCell>
                    {user.is_banned ? (
                      <span className="text-red-500">Заблокирован</span>
                    ) : (
                      <span className="text-green-500">Активен</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewUserDetails(user.id)}
                      >
                        Детали
                      </Button>
                      <Button
                        variant={user.is_banned ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => toggleUserBan(user.id, user.is_banned)}
                      >
                        {user.is_banned ? "Разблокировать" : "Заблокировать"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Управление заказами</h2>
          {/* Здесь будет таблица заказов */}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Жалобы и обращения</h2>
          <ReportList reports={reports} onResolve={handleResolveReport} />
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Информация о пользователе {selectedUser.username}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Основная информация</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>Discord ID:</div>
                  <div>{selectedUser.id}</div>
                  <div>Minecraft:</div>
                  <div>{selectedUser.minecraftUsername || "—"}</div>
                  <div>Дата регистрации:</div>
                  <div>
                    {formatDistanceToNow(new Date(selectedUser.created_at), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium">Статистика</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>Заказов:</div>
                  <div>{selectedUser.orders || 0}</div>
                  <div>Отзывов:</div>
                  <div>{selectedUser.reviews || 0}</div>
                  <div>Сообщений:</div>
                  <div>{selectedUser.messages || 0}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    toggleUserBan(
                      selectedUser.id,
                      selectedUser.is_banned || false
                    )
                  }
                >
                  {selectedUser.is_banned ? "Разблокировать" : "Заблокировать"}
                </Button>
                <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
