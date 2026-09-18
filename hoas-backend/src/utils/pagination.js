// Shared pagination helper for list endpoints.
//
// Usage (backward compatible — no query params = current behavior, everything):
//   const { page, limit, skip } = getPagination(req.query);
//   const query = Model.find(filter).sort({ createdAt: -1 });
//   if (limit) query.skip(skip).limit(limit);
//   const docs = await query;
//   const body = { items: docs };
//   if (limit) body.pagination = await pageMeta(Model, filter, page, limit);
//   res.json(body);
export function getPagination(query = {}, { defaultLimit = 0, maxLimit = 100 } = {}) {
  // defaultLimit 0 = unbounded (legacy behavior). Pass ?limit=N to paginate.
  const rawLimit = query.limit !== undefined ? Number(query.limit) : defaultLimit;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 0), maxLimit) : defaultLimit;
  const rawPage = Number(query.page ?? 1);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  return { page, limit, skip: (page - 1) * limit };
}

export async function pageMeta(model, filter, page, limit) {
  const total = await model.countDocuments(filter);
  return {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}
