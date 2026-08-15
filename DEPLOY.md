# Deploying brazilboogie.com

The live site is **https://brazilboogie.com**.

## How it is wired

| Piece | Where |
|---|---|
| Source of truth | `outputs/project-trillionaire/` in the workspace repo |
| Generator | `build.py`, run it after any edit |
| Deploy repo | `callie-rounds-media/brazil-boogie` on GitHub |
| Hosting | GitHub Pages off `main`, HTTPS enforced |
| Domain | `brazilboogie.com`, registered at Cloudflare 2026-08-13, $10.46/yr |
| DNS | Cloudflare: four A records to GitHub's IPs plus a www CNAME, all **DNS only**, never proxied |

The deploy repo holds only the built site. `build.py`, `area.json`, `forms/`,
the source images and the internal tools are deliberately excluded.

## To deploy a change

```bash
cd outputs/project-trillionaire
python3 build.py

# stage a clean copy of just the public files
STAGE=$(mktemp -d)
rsync -a --exclude='images/source' --exclude='images/area/_sourced' \
  --exclude='images/hosts/_src' --exclude='images/img-*.jpg' --exclude='build.py' \
  --exclude='forms' --exclude='grade-editor.html' --exclude='preview-mobile.html' \
  --exclude='transfers' --exclude='area.json' --exclude='financials' \
  ./ "$STAGE/"

cd "$STAGE"
echo "brazilboogie.com" > CNAME        # required, Pages drops the domain without it
git init -q && git checkout -q -b main
git add -A && git -c user.name="Callie Rounds" -c user.email="callierounds@gmail.com" \
  commit -q -m "site update"
git remote add origin https://github.com/callie-rounds-media/brazil-boogie.git
git push -q -u origin main --force
```

Then wait for it to go live:

```bash
until curl -s https://brazilboogie.com/ | grep -q "SOME NEW STRING"; do sleep 6; done
```

## Traps

- **The CNAME file must exist in the deploy repo.** Without it GitHub drops the
  custom domain and the site falls back to the github.io address.
- **DNS must stay on "DNS only", the grey cloud.** Proxying through Cloudflare
  stops GitHub validating the domain and the certificate will not renew.
- **If the certificate ever fails,** detach and re-attach the domain. That is what
  fixed it the first time:
  `gh api -X PUT repos/callie-rounds-media/brazil-boogie/pages -f cname=""`
  then the same call with `-f cname=brazilboogie.com`.
- Always hard refresh before believing a change did not deploy. Several
  "it is broken" reports were browser cache.
