const routes = (handler) => [
  {
    method: 'POST',
    path: '/threads',
    handler: handler.postThreadHandler,
    options: {
      auth: 'forumapi_jwt',
    },
  },
  {
    method: 'GET',
    path: '/threads/{threadId}',
    handler: handler.getThreadByIdHandler,
  },
  {
    method: 'DELETE',
    path: '/threads/{threadId}',
    handler: handler.deleteThreadByIdHandler,
    options: {
      auth: 'forumapi_jwt',
    },
  },
];

module.exports = routes;
