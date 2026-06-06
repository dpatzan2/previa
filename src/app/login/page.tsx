import { Lock } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/app/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <section className="login-wrap">
      <div className="login-panel">
        <div className="login-head">
          <span className="brand-mark">
            <Lock size={22} />
          </span>
          <div>
            <h1>Ingreso</h1>
            <p>Quiniela Mundial 2026</p>
          </div>
        </div>
        <form action={loginAction} className="stack-form">
          <label>
            Usuario
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <LoginError searchParams={searchParams} />
          <button className="primary-button" type="submit">
            Entrar
          </button>
        </form>
        <div className="auth-switch">
          <span>Nuevo participante</span>
          <Link href="/register">Crear cuenta</Link>
        </div>
      </div>
    </section>
  );
}

async function LoginError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;
  return <p className="form-error">Usuario o contraseña incorrectos.</p>;
}
