# KIT.md — Editor Prototype Run and Handover Kit

**Status:** discovery-first. The README links to an AI Studio app but does not establish editor features or supported file formats.

## Read first
- `README.md`
- `package.json`, lockfile, source entry points and tests
- file import/export paths, persistence, permissions, network calls and licence

## Requirements artefacts
Identify supported content types, import/edit/save/export behaviour, expected fidelity, size limits, persistence model, error recovery, privacy/data flow and acceptance criteria. Test that the editor does not silently lose or alter user content.

## Setup
README documents Node.js, `npm install`, `.env.local` with `GEMINI_API_KEY`, and `npm run dev`. Verify the runtime, scripts and lockfile first. Do not commit API keys or expose them in browser-delivered code. Confirm whether the editor actually needs an external API before configuring one.

## Procedure
1. Inspect source, file-handling code and dependencies.
2. Use a disposable test file, never the only copy of a valuable artefact.
3. Test open/import, a small edit, save/export, reopen and round-trip comparison where supported.
4. Test empty, malformed and unsupported files plus interrupted operations.
5. Check whether data is stored locally or transmitted externally.
6. Record exact steps, observed limitations and recovery method.
7. Provide a sample fixture and expected result only if licensing permits.

## Acceptance
- [ ] Supported formats and boundaries are documented.
- [ ] A basic edit/save/reopen journey is verified.
- [ ] File integrity is checked where applicable.
- [ ] Error and recovery behaviour is recorded.
- [ ] Privacy, persistence and API dependencies are clear.
- [ ] No real user data or credentials are committed.