import { Lock } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/app/actions";
import { safeRedirectPath } from "@/lib/session-cookie";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; next?: string }>;
}) {
  return (
    <section className="login-wrap">
      <div className="login-panel">
        <div className="login-head" style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <span className="brand-mark" style={{ border: "none", background: "transparent", padding: 0, width: "48px", height: "48px", flexShrink: 0 }}>
            <img src="/logo-previa-shield.png" alt="Previa Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </span>
          <div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 850 }}>Ingreso</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "2px 0 0" }}>Quiniela Previa</p>
          </div>
        </div>
        <LoginForm searchParams={searchParams} />
        <div className="auth-switch">
          <span>Nuevo participante</span>
          <Link href="/register">Crear cuenta</Link>
        </div>
      </div>
    </section>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);

  return (
    <form action={loginAction} className="stack-form">
      <input type="hidden" name="next" value={next} />
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
      <LoginMessages error={params.error} reason={params.reason} />
      <button className="primary-button" type="submit">
        Entrar
      </button>
    </form>
  );
}

function LoginMessages({
  error,
  reason,
}: {
  error?: string;
  reason?: string;
}) {
  if (error) {
    return <p className="form-error">Usuario o contraseña incorrectos.</p>;
  }

  if (reason === "expired") {
    return <p className="form-error">Tu sesion expiro. Vuelve a iniciar sesion.</p>;
  }

  if (reason === "missing") {
    return <p className="form-error">Debes iniciar sesion para continuar.</p>;
  }

  return null;
}
