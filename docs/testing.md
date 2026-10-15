# Testing

## 1. Principles

1. **Verify what the user sees.** Assert the text, behavior and calls a user or a caller can observe, not the implementation of a function. No snapshot tests.
2. **Test names describe behavior**, not the function: `it("실시간 값이 없거나 통신이 끊기면 오프라인")`. Test names in this project are written in Korean.
3. **Keep logic pure and separated from React.** Health and state resolution, route search, permission decisions, formatting and form mapping live in plain functions, so they can be tested without a browser.
4. **Add tests for new logic**: value mappers and validation, state/health decisions, simulator rules, mock API behavior, formatters, date and unit calculations, anything that breaks silently. 3D scenes, canvas charts and whole pages are checked by hand.
5. **Record a known bug with the correct expectation and `it.fails`**, with a comment that describes the bug. When the bug is fixed the runner reports an unexpected pass and the marker is removed.
6. **When no test exists for a change, verify by hand**: open the screen in `pnpm dev` and check the normal, error and empty-list states, and report the result as it is.
7. **Report honestly.** Done means lint, type check (`pnpm typecheck`), build and the relevant tests pass. Failures and skipped items are reported, never hidden.
8. **Never copy secrets into documents or tests**: use placeholders for passwords and tokens. The demo accounts are public and listed in [README.md](../README.md).

## 2. Unit tests (Vitest)

Current setup: Vitest runs in the Node environment and collects `**/*.test.ts` under `src` (`test` block in `vite.config.ts`). There is no jsdom, no Testing Library and no component-test helper, so `*.test.tsx` files are not collected.

| Command | Description |
|---|---|
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Watch mode |

Existing tests:

| File | Covers |
|---|---|
| `core/types/robot.test.ts` | Robot health resolution (`resolveRobotHealth`) |
| `mock/fleet/graph.test.ts` | Waypoint graph (`WaypointGraph`) |
| `mock/fleet/simulator.test.ts` | Fleet simulator rules (missions, elevators, charging, faults) |
| `mock/assistant.test.ts` | The mock AI assistant's answers |
| `mock/aiChatApi.test.ts` | Mock chat API: per-user history, paging |

### Writing tests

- Put the test next to the code: `robot.ts` → `robot.test.ts`.
- Import `describe`, `it`, `expect` (and `vi`, hooks) from `vitest`; there are no globals.
- Imports use the app's aliases (`core`, ...) as in `vite.config.ts`; relative imports are fine inside a folder.
- Tests run in Node: there is no `window` or `localStorage`. A test that needs storage passes a small in-memory stub (see `createStorage` in `mock/aiChatApi.test.ts`) instead of touching globals.
- API behavior is tested through the real `fetch` against the MSW handlers: `setupServer(...handlers)` from `msw/node` with `server.listen({ onUnhandledRequest: "error" })` in `beforeAll` and `server.close()` in `afterAll` (see `mock/aiChatApi.test.ts`). Use `server.use(...)` to override a response for one test.
- Stub the fleet simulator with `vi.mock("./fleet", ...)` when a test only needs the API handlers.
- Do not wait on real time; drive clocks explicitly (fake timers or the simulator's own tick) so tests stay fast and deterministic.
- Keep tests independent: build their own data and do not rely on the order of other tests or on the seed data of `mock/db.ts` beyond what the test asserts.

### Adding component tests

Not set up. Introducing them means adding `jsdom` and Testing Library as dev dependencies, extending `test.include` to `*.test.tsx`, and agreeing on the support modules first. Until then, keep logic out of components (principle 3) and check screens by hand.

## 3. e2e

There is no browser-driven e2e suite. Whole-screen behavior (3D map, charts, flyouts, permissions per role) is verified by hand with `pnpm dev` using the three demo accounts.
