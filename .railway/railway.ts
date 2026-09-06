// Railway Infrastructure as Code: railway config plan | apply
//
// An apply deletes every resource this file does not declare, so link it to a
// project dedicated to this template.
//
// No secrets to export: the proxy reads its credentials from the bucket below,
// so they follow a key rotation on their own.

import { bucket, defineRailway, github, project, service } from "railway/iac";

const REPO = "FournyP/aws-s3-public-proxy-railway-template";

// Matched by name, so keep these identical to Railway: a mismatch is a
// delete and recreate, not a rename.
const PROXY_SERVICE = "aws-s3-public-proxy";
const BUCKET = "Bucket";

export default defineRailway(() => {
  // Regions are immutable. Changing this means a new bucket and a copy.
  const store = bucket(BUCKET, { region: "iad" });

  const proxy = service(PROXY_SERVICE, {
    source: github(REPO, { branch: "main" }),
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    deploy: { healthcheckPath: "/health" },
    env: {
      // Buckets expose no typed refs to the DSL, so these are literal ones. The
      // names on the right are Railway's, not the AWS SDK's: BUCKET is the S3
      // name, RAILWAY_BUCKET_NAME is the display name and will not work.
      AWS_ACCESS_KEY_ID: `\${{${BUCKET}.ACCESS_KEY_ID}}`,
      AWS_SECRET_ACCESS_KEY: `\${{${BUCKET}.SECRET_ACCESS_KEY}}`,
      AWS_S3_BUCKET_NAME: `\${{${BUCKET}.BUCKET}}`,
      AWS_ENDPOINT_URL: `\${{${BUCKET}.ENDPOINT}}`,
      AWS_DEFAULT_REGION: `\${{${BUCKET}.REGION}}`,

      // Railway Buckets and AWS address by subdomain; some MinIO setups do not.
      S3_FORCE_PATH_STYLE: "false",

      // Sent on every response.
      CACHE_CONTROL: "public, max-age=300",

      // A single origin locks it down; empty sends no CORS headers at all.
      ACCESS_CONTROL_ALLOW_ORIGIN: "*",
    },
  });

  return project("AWS S3 Public Proxy", { resources: [store, proxy] });
});
