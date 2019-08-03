import { parse } from "url";
import { IncomingMessage, ServerResponse } from "http";
import { fetchRecentlyClosedPullRequests } from "weekly-summary-typescript";
import * as sgMail from "@sendgrid/mail";
import { IPullRequestsForRepos } from "weekly-summary-typescript/dist/github";
import * as marked from "marked";

export default async function(
  req: IncomingMessage,
  res: ServerResponse,
  pullRequestFetcher = fetchRecentlyClosedPullRequests,
  emailer = sgMail
) {
  console.log("Running schedule for generating Weekly Summary");

  const queryData = parse(req.url, true).query;
  console.log(`Received the following query parameters: `);
  console.log(queryData);

  let organization = queryData.organization || "";
  if (organization.length == 0) {
    res.statusCode = 400;
    res.end("Must provide 'organization' query parameter.");
    return;
  } else if (Array.isArray(organization)) {
    organization = organization[0];
  }

  let to = queryData.to || "";
  if (Array.isArray(to)) {
    to = to.join(",");
  }
  console.log("Requesting Pull Requests");
  let recentlyClosedPullRequests: IPullRequestsForRepos;
  try {
    recentlyClosedPullRequests = await pullRequestFetcher({
      organization
    });
  } catch (e) {
    res.statusCode = 400;
    res.end(`Failed to fetch pull requests. Received: ${e}`);
    return;
  }

  console.log("Received Pull Requests. Generating e-mail.");
  const markdownBody = convertPullRequestsToMarkdown(
    recentlyClosedPullRequests
  );
  const htmlBody = marked(markdownBody);

  await sendEmail({
    to: to,
    textBody: markdownBody,
    htmlBody: htmlBody,
    emailer: emailer
  });

  res.end(htmlBody);
}

function convertPullRequestsToMarkdown(
  pullRequests: IPullRequestsForRepos
): string {
  console.log("Converting Pull Request limit to Markdown");

  return Object.entries(pullRequests).reduce(
    (emailBody, [repoName, pullRequests]) => {
      emailBody += `# ${repoName}\n\n`;

      pullRequests.forEach(pullRequest => {
        emailBody += `* ${pullRequest.title} (${pullRequest.url})\n`;
      });
      emailBody += "\n";

      return emailBody;
    },
    ""
  );
}

async function sendEmail({
  to,
  textBody,
  htmlBody,
  emailer
}: {
  to: string;
  textBody: string;
  htmlBody: string;
  // @sengrid/mail did not export the `MailService` type, but that's what this should be
  emailer: any;
}) {
  if (!process.env.SENDGRID_API_KEY || to.length == 0) {
    console.log(
      "SendGrid is not set up, or no `to` addresses specified. " +
        "Skipping sending email."
    );
    return;
  }

  console.log("Sending email");

  emailer.setApiKey(process.env.SENDGRID_API_KEY);

  const email = {
    to: to,
    from: "weekly-summary-cron@example.com",
    subject: `Weekly Summary - ${new Date().toDateString()}`,
    text: textBody,
    html: htmlBody
  };

  const emailResponse = await emailer.send(email);

  console.log(`Sent email. Response: `);
  console.log(emailResponse);

  return emailResponse;
}
