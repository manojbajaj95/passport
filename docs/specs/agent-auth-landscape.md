# Agent Authentication: Spec Landscape

A summary of four approaches to agent identity and authentication. Read before making architectural decisions.

---

## 1. AAuth — draft-hardt-oauth-aauth-protocol

**Source:** https://dickhardt.github.io/AAuth/draft-hardt-oauth-aauth-protocol.html  
**Origin:** Dick Hardt (OAuth co-author). Extends OAuth 2.0 idioms for autonomous agents.

### Core Problem
OAuth requires pre-registration and shared secrets. Agents need to discover resources dynamically across org boundaries — pre-registration doesn't scale.

### Identity Model
Each agent has a **keypair-bound identity** (`aauth:local@domain`) issued by an **Agent Provider (AP)**. The public key is published at a well-known URL. Every request is signed using **HTTP Message Signatures (RFC 9421)** — no bearer tokens, no shared secrets, proof-of-possession baked in.

### Key Parties
| Party | Role |
|---|---|
| Agent | HTTP client with cryptographic identity |
| Agent Provider (AP) | Issues agent tokens binding public keys to agent IDs |
| Person Server (PS) | Represents the human, manages consent and governance |
| Resource | API server the agent wants to call |
| Access Server (AS) | Resource's policy engine (optional, federated) |

### Token Types
- **Agent Token** (JWT, `typ: aa-agent+jwt`) — establishes agent identity, includes `cnf` (public key)
- **Resource Token** (JWT, `typ: aa-resource+jwt`) — issued by the resource, describes needed scopes, `aud` = PS or AS
- **Auth Token** (JWT, `typ: aa-auth+jwt`) — issued by PS, grants access, bound to agent's key via `cnf`

### Four Access Modes (incremental adoption)
1. **Identity-Based** — agent signs requests; resource applies own policy. Replaces API keys.
2. **Resource-Managed** — resource handles consent flow, returns opaque `AAuth-Access` token.
3. **PS-Asserted** — resource issues resource token to agent, agent takes it to their PS; PS asserts identity claims (sub, email, groups, roles) back to resource.
4. **Federated** — PS federates with resource's Access Server for policy evaluation.

### Governance (orthogonal to access modes)
- **Mission**: Markdown + structured description of what an agent is authorized to do. Approved by the Person Server, immutable once approved (identified by SHA-256 hash).
- **Mission Log**: Audit trail of all actions within a mission.
- **Permission Endpoint**: Agent requests approval for individual actions.
- **Audit Endpoint**: Agent logs actions taken.

### Key Security Properties
- Proof-of-possession via HTTP Message Signatures — stolen tokens are useless without the private key
- Agent token max 24h; resource tokens max 5 min; auth tokens ~1h
- JWKS published at `{issuer}/.well-known/aauth-agent.json`
- Deferred (202 + polling) pattern for async consent

### How It Differs from OAuth
| | OAuth | AAuth |
|---|---|---|
| Client identity | Per-server `client_id` | Universal keypair identity |
| Secrets | `client_secret` | None (proof-of-possession) |
| Pre-registration | Required | Not required |
| Human governance | Not standard | Native (Mission + Permission + Audit) |
| Autonomous agents | Not supported | First-class |

---

## 2. Agent Auth Protocol — agentauthprotocol.com v1.0-draft

**Source:** https://agentauthprotocol.com/specification/v1.0-draft  
**Origin:** Better Auth team. Pragmatic, implementation-first approach.

### Core Problem
Servers can't distinguish individual agents — all requests under one OAuth client look identical, blocking per-agent auditing, scoping, or revocation. Agents also need to operate autonomously without user browser sessions.

### Identity Model: Host + Agent
- **Host**: A persistent client identity (device, app, runtime) with its own keypair. Analogous to an OAuth client. May be linked to a user.
- **Agent**: An individual runtime actor registered under a host. Each gets its own identity, capability grants, and lifecycle.

This two-level model lets a single host (e.g., Claude Code) run many agents simultaneously, each individually identifiable and revocable.

### Agent Modes
- **Delegated**: agent acts on behalf of a user who granted explicit approval
- **Autonomous**: agent operates without user involvement, approved by server policy

### Agent Lifecycle States
`pending` → `active` → `expired` / `revoked` / `rejected`  
Autonomous agents can also be `claimed` when the host links to a user post-registration.

### Three Lifetime Clocks
Every agent has three independent expiry dimensions:
1. **Session TTL** — inactivity threshold
2. **Max lifetime** — continuous use cap
3. **Absolute lifetime** — hard expiration

### Capabilities and Constraints
**Capabilities** are named authorization units with input/output schemas (think: scopes with schemas).  
**Constraints** narrow capabilities to specific authorized values:
```json
{ "operator": "max", "field": "amount", "value": 1000, "currency": "USD" }
```
Servers must reject unknown constraint operators — silently ignoring them would widen access unintentionally.

### Token Types
- **Host JWT** (`typ: host+jwt`) — authenticates host operations (registration, status checks). Claims: `iss` = JWK thumbprint, `aud` = server URL, `agent_public_key`.
- **Agent JWT** (`typ: agent+jwt`) — authenticates capability execution. Claims: `iss` = host ID, `sub` = agent ID, `aud` = execution URL. Short-lived: max 60 seconds.

### Key Flows
**Registration:**
```
Host JWT POST /agent/register → { agentId, grants | approval_pending }
If pending → user approves via device authorization or CIBA
```

**Execution:**
```
Agent JWT POST /capability/execute { capability, arguments }
→ Server validates JWT, checks grants, validates constraints → executes
```

**Introspection (server-to-server):**
```
POST /agent/introspect → compact grant status
```

### Discovery
`GET /.well-known/agent-configuration` advertises supported modes, approval methods, endpoint URLs, algorithms, default execution location.

### Key Security Properties
- EdDSA over Ed25519 required
- Agent JWTs expire ≤60s — limits revocation window
- `jti` replay detection — servers cache seen values within JWT lifetime
- Revocation cascade — revoking host revokes all its agents
- Optional DPoP (RFC 9449) or mTLS for higher assurance

### How It Differs
| | OAuth | API Keys | Agent Auth |
|---|---|---|---|
| Continuity | Yes (same token) | Weak | Yes (agent lifecycle) |
| Distinctiveness | No (all agents identical) | Yes | Yes (per-agent) |
| Autonomous agents | No | Yes | Yes |
| Revocation | Per token | Per key | Per agent, cascading |
| Scoping | Scopes | None | Capabilities + constraints |

---

## 3. Zerobase Agent Passport

**Source:** https://github.com/zerobase-labs/agent-passport  
**Origin:** Zerobase Labs. Registry-centric approach — a neutral third party vouches for agent identity.

### Core Problem
Apps don't want to implement agent identity from scratch. Agents need a portable identity that works across multiple apps, similar to how "Sign in with Google" works for humans.

### Identity Model: Registry as Trust Anchor
An external registry (Agent Passport) stores agent identities. Apps query the registry to verify agents. The agent proves identity to the registry once; apps then trust the registry's assertion.

### Key Flows

**Agent Registration:**
```
POST /agents/register { publicKey, name, metadata } → { agentId }
```

**Challenge-Response (agent proves key ownership):**
```
POST /agents/{id}/challenge → { nonce }
Sign nonce with private key
POST /agents/{id}/identity-token { nonce, signature } → { token, expiresAt }
```
Tokens are EdDSA-signed JWTs, expire in 60 minutes. Challenges expire in 5 minutes (replay prevention).

**App Verification:**
```
POST /tokens/verify
Headers: X-App-Id, X-App-Key
Body: { token }
→ { valid, agentId, name, risk, humanVerification }
```

**Local Verification (high-throughput):**
```
GET /.well-known/jwks.json → JWKS
jose.jwtVerify(token, JWKS, { issuer: 'agent-passport', algorithms: ['EdDSA'] })
```
Note: local verification skips risk scoring.

**Token Revocation:**
```
POST /tokens/revoke { token } → { revoked, jti, expiresAt }
```
Blocklist entries auto-expire when the original token would have expired.

### Human Verification
Agents can link verified human identities to create an accountability chain:
```
Human (verified) → Agent Passport → Agent
```
Supported providers: GitHub, Google, email, phone, Worldcoin, Civic, Mercle.

```
POST /v1/agents/{id}/human-verification { provider, providerId, displayName }
GET  /v1/agents/{id}/human-verification → { verified, verifications[] }
```
Human verification status surfaces in token verification responses.

### App Registration
Apps register to get `X-App-Id` and `X-App-Key` credentials (Argon2id-hashed server-side). Keys shown only once.

### Rate Limits
| Endpoint | Agent | IP |
|---|---|---|
| `/challenge` | 60/min | 120/min |
| `/identity-token` | 30/min | 60/min |
| `/tokens/verify` | 600/min/app | 120/min |

### Key Security Properties
- Agent private keys never leave the agent — only signatures transmitted
- Tokens expire 60 min, challenges 5 min
- Argon2id for app key storage
- JWKS-based local verification available

### Tradeoffs
| Pro | Con |
|---|---|
| Simple for app builders (one API call) | Single point of failure / trust |
| Portable identity across apps | Requires trusting the registry |
| Human verification support | Centralized; registry can go down |
| Risk scoring built in | Privacy: registry sees all agent interactions |

---

## 4. Decentralized Identifiers (DIDs)

**Source:** W3C DID Core Specification — https://www.w3.org/TR/did-core/  
**Origin:** W3C / W3C Credentials Community Group. Self-sovereign identity standard.

### Core Problem
Traditional identity systems require a central authority to create, maintain, and revoke identifiers. DIDs enable identifiers that are globally unique, resolvable, and cryptographically verifiable — **without any central registry**.

### Core Concepts

**DID (Decentralized Identifier):**
```
did:method:method-specific-identifier
e.g.  did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
      did:web:example.com
      did:ion:EiClkZMDxPKqC9c-umQfTkR...
```

**DID Document:** JSON-LD document returned when resolving a DID. Contains:
- `id` — the DID itself
- `verificationMethod[]` — public keys (JWK or multibase-encoded)
- `authentication[]` — which keys prove control of the DID
- `assertionMethod[]` — which keys sign credentials
- `service[]` — endpoints (e.g., messaging, credential issuance)

**DID Method:** Defines how DIDs are created, resolved, updated, deactivated on a specific substrate:
| Method | Substrate |
|---|---|
| `did:key` | Single keypair (no registry at all; DID encodes the public key) |
| `did:web` | HTTPS — DID document at `https://domain/.well-known/did.json` |
| `did:ion` | Bitcoin (via Sidetree) |
| `did:ethr` | Ethereum |
| `did:peer` | P2P (two parties, no public registry) |

**Verifiable Credentials (VCs):** Signed claims about a DID subject. A "human is verified" credential, for example, would be issued by a trusted authority and cryptographically bound to the agent's DID. Apps verify the credential by resolving the issuer's DID and checking the signature.

### Protocol Flow for Agent Identity
```
1. Agent generates keypair
2. Agent creates DID (e.g., did:key encodes the public key directly)
3. Agent presents DID to app
4. App resolves DID → DID Document → public key
5. Agent signs a challenge with private key
6. App verifies signature against resolved public key
7. (Optional) Agent presents Verifiable Credentials for additional claims
```

### Key Properties
- **Self-sovereign**: no central registry required (for `did:key`, `did:peer`)
- **Portable**: same DID works everywhere that supports the method
- **Interoperable**: W3C standard, broad ecosystem support
- **Key rotation**: DID Document can be updated to reflect new keys (method-dependent)
- **Composable with VCs**: credentials from any issuer can be attached

### Tradeoffs
| Pro | Con |
|---|---|
| No central point of failure | Resolver complexity (different per method) |
| Self-sovereign for agent | `did:key` can't rotate keys (new DID = new identity) |
| Standard VC ecosystem | Blockchain methods have latency / gas costs |
| Portable across any system | Less tooling maturity vs OAuth/JWT ecosystems |
| Human verification via VCs | More moving parts for simple use cases |

---

## Comparison Matrix

| Dimension | AAuth | Agent Auth Protocol | Zerobase Passport | DIDs |
|---|---|---|---|---|
| **Architecture** | Federated (PS-centric) | Centralized per server | Centralized registry | Decentralized |
| **Identity anchor** | Agent Provider | Host + Server | Registry | Keypair / DID Method |
| **Pre-registration** | No | Yes (with server) | Yes (with registry) | No |
| **Key type** | EdDSA recommended | EdDSA (Ed25519 required) | EdDSA | Any (method-dependent) |
| **Token format** | JWTs (custom types) | JWTs (short-lived ≤60s) | EdDSA JWTs | VCs (JWT or JSON-LD) |
| **Human linkage** | Person Server | Host → User link | Human Verification API | Verifiable Credentials |
| **Governance / missions** | Native (Mission + Audit) | None | None | None (VC-based) |
| **Capability scoping** | Scopes + missions | Capabilities + constraints | Scopes | VC claims |
| **Risk scoring** | No | No | Yes | No |
| **Autonomous agents** | Yes | Yes | Yes | Yes |
| **App complexity** | High (4 modes, many parties) | Medium | Low (one API call) | Medium |
| **Standards maturity** | Draft | Draft | Proprietary | W3C Recommendation |
| **Decentralization** | Partial (AP can be self-hosted) | No | No | Full |
