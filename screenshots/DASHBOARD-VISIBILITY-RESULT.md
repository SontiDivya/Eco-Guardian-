# Dashboard visibility — verification record

## Request
> "if user logins dashbroard should not be appear"

A signed-in **regular user** must not see the Dashboard section or its
navigation link.

## What was changed
| File | Change |
|---|---|
| `backend/templates/index.html` | added `id="navDashboard"` to the Dashboard nav link |
| `backend/static/style.css` | added `#dashboard[hidden] { display: none; }` |
| `backend/static/script.js` | `setNavForRole(account)` now derives `signedIn`, `isAdmin` and `hideDashboard = signedIn && !isAdmin`, toggling both the nav link and the section |

## Bug found and fixed
The first edit declared a second `const dashboardSection` in `script.js`,
but one already existed at line 221 (used by the scroll observer). Node
reported `SyntaxError: Identifier 'dashboardSection' has already been
declared`, and because the whole script failed to parse, **none** of the
role-based visibility code ran — which is why the first browser check still
showed the dashboard. The duplicate declaration was removed and the existing
one reused.

## Verification matrix (measured with `getComputedStyle(...).display`)

| State | Nav links | `#dashboard` | About / Eco Tips / Report Issue | Hero button |
|---|---|---|---|---|
| Signed out (visitor) | Home · About · Dashboard · Eco Tips · Report Issue · Track · Contact | **visible** | visible | Report an Issue → `#report` |
| Signed in as **user** | Home · About · Track · Contact | **hidden** | visible | Report an Issue → `#report` |
| Signed in as **admin** | Home · Dashboard · Track · Contact · Admin | **visible** | hidden | Update Report → `/admin` |

## Checks run
- `node --check static/script.js` → passes (after the duplicate-const fix)
- Flask restarted on port 5000; `id="navDashboard"` present in served HTML
- Browser: all three states above measured directly; console clean
- Temporary test accounts deleted; 7 user accounts and 4 reports untouched