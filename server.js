const http = require('node:http')
const fs = require('node:fs');
const querystring = require('node:querystring');

const labelString = todo =>
  `<span ${todo.completed ? 'class="completed"' : ''}>${todo.label}</span>`;
const completeButtonString = id =>
  `<button onclick="completeTodo(${id})">Complete</button>`;
const deleteButtonString = id =>
  `<button onclick="deleteTodo(${id})">Delete</button>`;

const todos = (function() {
  let data = [];
  const genId = (() => {
    let id = 0;
    return () => {
      id += 1;
      return id;
    }
  })();
  const get = () => data;
  const add = label => data.push({ id: genId(), label });
  const remove = id => data = data.filter(e => e.id !== id);
  const complete = id => data = data.map(e => e.id === id ? { ...e, completed: true } : e);
  const toHtmlString = () => `
<ul>
  ${get().map(todo => {
    return `<li>${labelString(todo)} ${todo.completed ? "" : completeButtonString(todo.id)} ${deleteButtonString(todo.id)}</li>`;
  }).join('\n  ')}
</ul>
  `;

  return { get, add, remove, complete, toHtmlString };
})();

const server = new http.Server();

const requestHandler = (req, res) => {
  const badRequest = () => {
    res.statusCode = 400;
    res.end('400 Bad Request');
  };
  const notFound = () => {
    res.statusCode = 404;
    res.end('404 Not Found');
  };

  if (req.url === '/') {
    const content = fs.readFileSync('./index.html', { encoding: 'utf8', flag: 'r' });
    res.write(
      content.replace('{IEGUMO_TODO_LIST}', todos.toHtmlString())
    );
    res.end();
  } else if (req.url.match(/\/todos\/?.*/)) {
    if (req.method === 'POST') {
      let chunk = '';
      req.on('data', data => chunk += data);
      req.on('end', () => {
        const { label } = querystring.parse(chunk);
        if (!label) {
          badRequest();
        } else {
          todos.add(label);
          res
            .writeHead(303)
            .end('<head><meta http-equiv="Refresh" content="0; URL=/" /></head>');
        }
      });
    } else if (req.method === 'PUT') {
      const { groups: { id } } = req.url.match(/\/todos\/(?<id>.*)/);
      if (id === undefined) {
        badRequest();
      } else {
        todos.complete(+id);
        res.statusCode = 200;
        res.end('200 OK');
      }
    } else if (req.method === 'DELETE') {
      const { groups: { id } } = req.url.match(/\/todos\/(?<id>.*)/);
      if (id === undefined) {
        badRequest();
      } else {
        todos.remove(+id);
        res.statusCode = 204;
        res.end('204 No Content');
      }
    } else {
      notFound();
    }
  } else {
    notFound();
  }
};

server.addListener('request', requestHandler);

const port = 80;
server.listen({ port }, () => {
  console.log(`server listening at port ${port} `);
});

