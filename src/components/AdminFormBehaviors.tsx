"use client";

import { useEffect } from "react";

export function AdminFormBehaviors() {
  useEffect(() => {
    const updatePhaseFields = () => {
      const format = document.querySelector<HTMLSelectElement>("#phase-format-select");
      const stage = document.querySelector<HTMLElement>("#stage-field-container");
      const group = document.querySelector<HTMLElement>("#group-field-container");
      const container = document.querySelector<HTMLElement>("#phase-conditional-container");
      if (!format || !stage || !group || !container) return;

      const stageSelect = stage.querySelector("select");
      const groupInput = group.querySelector("input");
      const isLeague = format.value === "LEAGUE";
      const isKnockout = format.value === "KNOCKOUT";
      container.style.display = isLeague ? "none" : "grid";
      stage.style.display = "grid";
      group.style.display = isKnockout ? "none" : "grid";
      if (stageSelect) stageSelect.disabled = isLeague;
      if (groupInput) groupInput.disabled = isLeague || isKnockout;
    };

    const updateTeamFields = () => {
      const select = document.querySelector<HTMLSelectElement>("#team-name-select");
      const nameContainer = document.querySelector<HTMLElement>("#new-team-name-container");
      const nameInput = document.querySelector<HTMLInputElement>("#new-team-name-input");
      const logoContainer = document.querySelector<HTMLElement>("#new-team-logo-container");
      const logoInput = document.querySelector<HTMLInputElement>("#new-team-logo-input");
      if (!select || !nameContainer || !nameInput || !logoContainer || !logoInput) return;

      const isNew = select.value === "__NEW__";
      nameContainer.style.display = isNew ? "grid" : "none";
      logoContainer.style.display = isNew ? "grid" : "none";
      nameInput.required = isNew;
      nameInput.disabled = !isNew;
      logoInput.disabled = !isNew;
    };

    const handleChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.matches("#phase-format-select")) updatePhaseFields();
      if (target.matches("#team-name-select")) updateTeamFields();
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".add-match-btn")) {
        event.stopPropagation();
      }
    };

    updatePhaseFields();
    updateTeamFields();
    document.addEventListener("change", handleChange);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("change", handleChange);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
