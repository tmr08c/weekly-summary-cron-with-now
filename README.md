# Weekly Summary Cron with Now

[![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/tmr08c/weekly-sumary-cron-with-now&env=GITHUB_AUTH_TOKEN&env=SENDGRID_API_KEY)

This application uses [Now](https://zeit.co) to produce a [lambda](https://zeit.co/docs/v2/deployments/concepts/lambdas) that will generate a markdown-friendly list of recently closed pull requests for a given organization.

## API

This appliation will creat a lambda that responds to HTTP GET requests, and takes in the following query parameters:

### `organization`

* **Required**
* String

This organization for which you which to fetch the last week of closed Pull Requests for. The `GITHUB_AUTH_TOKEN` provided must have access to the specified organization. 

### `to`

* Optional
* String
* Comma separated list of email addresses 

If provided, the function will send a copy of the generated list of recently closed Pull Requests to the email addresses specified. Email is sent using [SendGrid](https://sendgrid.com/) and requires `SENDGRID_API_KEY` to be set.

## Development

```bash
npm run dev
```

### Environmental Variables

See [`.env.example`](https://github.com/tmr08c/weekly-sumary-cron-with-now/blob/master/.env.example) for a list of environmental variables to set.

#### Local

For local development, you can use a `.env` file:

```bash
cp .env.example .env
```

#### Production

For production, we use [Zeit Now's secrets](https://zeit.co/docs/v2/deployments/environment-variables-and-secrets#securing-environment-variables-using-secrets). See [`now.json`](https://github.com/tmr08c/weekly-sumary-cron-with-now/blob/master/now.json#L5) for a list of secrets to set.

## Deployment

```bash
npm run deploy
```

This assumes you have [installed Now locally](https://zeit.co/docs/v2/getting-started/installation/) and logged in.

### Reccomendation 

Rather than manually checking the endpoint for the list of recently closed Pull Requests, we suggest leveraging [EasyCron](https://www.easycron.com/) to periodically hit you Now endpoint with a `to` query paramter to send yourself the list via email on your own schedule.
