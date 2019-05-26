import { parse } from "url";
import { IncomingMessage, ServerResponse } from "http";
import { fetchRecentlyClosedPullRequests } from "weekly-summary-typescript";
import * as sgMail from "@sendgrid/mail";

export default async function(req: IncomingMessage, res: ServerResponse) {
  console.log("Running schedule for generating Weekly Summary");

  const queryData = parse(req.url, true).query;
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

  const emailBody = Object.entries(recentlyClosedPullRequests).reduce(
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

  console.log("Generated email body");

  const response = await sendEmail({ to: to, body: emailBody });

  res.end(emailBody);
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
