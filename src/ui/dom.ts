import { icon, type IconName } from "./icons";

/** Tiny DOM builder: el("div.panel", {onclick}, child, "text"). */
export function el(
  spec: string,
  props: Partial<HTMLElement> = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElement {
  const [tag, ...classes] = spec.split(".");
  const node = document.createElement(tag);
  if (classes.length) node.className = classes.join(" ");
  Object.assign(node, props);
  for (const c of children) {
    if (c == null) continue;
    node.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function button(className: string, label: string, onclick: () => void, iconName?: IconName): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = className;
  if (iconName) b.append(icon(iconName));
  b.append(el("span.label", {}, label));
  b.title = label;
  b.onclick = onclick;
  return b;
}

/** Replace a button's text while keeping its icon. */
export function setLabel(b: HTMLButtonElement, label: string): void {
  b.querySelector(".label")!.textContent = label;
  b.title = label;
}
