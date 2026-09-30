"use client";

import type { ChangeEvent } from "react";
import { type ControlProps, inputClasses } from "@/components/ui/Field";

// An empty native date input prints its format mask at full text color, which
// reads as a filled value. data-empty lets the stylesheet mute it; the server
// render sets it from the submitted values, so it is right without JavaScript.
function markEmpty(event: ChangeEvent<HTMLInputElement>) {
  event.currentTarget.dataset.empty = String(event.currentTarget.value === "");
}

export function DateInput({
  name,
  defaultValue,
  ...control
}: ControlProps & { name: string; defaultValue?: string }) {
  return (
    <input
      {...control}
      name={name}
      type="date"
      defaultValue={defaultValue}
      data-empty={!defaultValue}
      onChange={markEmpty}
      className={inputClasses}
    />
  );
}
