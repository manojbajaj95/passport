# Agent Passport — Identity Registration Skill

How to generate an Ed25519 identity, derive a `did:key` DID, build a `metadata.json`, and register with the Agent Passport API.

---

## Concepts

| Term | What it is |
|---|---|
| **Private key** | 32-byte Ed25519 secret. Never leaves the agent. |
| **DID** | `did:key:z6Mk…` — encodes the public key directly. No resolver needed. |
| **Handle** | `adverb-adjective-noun` — assigned by the registry at registration, e.g. `swiftly-golden-fox`. |
| **metadata.json** | Local file the agent keeps alongside its private key. |

### DID encoding

```
Ed25519 public key (32 bytes)
  → prepend multicodec prefix: 0xed 0x01
  → base58btc encode  (Bitcoin alphabet, 'z' prefix = base58btc in multibase)
  → "did:key:z" + encoded string
```

---

## metadata.json

Create this file alongside your private key. The `did` field is required for registration; all others are optional but recommended.

```json
{
  "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "name": "Research Concierge",
  "description": "Gathers sources and prepares cited briefs.",
  "ownerEmail": "owner@example.com"
}
```

| Field | Required | Notes |
|---|---|---|
| `did` | yes | Derived from your Ed25519 public key |
| `handle` | no | Request a specific handle/slug (e.g. `my-cool-agent`). Must be lowercase alphanumeric and hyphens. Assigned if available. |
| `name` | no | Human-readable display name |
| `description` | no | What this agent does |
| `ownerEmail` | no | If set, a claim link is emailed so a human can take ownership |

---

## Registration API

```
POST /api/passport/register
Content-Type: application/json

{
  "did": "did:key:z6Mk...",
  "handle": "my-cool-agent",             // optional
  "name": "Research Concierge",          // optional
  "description": "Gathers sources...",   // optional
  "ownerEmail": "owner@example.com"      // optional
}
```

**Success — HTTP 201:**
```json
{
  "did": "did:key:z6Mk...",
  "handle": "my-cool-agent",
  "status": "UNCLAIMED"
}
```

Save the `handle` — it's your public-facing slug for lookups and JWT verification.

**Error codes:**

| Code | HTTP | Meaning |
|---|---|---|
| `invalid_did` | 400 | DID format not recognized (must be `did:key:z6Mk`) |
| `invalid_handle` | 400 | Requested handle contains invalid characters |
| `did_already_registered` | 409 | DID exists; generate a new keypair |
| `handle_already_taken` | 409 | Requested handle is already registered |

---

## Examples

### Bash

Uses `openssl` for key generation and a small Python snippet for base58btc encoding (no native base58 in shell tools).

```bash
#!/usr/bin/env bash
set -euo pipefail

PASSPORT_URL="${PASSPORT_URL:-http://localhost:3000}"

# 1. Generate Ed25519 keypair
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# 2. Extract raw 32-byte public key (DER minus the 12-byte SPKI header)
openssl pkey -in private.pem -pubout -outform DER \
  | tail -c 32 > public.raw

# 3. Derive did:key  (multicodec prefix 0xed 0x01 + base58btc)
DID=$(python3 - <<'PYEOF'
import sys, base64

BASE58_ALPHABET = b'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

def b58encode(data: bytes) -> str:
    n = int.from_bytes(data, 'big')
    result = []
    while n:
        n, r = divmod(n, 58)
        result.append(BASE58_ALPHABET[r:r+1])
    # leading zero bytes → leading '1's
    for byte in data:
        if byte == 0:
            result.append(b'1')
        else:
            break
    return b''.join(reversed(result)).decode()

with open('public.raw', 'rb') as f:
    pub = f.read()

prefixed = bytes([0xed, 0x01]) + pub
print('did:key:z' + b58encode(prefixed))
PYEOF
)

echo "DID: $DID"

# 4. Write metadata.json
cat > metadata.json <<JSON
{
  "did": "$DID",
  "name": "My Agent",
  "description": "Does useful things.",
  "ownerEmail": "owner@example.com"
}
JSON

# 5. Register
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PASSPORT_URL/api/passport/register" \
  -H "Content-Type: application/json" \
  -d @metadata.json)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

echo "HTTP $HTTP_CODE"
echo "$BODY"

# 6. Extract and save handle
HANDLE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['handle'])")
echo "HANDLE=$HANDLE" >> .env.agent
echo "DID=$DID" >> .env.agent
echo "Registered as: $HANDLE"
```

---

### Python

Requires: `cryptography` (`pip install cryptography`)

```python
import json
import os
import httpx  # pip install httpx
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import (
    Encoding, PublicFormat, PrivateFormat, NoEncryption
)

BASE58_ALPHABET = b'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

def b58encode(data: bytes) -> str:
    n = int.from_bytes(data, 'big')
    result = []
    while n:
        n, r = divmod(n, 58)
        result.append(BASE58_ALPHABET[r:r+1])
    for byte in data:
        if byte == 0:
            result.append(b'1')
        else:
            break
    return b''.join(reversed(result)).decode()

def did_from_public_key(pub_bytes: bytes) -> str:
    prefixed = bytes([0xed, 0x01]) + pub_bytes
    return 'did:key:z' + b58encode(prefixed)

PASSPORT_URL = os.environ.get('PASSPORT_URL', 'http://localhost:3000')

# 1. Generate keypair
private_key = Ed25519PrivateKey.generate()
public_key  = private_key.public_key()

# 2. Extract raw 32-byte public key
pub_bytes = public_key.public_bytes(Encoding.Raw, PublicFormat.Raw)

# 3. Persist private key
priv_bytes = private_key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
with open('private.key', 'wb') as f:
    f.write(priv_bytes)
os.chmod('private.key', 0o600)

# 4. Derive DID
did = did_from_public_key(pub_bytes)
print(f'DID: {did}')

# 5. Write metadata.json
metadata = {
    'did': did,
    'name': 'My Agent',
    'description': 'Does useful things.',
    'ownerEmail': 'owner@example.com',  # remove if no owner
}
with open('metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

# 6. Register
resp = httpx.post(f'{PASSPORT_URL}/api/passport/register', json=metadata)
resp.raise_for_status()
data = resp.json()
print(f'Handle : {data["handle"]}')
print(f'Status : {data["status"]}')

# 7. Persist identity
identity = {'did': did, 'handle': data['handle']}
with open('identity.json', 'w') as f:
    json.dump(identity, f, indent=2)
```

---

### Node.js

Requires: `@noble/ed25519 @scure/base` (`npm install @noble/ed25519 @scure/base`)

```js
import { generatePrivateKey, getPublicKey } from '@noble/ed25519'
import { base58 } from '@scure/base'
import { writeFileSync } from 'fs'

const PASSPORT_URL = process.env.PASSPORT_URL ?? 'http://localhost:3000'

// 1. Generate keypair
const privateKey = generatePrivateKey()
const publicKey  = await getPublicKey(privateKey)

// 2. Derive did:key
function didFromPublicKey(pub) {
  const prefixed = new Uint8Array(2 + pub.length)
  prefixed[0] = 0xed
  prefixed[1] = 0x01
  prefixed.set(pub, 2)
  return `did:key:z${base58.encode(prefixed)}`
}

const did = didFromPublicKey(publicKey)
console.log('DID:', did)

// 3. Persist private key (hex)
writeFileSync('private.key', Buffer.from(privateKey).toString('hex'), { mode: 0o600 })

// 4. Write metadata.json
const metadata = {
  did,
  name: 'My Agent',
  description: 'Does useful things.',
  ownerEmail: 'owner@example.com',  // remove if no owner
}
writeFileSync('metadata.json', JSON.stringify(metadata, null, 2))

// 5. Register
const resp = await fetch(`${PASSPORT_URL}/api/passport/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(metadata),
})

if (!resp.ok) {
  const err = await resp.json()
  throw new Error(`Registration failed (${resp.status}): ${err.error}`)
}

const data = await resp.json()
console.log('Handle:', data.handle)
console.log('Status:', data.status)

// 6. Persist identity
writeFileSync('identity.json', JSON.stringify({ did, handle: data.handle }, null, 2))
```

---

## After Registration

The registry assigns a handle (e.g. `swiftly-golden-fox`) and sets status to `UNCLAIMED`.

**If `ownerEmail` was provided:** a 24-hour claim link is sent. The human clicks it (or `POST /api/passport/claim` with the token) to transition status to `CLAIMED`.

**Verify the passport anytime:**
```bash
curl $PASSPORT_URL/api/passport/swiftly-golden-fox
```

**Get an identity token** (proves key ownership via challenge-response):
```bash
# Step A: request a nonce
curl -X POST $PASSPORT_URL/api/passport/challenge \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6Mk..."}'

# Step B: sign the nonce bytes and exchange for a JWT
curl -X POST $PASSPORT_URL/api/passport/token \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6Mk...","nonce":"<hex-nonce>","signature":"<base64-sig>"}'
```

See the full challenge-response flow in `docs/specs/agent-passport-spec.md`.

---

## Security Rules

- The private key **never leaves the agent** — only signatures over nonces are transmitted.
- Store `private.key` with mode `0600` and never commit it.
- If a DID is already registered (`409`), generate a fresh keypair — do not reuse the old one.
- `UNCLAIMED` is normal post-registration. Only `CLAIMED` means ownership is verified.
