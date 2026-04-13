# AWS S3 Public Proxy Railway Template

A tiny Go HTTP proxy that publicly serves read-only objects from a private S3-compatible bucket (Railway Buckets, AWS S3, MinIO, Tigris, R2, …). No presigned URLs, no redirects — requests return `200` with the object bytes streamed through.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/aws-s3-public-proxy?referralCode=C3Uv6n&utm_medium=integration&utm_source=template&utm_campaign=generic)

## 🏗️ Architecture

```
anonymous client ──GET /path/to/file──► proxy (Go, public) ──SigV4──► S3 bucket (private)
                                              │
                                              ▼
                                      200 + file bytes
```

One service, one binary, one bucket. The proxy holds the S3 credentials; callers only need the URL.

## ✨ Features

- **Anonymous read-only.** Only `GET` and `HEAD` are accepted. `PUT`/`POST`/`DELETE` return `405`. No listing endpoint.
- **Streamed bytes, not redirects.** Works for any HTTP client (curl, fetch, server-side, mobile) — no browser required.
- **Stable URLs.** `GET /foo/bar.jpg` always maps to key `foo/bar.jpg`. Same file = same URL forever.
- **Forwards metadata.** `Content-Type`, `Content-Length`, `ETag`, `Last-Modified` are passed through.
- **Conditional requests.** `If-None-Match` / `If-Match` are forwarded to S3 so CDNs and clients can cache efficiently.
- **Configurable `Cache-Control`** for CDN-friendly responses.
- **Small, production-friendly Docker image.** Multi-stage build on distroless, non-root, ~10 MB.

## 💁‍♀️ How to use

1. Click the Railway button 👆 (or deploy this repo as a new Dockerfile service)
2. Attach it to your Railway Bucket: reference the bucket's variables directly (see [`.env.example`](./.env.example))
3. Deploy! 🚄
4. Call the proxy:
   ```bash
   curl https://<your-proxy-domain>/path/to/file.jpg --output file.jpg
   ```

## 🔧 Variables

| Variable | Required | Description |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | yes | Access key. For Railway Buckets, reference `${{Bucket.AWS_ACCESS_KEY_ID}}`. |
| `AWS_SECRET_ACCESS_KEY` | yes | Secret. For Railway Buckets, reference `${{Bucket.AWS_SECRET_ACCESS_KEY}}`. |
| `AWS_S3_BUCKET_NAME` | yes | Bucket name. For Railway Buckets, reference `${{Bucket.AWS_S3_BUCKET_NAME}}`. |
| `AWS_ENDPOINT_URL` | yes | S3 endpoint URL. For Railway Buckets, reference `${{Bucket.AWS_ENDPOINT_URL}}`. For real AWS, use `https://s3.<region>.amazonaws.com`. |
| `AWS_DEFAULT_REGION` | no | Region (default `auto`). For AWS use `us-east-1`/`eu-west-3`/etc. |
| `S3_FORCE_PATH_STYLE` | no | `true` to use path-style addressing (some MinIO setups). Default `false`. |
| `CACHE_CONTROL` | no | `Cache-Control` header value (default `public, max-age=300`). |
| `PORT` | no | HTTP listen port. Railway injects this automatically (default `8080`). |

## 🧪 Run locally

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_S3_BUCKET_NAME=...
export AWS_ENDPOINT_URL=https://...
export AWS_DEFAULT_REGION=auto

go run .
# or
docker build -t s3-public-proxy .
docker run --rm -p 8080:8080 --env-file .env s3-public-proxy
```

Test:
```bash
curl -i http://localhost:8080/some-key.png
curl -I http://localhost:8080/some-key.png   # HEAD — headers only
curl -X POST http://localhost:8080/some-key.png   # → 405
```

## 📝 Notes

- **Public by design.** Anyone who knows the key can fetch the file. Do not put this in front of a bucket that contains sensitive objects.
- **No listing.** There is no endpoint to enumerate keys. Callers must already know the object path.
- **Credentials stay server-side.** Clients never see S3 credentials or presigned URLs.
- **Health check.** `GET /health` returns `200 ok` for Railway / uptime probes.
- **CDN in front works well.** The stable URL + `ETag` + `Cache-Control` + conditional request forwarding make this cache-friendly.

## 🔒 Hardening ideas (not included by default)

- Rate limit per IP (middleware)
- Path allowlist (regex on keys)
- HMAC-signed URLs (`?sig=...`) if you later want revocable links
- Put Cloudflare / Bunny / CloudFront in front for caching + DDoS protection

## License

MIT
