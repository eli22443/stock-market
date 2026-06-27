#!/usr/bin/env bash
#
# Fetch production environment variables from AWS SSM Parameter Store and write
# backend/.env for systemd + python-dotenv.
#
# Required EC2 IAM permission:
#   ssm:GetParametersByPath on arn:aws:ssm:<region>:<account>:parameter/stock-market/prod/*
#
# Usage:
#   sudo -u ec2-user BACKEND_DIR=/home/ec2-user/stock-market/backend ./fetch-env.sh

set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-north-1}"
SSM_PATH="${SSM_PATH:-/stock-market/prod/}"
BACKEND_DIR="${BACKEND_DIR:-/home/ec2-user/stock-market/backend}"
ENV_FILE="${ENV_FILE:-${BACKEND_DIR}/.env}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required. Install awscli-2 and retry." >&2
  exit 1
fi

mkdir -p "$(dirname "${ENV_FILE}")"
tmp_file="$(mktemp)"

aws ssm get-parameters-by-path \
  --path "${SSM_PATH}" \
  --with-decryption \
  --recursive \
  --region "${AWS_REGION}" \
  --query "Parameters[].{Name:Name,Value:Value}" \
  --output json \
  | python3 -c '
import json
import os
import sys

params = json.load(sys.stdin)
for param in sorted(params, key=lambda item: item["Name"]):
    key = os.path.basename(param["Name"])
    value = param["Value"]
    escaped = value.replace("\\", "\\\\").replace("\"", "\\\"")
    print(f"{key}=\"{escaped}\"")
' > "${tmp_file}"

cat >> "${tmp_file}" <<'EOF'
HOST=127.0.0.1
PORT=8000
EOF

install -m 600 "${tmp_file}" "${ENV_FILE}"
rm -f "${tmp_file}"

echo "Wrote ${ENV_FILE} from ${SSM_PATH} in ${AWS_REGION}"