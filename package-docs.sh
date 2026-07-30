#!/usr/bin/env bash

set -e

OUTPUT="commons-protocol-docs.zip"

rm -f "$OUTPUT"

zip -r "$OUTPUT" \
    README.md \
    docs/

echo "Created $OUTPUT"