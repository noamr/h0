export function renderPagination(root: HTMLElement, {page, totalPages, url}: {page: number, totalPages: number, url: string}) {
const next = page < totalPages ? new URL(url) : null;
const prev = page > 1 ? new URL(url) : null;
if (next)
  next.searchParams.set("page", String(page + 1));
if (prev)
  prev.searchParams.set("page", String(page - 1));

const nextButton = root.querySelector("a#next")!;
const prevButton = root.querySelector("a#prev")!;
if (next)
  nextButton.setAttribute("href", next ? next.href : "#");
if (prev)
  prevButton.setAttribute("href", prev ? prev.href : "#");
}