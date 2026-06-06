import Link from "next/link";
import { UserPlus } from "lucide-react";
import { registerAction } from "@/app/actions";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <section className="login-wrap">
      <div className="login-panel">
        <div className="login-head">
          <span className="brand-mark">
            <UserPlus size={22} />
          </span>
          <div>
            <h1>Registro</h1>
            <p>Crear participante</p>
          </div>
        </div>
        <form action={registerAction} className="stack-form">
          <label>
            Nombre
            <input name="displayName" autoComplete="name" required minLength={2} />
          </label>
          <label>
            Usuario
            <input name="username" autoComplete="username" required minLength={3} />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
          <RegisterError searchParams={searchParams} />
          <button className="primary-button" type="submit">
            Crear cuenta
          </button>
        </form>
        <div className="auth-switch">
          <span>Ya tienes usuario</span>
          <Link href="/login">Entrar</Link>
        </div>
      </div>
    </section>
  );
}

async function RegisterError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (params.error === "taken") {
    return <p className="form-error">Ese usuario ya existe.</p>;
  }
  if (params.error === "invalid") {
    return <p className="form-error">Revisa los campos e intenta de nuevo.</p>;
  }
  return null;
}
