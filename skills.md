# Agent Passport Registration

Agents should register themselves with this Agent Passport service when they need a durable, human-readable identity record for demos, audits, or ownership verification.

This flow is modeled after the agent-owned identity pattern described by `https://agent.email/skill.md`: an agent signs up with a human owner, receives credentials or an identity record, contacts the human to claim it, and then checks status.

## When to Register

Register when:

- You are acting as a long-running agent that should be identifiable across sessions.
- A human asks you to create, claim, or show your agent identity.
- You need a public key and passport record that another system or person can inspect.

Do not register repeatedly for the same agent unless the previous passport was lost, revoked, or explicitly replaced.

## Registration Flow

1. Generate a readable Agent ID in this format:

   ```text
   agnt_<adverb>-<adjective>-<noun>
   ```

   Example:

   ```text
   agnt_swiftly-silver-beacon
   ```

2. Generate an Ed25519 keypair locally.

   Keep the private key secret. Never send it to this API. Only send the public key as base64.

3. Register the passport:

   ```bash
   curl -X POST http://localhost:3000/api/passport/register \
     -H "Content-Type: application/json" \
     -d '{
       "agentId": "agnt_swiftly-silver-beacon",
       "publicKey": "BASE64_PUBLIC_KEY",
       "ownerEmail": "human@example.com",
       "name": "Research Concierge",
       "description": "A research agent that gathers sources and prepares cited briefs.",
       "tags": {
         "env": "demo",
         "team": "research"
       }
     }'
   ```

4. Save the returned `passportId` and status.

   ```json
   {
     "passportId": "agnt_swiftly-silver-beacon",
     "status": "UNCLAIMED"
   }
   ```

5. Ask the human owner to claim the passport.

   In local development, when `RESEND_API_KEY` is not configured, the magic claim link is printed in the server logs. In production, it is emailed to `ownerEmail`. The claim link uses the request `Origin` header as its base URL, falling back to `http://localhost:3000`.

6. Claim by opening the magic link or by POSTing the token:

   ```bash
   curl -X POST http://localhost:3000/api/passport/claim \
     -H "Content-Type: application/json" \
     -d '{"token": "CLAIM_TOKEN"}'
   ```

7. Verify the passport:

   ```bash
   curl http://localhost:3000/api/passport/agnt_swiftly-silver-beacon
   ```

   Or show it in the browser:

   ```text
   http://localhost:3000/passport/agnt_swiftly-silver-beacon
   ```

## Endpoint Notes

- `POST /api/passport/register` requires `agentId`, `publicKey`, and `ownerEmail`.
- `agentId` may use the readable format `agnt_<adverb>-<adjective>-<noun>` or the legacy format `agnt_<16 lowercase hex characters>`.
- Duplicate `agentId` values return `409` with `Agent ID already registered`; generate a new readable ID and retry once.
- A successful registration returns HTTP `201` with `{ "passportId": "...", "status": "UNCLAIMED" }`.
- `GET /api/passport/<passportId>` returns the passport record and masks the owner email, for example `m***@gmail.com`.
- `UNCLAIMED` after registration is expected until the owner opens the magic link or submits the claim token.

## Rules

- Never expose or transmit the private key.
- Use a readable Agent ID, not a random hex suffix.
- Use the human owner’s real email only with their consent.
- If registration fails because the ID already exists, generate a new readable ID and retry once.
- If the claim token expires, register a new passport or ask the service operator to issue a new claim flow.
- Treat `CLAIMED` as the only verified ownership state. `UNCLAIMED` means the passport exists but the owner has not confirmed it.

## Status Meanings

- `UNCLAIMED`: Passport exists, but ownership has not been verified.
- `CLAIMED`: Human owner verified the claim token.
- `REVOKED`: Passport should no longer be trusted.
