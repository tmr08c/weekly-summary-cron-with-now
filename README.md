# Weekly Summary Cron with Now

[![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/tmr08c/weekly-sumary-cron-with-now&env=GITHUB_AUTH_TOKEN&env=SENDGRID_API_KEY)

This application uses [Now](https://zeit.co) to produce a [lambda](https://zeit.co/docs/v2/deployments/concepts/lambdas) that will generate a markdown-friendly list of recently closed pull requests for [ROI Revolution](https://github.com/roirevolution/).

## Development

```bash
npm run dev
```

## Deployment

```bash
npm run deploy
```

This assumes you have [installed Now locally](https://zeit.co/docs/v2/getting-started/installation/) and logged in.
