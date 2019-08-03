import index from "./index";
import { createServer, IncomingMessage, ServerResponse } from "http";
import listen from "test-listen";
import request from "request-promise-native";
import { RequestError } from "request-promise-native/errors";
import { createRequest, createResponse, MockResponse } from "node-mocks-http";
import { IPullRequestsForRepos } from "weekly-summary-typescript/dist/github";

// @sendgrid/mail did not export a class or interface to reference in the mock
// this constant implements what we need based on the current implementation:
// https://github.com/tmr08c/weekly-sumary-cron-with-now/blob/f993897c67dcadfd39e23ac240d5803adc651326/node_modules/@sendgrid/mail/src/mail.d.ts#L6
const mockEmailer = {
  setApiKey: jest.fn(),
  setSubstitutionWrappers: jest.fn(),
  send: jest.fn(),
  sendMultiple: jest.fn(),
  MailService: {
    setApiKey: jest.fn(),
    setSubstitutionWrappers: jest.fn(),
    send: jest.fn(),
    sendMultiple: jest.fn()
  }
};

// There is a guard clause before we send the email to make sure we have the API key set
// Set the environment variable to test the email sending logic
process.env.SENDGRID_API_KEY = "fake-api-key";

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

test("emailing using a single `to` query parameter", async () => {
  const req: IncomingMessage = createRequest({
    url: "www.example.com?organization=my-org&to=email1@example.com"
  });

  let resp: MockResponse<ServerResponse> = createResponse();
  const mockFetcher = jest.fn();
  mockFetcher.mockResolvedValue({});

  await index(req, resp, mockFetcher, mockEmailer);

  expect(resp.statusCode).toBe(200);
  expect(mockEmailer.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: "email1@example.com" })
  );
});

test("emailing using a multiple items in the `to` query parameter (separated by ',')", async () => {
  const req: IncomingMessage = createRequest({
    url:
      "www.example.com?organization=my-org&to=email1@example.com,email2@example2.com"
  });

  let resp: MockResponse<ServerResponse> = createResponse();
  const mockFetcher = jest.fn();
  mockFetcher.mockResolvedValue({});

  await index(req, resp, mockFetcher, mockEmailer);

  expect(resp.statusCode).toBe(200);
  expect(mockEmailer.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: "email1@example.com,email2@example2.com" })
  );
});

test("emailing using a multiple `to` query parameters", async () => {
  const req: IncomingMessage = createRequest({
    url:
      "www.example.com?organization=my-org&to=email1@example.com&to=email2@example2.com"
  });

  let resp: MockResponse<ServerResponse> = createResponse();
  const mockFetcher = jest.fn();
  mockFetcher.mockResolvedValue({});

  await index(req, resp, mockFetcher, mockEmailer);

  expect(resp.statusCode).toBe(200);
  expect(mockEmailer.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: "email1@example.com,email2@example2.com" })
  );
});

test("emails have a reasonable subject that includes the date", async () => {
  const req: IncomingMessage = createRequest({
    url: "www.example.com?organization=my-org&to=email@example.com"
  });

  let resp: MockResponse<ServerResponse> = createResponse();
  const mockFetcher = jest.fn();
  mockFetcher.mockResolvedValue({});

  await index(req, resp, mockFetcher, mockEmailer);

  expect(resp.statusCode).toBe(200);
  expect(mockEmailer.send).toHaveBeenCalledWith(
    expect.objectContaining({
      subject: expect.stringMatching(
        new RegExp(/weekly summary.*\w \d{1,2} \d{4}/i)
      )
    })
  );
});
