import { DeleteUserButton } from "@/components/DeleteUserButton";
import type { Role } from "@prisma/client";

type AdminUser = {
  id: string;
  displayName: string;
  username: string;
  role: Role;
};

type AdminUsersPanelProps = {
  users: AdminUser[];
  adminId: string;
  adminCount: number;
};

export function AdminUsersPanel({ users, adminId, adminCount }: AdminUsersPanelProps) {
  return (
    <>
      <div className="admin-users-table-wrap">
        <table className="data-table tight admin-users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const action = userActionProps(user, adminId, adminCount);

              return (
                <tr key={user.id}>
                  <td>{user.displayName}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td className="table-actions">{action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="admin-users-cards">
        {users.map((user) => {
          const action = userActionProps(user, adminId, adminCount);

          return (
            <li className="admin-user-card" key={user.id}>
              <div className="admin-user-card-main">
                <strong>{user.displayName}</strong>
                <span className="muted">@{user.username}</span>
              </div>
              <div className="admin-user-card-footer">
                <span className="admin-user-role">{user.role}</span>
                {action}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function userActionProps(user: AdminUser, adminId: string, adminCount: number) {
  const isSelf = user.id === adminId;
  const isLastAdmin = user.role === "ADMIN" && adminCount <= 1;
  const canDelete = !isSelf && !isLastAdmin;

  if (canDelete) {
    return <DeleteUserButton userId={user.id} displayName={user.displayName} />;
  }

  return (
    <span className="muted table-action-muted">{isSelf ? "Tu cuenta" : "Unico admin"}</span>
  );
}
