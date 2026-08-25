# Buchungstool Update Webhook

This service runs inside Docker on the Synology and is only reachable from the internal Docker network.

The booking app calls `POST http://buchungstool-updater:3050/update` with a bearer token. The updater then:

1. backs up `data/prod.db` to `data/backups/`
2. optionally pulls source from `UPDATE_GIT_REPO`
3. rebuilds and restarts only the `buchungstool` service
4. writes status to `data/update-status.json`

Required environment variable:

```env
ADMIN_UPDATE_TOKEN=change-this-long-random-token
```

Optional environment variables:

```env
UPDATE_GIT_REPO=git@github.com:example/buchungstool.git
UPDATE_GIT_BRANCH=main
UPDATE_GIT_TOKEN=github-token-with-read-access
```
