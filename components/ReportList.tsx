import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "./ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/Table";

interface Report {
  id: string;
  reporter: {
    username: string;
    minecraft_username?: string;
  };
  reported: {
    username: string;
    minecraft_username?: string;
  };
  order?: {
    id: string;
    title: string;
  };
  message?: {
    id: string;
    content: string;
  };
  reason: string;
  status: string;
  admin_comment?: string;
  created_at: string;
  resolved_at?: string;
}

interface ReportListProps {
  reports: Report[];
  onResolve: (
    reportId: string,
    action: "approve" | "reject",
    comment: string
  ) => Promise<void>;
}

export default function ReportList({ reports, onResolve }: ReportListProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResolve = async (action: "approve" | "reject") => {
    if (!selectedReport) return;

    setLoading(true);
    try {
      await onResolve(selectedReport.id, action, comment);
      setSelectedReport(null);
      setComment("");
    } catch (error) {
      console.error("Error resolving report:", error);
      alert("Не удалось обработать жалобу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Заявитель</TableHead>
            <TableHead>Нарушитель</TableHead>
            <TableHead>Причина</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                {report.reporter.username}
                {report.reporter.minecraft_username && (
                  <span className="text-sm text-gray-500">
                    {" "}
                    ({report.reporter.minecraft_username})
                  </span>
                )}
              </TableCell>
              <TableCell>
                {report.reported.username}
                {report.reported.minecraft_username && (
                  <span className="text-sm text-gray-500">
                    {" "}
                    ({report.reported.minecraft_username})
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate">{report.reason}</div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : report.status === "resolved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {report.status === "pending"
                    ? "На рассмотрении"
                    : report.status === "resolved"
                    ? "Одобрено"
                    : "Отклонено"}
                </span>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(report.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </TableCell>
              <TableCell>
                {report.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                  >
                    Рассмотреть
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Рассмотрение жалобы</h2>

              <div>
                <h3 className="font-medium mb-2">Детали жалобы</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Заявитель:</strong>{" "}
                    {selectedReport.reporter.username}
                  </p>
                  <p>
                    <strong>Нарушитель:</strong>{" "}
                    {selectedReport.reported.username}
                  </p>
                  {selectedReport.order && (
                    <p>
                      <strong>Заказ:</strong> {selectedReport.order.title}
                    </p>
                  )}
                  {selectedReport.message && (
                    <p>
                      <strong>Сообщение:</strong>{" "}
                      {selectedReport.message.content}
                    </p>
                  )}
                  <p>
                    <strong>Причина:</strong> {selectedReport.reason}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium mb-2"
                >
                  Комментарий администратора
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Укажите причину принятого решения..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleResolve("reject")}
                  disabled={loading}
                >
                  Отклонить
                </Button>
                <Button
                  onClick={() => handleResolve("approve")}
                  disabled={loading}
                >
                  Одобрить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
