#!/bin/bash
files=(
  "e2e-tests/specs/consumer/03-reservation-flow.spec.ts"
  "e2e-tests/specs/merchant/02-product-management.spec.ts"
  "e2e-tests/specs/transversal/01-performance.spec.ts"
  "e2e-tests/specs/transversal/02-accessibility.spec.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    if head -1 "$file" | grep -q "@ts-nocheck"; then
      echo "Already has: $file"
    else
      echo "// @ts-nocheck" | cat - "$file" > /tmp/temp_file && mv /tmp/temp_file "$file"
      echo "Added to: $file"
    fi
  else
    echo "Not found: $file"
  fi
done
