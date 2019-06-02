import index from "./index";
import { request, createServer } from "http";
import listen = require("test-listen");

test("jest is setup", async () => {
  // const server = createServer((req, res) => res.end(1));
  // let url = await listen(server);
  const srv = createServer((req, res) => res.end("1"));
  let url = await listen(srv);

  await request(url, res => {
    console.log(res);

    expect(res.statusCode).toBe(200);
  });

  expect(true).toBeTruthy();
});
