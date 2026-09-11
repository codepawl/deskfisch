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

export function button(className: string, label: string, onclick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = className;
  b.textContent = label;
  b.onclick = onclick;
  return b;
}
