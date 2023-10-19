const http = require('node:http')

const server = new http.Server();

const requestHandler = (_, res) => {
  res.write('Hello, internet\n');
  res.end();
};

server.addListener('request', requestHandler);

const port = 80;
server.listen({ port }, () => {
  console.log(`server listening at port ${port}`);
});

