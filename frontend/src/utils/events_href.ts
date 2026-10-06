type EventsHrefFilters = {
  query?: string;
  categoryId?: number;
  page?: number;
};

export function buildEventsHref({
  query,
  categoryId,
  page,
}: EventsHrefFilters) {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (categoryId) {
    params.set('categoria', String(categoryId));
  }

  if (page && page > 1) {
    params.set('pagina', String(page));
  }

  const search = params.toString();

  return `/${search ? `?${search}` : ''}#eventos`;
}
