import { IncomingMessage, ServerResponse } from "http";
import { fetchRecentlyClosedPullRequests } from "weekly-summary-typescript";
import * as sgMail from "@sendgrid/mail";

export default async function(req: IncomingMessage, res: ServerResponse) {
  console.log("Running schedule for generating Weekly Summary");

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

  console.log("Generated email body:");
  console.log(emailBody);

  console.log("Figure out how to send the email...");

  sendEmail(emailBody);

  res.end(emailBody);
}

async function sendEmail(emailBody: string) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const email = {
    to: "tmr08c@gmail.com",
    from: "weekly-summary-cron@example.com",
    subject: `Weekly Summary - ${new Date().toDateString()}`,
    text: emailBody
  };

  await sgMail.send(email);
}
