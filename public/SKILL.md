# Agent Passport — Identity Registration Skill

How to generate an Ed25519 identity, derive a `did:key` DID, and register with the Agent Passport API.

---

## Concepts

| Term | What it is |
|---|---|
| **Private key** | 32-byte Ed25519 secret. Never leaves the agent. |
| **DID** | `did:key:z6Mk…` — encodes the public key directly. No resolver needed. |
| **Handle** | `adverb-adjective-noun` — assigned by the registry at registration, e.g. `swiftly-golden-fox`. |

### DID encoding

```
Ed25519 public key (32 bytes)
  → prepend multicodec prefix: 0xed 0x01
  → base58btc encode  (Bitcoin alphabet, 'z' prefix = base58btc in multibase)
  → "did:key:z" + encoded string
```

---

## Output files

Every language example produces exactly these two files:

| File | Contents | Permissions |
|---|---|---|
| `agent.key` | Hex-encoded 32-byte Ed25519 private key | `0600` — never commit |
| `agent.json` | Registration response saved verbatim | Safe to share |

`agent.json` is the full registration response written directly to disk:

```json
{
  "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "handle": "swiftly-golden-fox",
  "name": "My Agent",
  "description": "Does useful things.",
  "ownerEmail": "owner@example.com",
  "status": "UNCLAIMED",
  "createdAt": "2026-05-11T10:00:00.000Z"
}
```

---

## Registration API

```
POST /api/passport/register
Content-Type: application/json

{
  "did": "did:key:z6Mk...",
  "name": "My Agent",           // optional
  "description": "...",         // optional
  "ownerEmail": "owner@example.com"  // optional — triggers claim email
}
```

**Success — HTTP 201** (full record returned, write directly as `agent.json`):
```json
{
  "did": "did:key:z6Mk...",
  "handle": "swiftly-golden-fox",
  "name": "My Agent",
  "description": "Does useful things.",
  "ownerEmail": "owner@example.com",
  "status": "UNCLAIMED",
  "createdAt": "2026-05-11T10:00:00.000Z"
}
```

**Error codes:**

| Code | HTTP | Meaning |
|---|---|---|
| `invalid_did` | 400 | DID format not recognized (must start with `did:key:z6Mk`) |
| `did_already_registered` | 409 | DID exists; generate a new keypair |

---

## Examples

### Bash

Uses `openssl` for key generation and an inline Python snippet for base58btc encoding.

```bash
#!/usr/bin/env bash
set -euo pipefail

PASSPORT_URL="${PASSPORT_URL:-http://localhost:3000}"
AGENT_NAME="${AGENT_NAME:-My Agent}"
AGENT_DESC="${AGENT_DESC:-Does useful things.}"
OWNER_EMAIL="${OWNER_EMAIL:-owner@example.com}"

# 1. Generate Ed25519 keypair
openssl genpkey -algorithm ed25519 -out _priv.pem 2>/dev/null
openssl pkey -in _priv.pem -pubout -outform DER 2>/dev/null | tail -c 32 > _pub.raw

# 2. Derive did:key and hex private key via inline Python
read DID PRIV_HEX < <(python3 - <<'PYEOF'
BASE58_ALPHABET = b'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

def b58encode(data):
    n = int.from_bytes(data, 'big')
    result = []
    while n:
        n, r = divmod(n, 58)
        result.append(BASE58_ALPHABET[r:r+1])
    for byte in data:
        if byte == 0: result.append(b'1')
        else: break
    return b''.join(reversed(result)).decode()

with open('_pub.raw', 'rb') as f:
    pub = f.read()

import subprocess
der = subprocess.check_output(['openssl', 'pkey', '-in', '_priv.pem', '-outform', 'DER'])
priv = der[-32:]

prefixed = bytes([0xed, 0x01]) + pub
print('did:key:z' + b58encode(prefixed), priv.hex())
PYEOF
)

# 3. Save agent.key (hex, mode 0600)
printf '%s' "$PRIV_HEX" > agent.key
chmod 600 agent.key
rm -f _priv.pem _pub.raw

# 4. Register and write response directly as agent.json
BODY=$(printf '{"did":"%s","name":"%s","description":"%s","ownerEmail":"%s"}' \
  "$DID" "$AGENT_NAME" "$AGENT_DESC" "$OWNER_EMAIL")

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PASSPORT_URL/api/passport/register" \
  -H "Content-Type: application/json" -d "$BODY")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
RESP_BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" != "201" ]; then
  echo "Registration failed ($HTTP_CODE): $RESP_BODY" >&2; exit 1
fi

echo "$RESP_BODY" | python3 -m json.tool > agent.json

HANDLE=$(echo "$RESP_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['handle'])")
echo "Registered: $HANDLE"
```

---

### Python

Requires: `cryptography httpx` (`pip install cryptography httpx`)

```python
import json, os, httpx
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, PrivateFormat, NoEncryption

BASE58_ALPHABET = b'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

def b58encode(data: bytes) -> str:
    n = int.from_bytes(data, 'big')
    result = []
    while n:
        n, r = divmod(n, 58)
        result.append(BASE58_ALPHABET[r:r+1])
    for byte in data:
        if byte == 0: result.append(b'1')
        else: break
    return b''.join(reversed(result)).decode()

def did_from_public_key(pub: bytes) -> str:
    return 'did:key:z' + b58encode(bytes([0xed, 0x01]) + pub)

PASSPORT_URL = os.environ.get('PASSPORT_URL', 'http://localhost:3000')

# 1. Generate keypair
private_key = Ed25519PrivateKey.generate()
pub_bytes  = private_key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
priv_bytes = private_key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())

# 2. Save agent.key (hex, mode 0600)
with open('agent.key', 'w') as f:
    f.write(priv_bytes.hex())
os.chmod('agent.key', 0o600)

# 3. Register and write response directly as agent.json
resp = httpx.post(f'{PASSPORT_URL}/api/passport/register', json={
    'did': did_from_public_key(pub_bytes),
    'name': 'My Agent',
    'description': 'Does useful things.',
    'ownerEmail': 'owner@example.com',  # remove if no owner
})
resp.raise_for_status()
agent = resp.json()

with open('agent.json', 'w') as f:
    json.dump(agent, f, indent=2)

print(f"Registered: {agent['handle']} ({agent['status']})")
```

---

### Node.js

Requires: `@noble/ed25519 @scure/base` (`npm install @noble/ed25519 @scure/base`)

```js
import { generatePrivateKey, getPublicKey } from '@noble/ed25519'
import { base58 } from '@scure/base'
import { writeFileSync, chmodSync } from 'fs'

const PASSPORT_URL = process.env.PASSPORT_URL ?? 'http://localhost:3000'

// 1. Generate keypair
const privateKey = generatePrivateKey()
const publicKey  = await getPublicKey(privateKey)

// 2. Derive did:key
const prefixed = new Uint8Array(2 + publicKey.length)
prefixed[0] = 0xed; prefixed[1] = 0x01
prefixed.set(publicKey, 2)
const did = `did:key:z${base58.encode(prefixed)}`

// 3. Save agent.key (hex, mode 0600)
writeFileSync('agent.key', Buffer.from(privateKey).toString('hex'))
chmodSync('agent.key', 0o600)

// 4. Register and write response directly as agent.json
const resp = await fetch(`${PASSPORT_URL}/api/passport/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    did,
    name: 'My Agent',
    description: 'Does useful things.',
    ownerEmail: 'owner@example.com',  // remove if no owner
  }),
})
if (!resp.ok) {
  const err = await resp.json()
  throw new Error(`Registration failed (${resp.status}): ${err.error}`)
}
const agent = await resp.json()

writeFileSync('agent.json', JSON.stringify(agent, null, 2))
console.log(`Registered: ${agent.handle} (${agent.status})`)
```

---

## After Registration

**Check status:**
```bash
curl $PASSPORT_URL/api/passport/swiftly-golden-fox
```

**Claim ownership** — if `ownerEmail` was set, a 24-hour link is emailed. The human clicks it, or the token can be submitted directly:
```bash
curl -X POST $PASSPORT_URL/api/passport/claim \
  -H "Content-Type: application/json" \
  -d '{"token": "CLAIM_TOKEN"}'
```

**Get an identity token** (proves key ownership via challenge-response):
```bash
# Step A — request a nonce
curl -X POST $PASSPORT_URL/api/passport/challenge \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6Mk..."}'

# Step B — sign the nonce and exchange for a JWT
curl -X POST $PASSPORT_URL/api/passport/token \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6Mk...","nonce":"<hex-nonce>","signature":"<base64-sig>"}'
```

---

## Security Rules

- `agent.key` **never leaves the agent** — only signatures over nonces are transmitted.
- Store `agent.key` with mode `0600` and add it to `.gitignore`.
- If a DID is already registered (`409`), generate a fresh keypair — do not reuse the old one.
- `UNCLAIMED` is normal post-registration. Only `CLAIMED` means a human has verified ownership.
