import index from "./index";
import { createServer, IncomingMessage, ServerResponse } from "http";
import listen = require("test-listen");
import * as request from "request-promise-native";
import { RequestError } from "request-promise-native/errors";
import { createRequest, createResponse, MockResponse } from "node-mocks-http";
import { IPullRequestsForRepos } from "weekly-summary-typescript/dist/github";

test("requests fail if 'organization' is not provided", async () => {
  const server = createServer(index);
  const url = await listen(server);

  await request(url).catch((error: RequestError) => {
    expect(error.response.statusCode).toEqual(400);
    expect(error.message).toMatch(new RegExp(/provide.*organization/));
  });

  server.close();
});

test("organization getting passed correctly", async () => {
  const req: IncomingMessage = createRequest({
    url: "www.example.com?organization=my-org"
  });
  let resp: MockResponse<ServerResponse> = createResponse();
  const mockFetcher = jest.fn();
  const fakePullRequests: IPullRequestsForRepos = {
    "my-repo-1": [
      {
        closedAt: new Date(),
        createdAt: new Date(),
        merged: true,
        repository: {
          name: "my-repo-1"
        },
        title: "my first PR",
        url: "www.example.com/1"
      }
    ]
  };
  mockFetcher.mockResolvedValue(fakePullRequests);

  await index(req, resp, mockFetcher);

  expect(resp.statusCode).toBe(200);

  const responseBody = resp._getData();

  expect(responseBody).toMatch(new RegExp(/h1.*my-repo-1.*h1/));
  expect(responseBody).toMatch(new RegExp(/li.*my first PR.*li/));
});
