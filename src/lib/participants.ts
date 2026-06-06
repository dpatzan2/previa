/** Usuarios que compiten en la quiniela. */
export const participantWhere = {
  isActive: true,
  canParticipate: true,
} as const;

export function canParticipateInPool(user: { canParticipate: boolean }) {
  return user.canParticipate;
}

export function isNonParticipatingAdmin(user: { role: string; canParticipate: boolean }) {
  return user.role === "ADMIN" && !user.canParticipate;
}
