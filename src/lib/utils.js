import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// For Radix' onCloseAutoFocus (menus, sheets): when they close, Radix moves
// focus back to the element that opened them. If another dialog has opened in
// the meantime (e.g. "Discard unsaved changes?" after choosing a menu item),
// focus must stay in that dialog. Radix doesn't catch this itself: the closing
// layer returns focus before the new dialog's focus trap is active again.
export function keepFocusInOpenedDialog(event) {
  const active = typeof document === "undefined" ? null : document.activeElement
  const dialog = active?.closest?.('[role="dialog"], [role="alertdialog"]')
  if (dialog && !event.currentTarget?.contains(active)) {
    event.preventDefault()
  }
}
