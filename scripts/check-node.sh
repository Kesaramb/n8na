#!/usr/bin/env bash
set -euo pipefail
REQ='^v(20\.19(\.[0-9]+)?|22\.[0-9]+(\.[0-9]+)?|23\.[0-9]+(\.[0-9]+)?|24\.[0-9]+(\.[0-9]+)?)$'
node -v | grep -Eq "$REQ" || {
  echo "Unsupported Node $(node -v). Need >=20.19 and <=24.x"
  exit 1
}