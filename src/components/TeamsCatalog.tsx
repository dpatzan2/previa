"use client";

import { useState, useTransition } from "react";
import { Edit2, Search, X, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateGlobalTeamAction } from "@/app/actions";
import { flagUrlForTeam } from "@/lib/flags";

type TeamInfo = {
  id: string;
  name: string;
  normalizedName: string;
  logoUrl?: string | null;
  competitions: { id: string; name: string }[];
};

type TeamsCatalogProps = {
  teams: TeamInfo[];
  competitions: { id: string; name: string }[];
};

export function TeamsCatalog({ teams, competitions }: TeamsCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompId, setSelectedCompId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleStartEdit = (team: TeamInfo) => {
    setEditingId(team.id);
    setEditName(team.name);
    setEditLogo(team.logoUrl ?? "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditLogo("");
  };

  // Filter teams list
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.normalizedName.includes(searchTerm.toLowerCase());
    
    const matchesComp =
      !selectedCompId || team.competitions.some((c) => c.id === selectedCompId);

    return matchesSearch && matchesComp;
  });

  return (
    <div className="teams-catalog-container">
      <div className="catalog-filters" style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre o ID normalizado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "36px", width: "100%" }}
          />
        </div>
        <div style={{ width: "240px" }}>
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">Todas las competencias</option>
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-item-list">
        {filteredTeams.length === 0 ? (
          <p className="muted" style={{ padding: "20px 0", textAlign: "center" }}>
            No se encontraron equipos que coincidan con los filtros.
          </p>
        ) : (
          filteredTeams.map((team) => {
            const isEditing = editingId === team.id;

            return (
              <div
                className={isEditing ? "admin-item-row editing" : "admin-item-row"}
                key={team.id}
                style={{ minHeight: "64px", padding: "12px 18px" }}
              >
                {isEditing ? (
                  <form
                    action={updateGlobalTeamAction}
                    style={{ display: "flex", width: "100%", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
                  >
                    <input type="hidden" name="id" value={team.id} />
                    <div style={{ display: "flex", flex: 1, gap: "10px", minWidth: "280px" }}>
                      <input
                        name="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre de equipo"
                        required
                        minLength={2}
                        style={{ flex: 1, height: "38px" }}
                        autoFocus
                      />
                      <input
                        name="logoUrl"
                        value={editLogo}
                        onChange={(e) => setEditLogo(e.target.value)}
                        placeholder="URL de Escudo / Logo (Opcional)"
                        style={{ flex: 1.5, height: "38px" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="submit"
                        className="primary-button"
                        style={{ height: "38px", padding: "0 14px" }}
                      >
                        <Check size={14} />
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={handleCancelEdit}
                        style={{ height: "38px", padding: "0 14px" }}
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {(() => {
                        const flagUrl = team.logoUrl || flagUrlForTeam(team.name);
                        return flagUrl ? (
                          <img
                            src={flagUrl}
                            alt={`Escudo de ${team.name}`}
                            style={{
                              width: "36px",
                              height: "26px",
                              objectFit: "contain",
                              borderRadius: "4px",
                              border: "1px solid var(--line)",
                              background: "var(--panel)",
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <span
                            className="team-flag placeholder"
                            style={{ width: "36px", height: "26px", flexShrink: 0 }}
                            aria-hidden="true"
                          />
                        );
                      })()}
                      <div className="admin-item-info">
                        <strong style={{ fontSize: "1.05rem" }}>{team.name}</strong>
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                          ID: {team.normalizedName}
                        </span>
                        {team.competitions.length > 0 ? (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                            {team.competitions.map((comp) => (
                              <span
                                key={comp.id}
                                style={{
                                  fontSize: "0.7rem",
                                  background: "var(--panel-soft)",
                                  color: "var(--primary)",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontWeight: 700,
                                }}
                              >
                                {comp.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontStyle: "italic", marginTop: "4px" }}>
                            Sin competencia asociada
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="admin-item-actions">
                      <button
                        className="ghost-button"
                        onClick={() => handleStartEdit(team)}
                        style={{ padding: "8px 12px" }}
                      >
                        <Edit2 size={13} style={{ marginRight: "4px" }} />
                        Editar
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
