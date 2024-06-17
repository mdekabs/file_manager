import mongoose from 'mongoose';

const ITEMS_PER_PAGE = 20;

async function paginate(model, query, page, itemsPerPage = ITEMS_PER_PAGE, baseUrl) {
  const totalItems = await model.countDocuments(query);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const items = await model
    .find(query)
    .skip(page * itemsPerPage)
    .limit(itemsPerPage);

  const links = {
    self: `${baseUrl}?page=${page}&parentId=${query.parentId || '0'}`,
    first: `${baseUrl}?page=0&parentId=${query.parentId || '0'}`,
    last: `${baseUrl}?page=${totalPages - 1}&parentId=${query.parentId || '0'}`,
  };

  if (page > 0) {
    links.prev = `${baseUrl}?page=${page - 1}&parentId=${query.parentId || '0'}`;
  }

  if (page < totalPages - 1) {
    links.next = `${baseUrl}?page=${page + 1}&parentId=${query.parentId || '0'}`;
  }

  return {
    items,
    page,
    totalItems,
    totalPages,
    links,
  };
}

export default paginate;
