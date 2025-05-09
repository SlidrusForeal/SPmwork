// pages/admin/users.tsx
import { GetServerSideProps } from "next";
import { useState } from "react";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import Layout from "../../../components/Layout";

interface User {
  id: string;
  discord_username: string;
  role: string;
  created_at: string;
}

export default function AdminUsers({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const changeRole = async (userId: string, newRole: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Управление пользователями</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th>ID</th>
            <th>Discord</th>
            <th>Роль</th>
            <th>Дата</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.discord_username}</td>
              <td>{u.role}</td>
              <td>{new Date(u.created_at).toLocaleString()}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="border p-1"
                >
                  <option value="user">user</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = parse(req.headers.cookie || "");
  try {
    const user = jwt.verify(
      cookies.token || "",
      process.env.JWT_SECRET!
    ) as any;
    if (!["moderator", "admin"].includes(user.role)) throw new Error();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users`,
      {
        headers: { Cookie: `token=${cookies.token}` },
      }
    );
    const { users } = await res.json();
    return { props: { initialUsers: users } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
};
