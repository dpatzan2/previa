import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { joinRoomAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { SubmitButton } from "@/components/SubmitButton";

function errorMessage(error?: string) {
  if (error === "not-found") return "No encontramos una sala activa con ese codigo.";
  if (error === "invalid") return "Ingresa un codigo de acceso valido.";
  return null;
}

export default async function JoinRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  const message = errorMessage(error);

  return (
    <div className="page narrow-page">
      <Link className="back-link" href="/rooms">
        <ArrowLeft size={16} />
        Volver a salas
      </Link>
      <header className="page-header">
        <div>
          <span className="eyebrow">Acceso</span>
          <h1>Unirme a una sala</h1>
        </div>
      </header>

      <form action={joinRoomAction} className="panel stack-form room-form">
        {message ? <p className="form-error">{message}</p> : null}
        <label>
          Codigo de acceso
          <input
            name="accessCode"
            placeholder="Ej. A7K9Q2"
            minLength={4}
            maxLength={12}
            required
          />
        </label>
        <SubmitButton className="primary-button" pendingText="Uniéndome...">
          Unirme
        </SubmitButton>
      </form>
    </div>
  );
}
