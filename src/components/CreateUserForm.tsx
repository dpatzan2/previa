"use client";

import { UserPlus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createUserAction } from "@/app/actions";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";
import { SubmitButton } from "@/components/SubmitButton";

export function CreateUserForm() {
  const [formKey, setFormKey] = useState(0);
  const [state, action, isPending] = useActionState(createUserAction, null);
  const feedback = useActionFeedback(state);

  useEffect(() => {
    if (state?.ok) {
      setFormKey((current) => current + 1);
    }
  }, [state]);

  return (
    <form key={formKey} action={action} className="stack-form compact">
      <FormFeedback feedback={feedback} />
      <label>
        Usuario
        <input name="username" required minLength={3} />
      </label>
      <label>
        Nombre
        <input name="displayName" required minLength={2} />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" required minLength={6} />
      </label>
      <label>
        Rol
        <select name="role" defaultValue="PLAYER">
          <option value="PLAYER">Jugador</option>
          <option value="ADMIN">Admin</option>
        </select>
      </label>
      <SubmitButton
        isPending={isPending}
        pendingLabel="Creando..."
        label="Crear"
        icon={<UserPlus size={18} />}
      />
    </form>
  );
}
