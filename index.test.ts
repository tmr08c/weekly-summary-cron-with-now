import index from "./index";
import { createServer } from "http";
import listen = require("test-listen");
import * as request from "request-promise-native";
import { RequestError } from "request-promise-native/errors";

test("requests fail if 'organization' is not provided", async () => {
  const server = createServer(index);
  const url = await listen(server);

  await request(url).catch((error: RequestError) => {
    expect(error.response.statusCode).toEqual(400);
    expect(error.message).toMatch(new RegExp(/provide.*organization/));
  });

  server.close();
});
