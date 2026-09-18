# Changelog

Notable changes to this template. Entries are named after the change they ship, and the
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Pinned port — 2026-09-18

### Fixed

- `railway.ts` pins `PORT` to `8080` on the proxy service. Railway injects a random `PORT` when the
  variable is unset, so a service created by hand with an explicit domain target port
  could listen on one port while the edge dialled another.

## Infrastructure as Code — 2026-09-06

### Added

- `.railway/railway.ts`, an Infrastructure as Code definition of the project. See
  [Infrastructure as Code](README.md#-infrastructure-as-code).
- CI: `docker-build` builds the image, `iac-typecheck` typechecks `railway.ts`.
- The Bucket is declared with the proxy, so the credentials are references rather than
  copies.

## CORS on every response — 2026-09-03

### Added

- CORS headers on every response, including errors. `ACCESS_CONTROL_ALLOW_ORIGIN`
  defaults to `*`; set a single origin to lock it down, or an empty string to send no
  CORS headers at all.

### Fixed

- Conditional requests return `304`/`412` instead of `502`. `If-None-Match` and
  `If-Match` are forwarded to S3, which answers non-2xx; the proxy previously treated
  that as a failed upstream read instead of mapping it back to the client.
