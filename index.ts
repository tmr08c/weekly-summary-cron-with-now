import { parse } from "url";
import { IncomingMessage, ServerResponse } from "http";
import { fetchRecentlyClosedPullRequests } from "weekly-summary-typescript";
import * as sgMail from "@sendgrid/mail";
import { IPullRequestsForRepos } from "weekly-summary-typescript/dist/github";

export default async function(req: IncomingMessage, res: ServerResponse) {
  console.log("Running schedule for generating Weekly Summary");

  const queryData = parse(req.url, true).query;
  console.log(`Received the following query parameters: `);
  console.log(queryData);

  let to = queryData.to || "";
  if (Array.isArray(to)) {
    to = to.join(",");
  }

  console.log("Requesting Pull Requests");
  const recentlyClosedPullRequests = await fetchRecentlyClosedPullRequests({
    organization: "roirevolution"
  });

  console.log("Received Pull Requests. Generating e-mail.");
  const markdownBody = convertPullRequestsToMarkdown(
    recentlyClosedPullRequests
  );

  await sendEmail({ to: to, body: markdownBody });

  res.end(markdownBody);
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

async function sendEmail({ to, body }: { to: string; body: string }) {
  if (!process.env.SENDGRID_API_KEY || to.length == 0) {
    console.log(
      "SendGrid is not set up, or no `to` addresses specified. " +
        "Skipping sending email."
    );
    return;
  }

  console.log("Sending email");

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const email = {
    to: to,
    from: "weekly-summary-cron@example.com",
    subject: `Weekly Summary - ${new Date().toDateString()}`,
    text: body
  };

  const emailResponse = await sgMail.send(email);

  console.log(`Sent email. Response: `);
  console.log(emailResponse);

  return emailResponse;
}
