// Etaplar kampanya sırasını izler; perde değişiminde yeni bir etap başlar.
export function journeyPages(ids, levels, size = 5) {
  const pages = [];
  ids.forEach((id, index) => {
    const world = levels[index].world || 'Gece Vadisi';
    let page = pages.at(-1);
    if (!page || page.world !== world || page.ids.length >= size) {
      page = { world, ids: [], start: index };
      pages.push(page);
    }
    page.ids.push(id);
  });
  return pages;
}

export function journeyPageFor(pages, id) {
  return Math.max(0, pages.findIndex((page) => page.ids.includes(id)));
}
