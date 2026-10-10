// Plain-text content replacement shared by React and legacy HTML pages.
export const PREVIEW_KEY = "chanray:content-preview:v1";
export const normalizeText = (value) => value.replace(/\s+/g, " ").trim();
export function translateText(value, overrides) {
  if (typeof value !== "string") return value;
  const key = normalizeText(value);
  if (!Object.hasOwn(overrides, key)) return value;
  const start = value.match(/^\s*/)?.[0] || "";
  const end = value.match(/\s*$/)?.[0] || "";
  return start + overrides[key] + end;
}
export function createContentTranslator(root, initial = {}) {
  let overrides = initial;
  let stopped = false;
  const textState = new WeakMap();
  const attributeState = new WeakMap();
  const attributes = ["placeholder", "title", "alt", "aria-label"];
  const excluded = "script,style,textarea,input,[data-user-content],[data-cms-exempt]";
  const excludedText = (element) => !element || Boolean(element.closest(excluded));
  function text(node) {
    if (excludedText(node.parentElement)) return;
    const saved = textState.get(node);
    const original = saved && node.data === saved.last ? saved.original : node.data;
    const next = translateText(original, overrides);
    textState.set(node, { original, last: next });
    if (node.data !== next) node.data = next;
  }
  function attrs(element) {
    if (element.closest("[data-user-content],[data-cms-exempt]")) return;
    const names =
      element.tagName === "META" &&
      /description|keywords|author|og:title|og:description|twitter:title|twitter:description/.test(
        element.getAttribute("name") || element.getAttribute("property") || "",
      )
        ? [...attributes, "content"]
        : attributes;
    let saved = attributeState.get(element);
    if (!saved) {
      saved = new Map();
      attributeState.set(element, saved);
    }
    for (const name of names) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      const previous = saved.get(name);
      const original = previous && current === previous.last ? previous.original : current;
      const next = translateText(original, overrides);
      saved.set(name, { original, last: next });
      if (current !== next) element.setAttribute(name, next);
    }
  }
  function scan(target) {
    if (stopped) return;
    if (target.nodeType === 3) {
      text(target);
      return;
    }
    if (target.nodeType === 1) attrs(target);
    const doc = target.ownerDocument || target;
    const walker = doc.createTreeWalker(target, 1 | 4);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === 3) text(node);
      else attrs(node);
    }
  }
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") for (const child of mutation.addedNodes) scan(child);
      else if (mutation.type === "characterData") text(mutation.target);
      else attrs(mutation.target);
    }
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...attributes, "content"],
  });
  scan(root);
  return {
    update(next) {
      overrides = next;
      scan(root);
    },
    stop() {
      observer.disconnect();
      overrides = {};
      scan(root);
      stopped = true;
    },
  };
}
export function readPreview(storage) {
  try {
    const saved = JSON.parse(storage.getItem(PREVIEW_KEY) || "null");
    if (
      !saved ||
      Date.now() - saved.createdAt > 60 * 60 * 1000 ||
      !saved.overrides ||
      Array.isArray(saved.overrides)
    )
      return null;
    return saved.overrides;
  } catch {
    return null;
  }
}
