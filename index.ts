import { IncomingMessage, ServerResponse } from "http";
import { fetchRecentlyClosedPullRequests } from "weekly-summary-typescript";

export default async function(req: IncomingMessage, res: ServerResponse) {
  console.log("Running schedule for generating Weekly Summary");

  console.log("Requesting Pull Requests");
  const recentlyClosedPullRequests = await fetchRecentlyClosedPullRequests({
    organization: "roirevolution"
  })

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

  res.end(emailBody);
}
