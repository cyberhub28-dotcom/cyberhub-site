# cyberhub-site

The public website for CyberHub Software, hosted free on GitHub Pages. README.md is excluded from the published site by `_config.yml`.

## Setup
1. Create the public repo `cyberhub28-dotcom/cyberhub-site` and upload `index.html` and `CNAME`.
2. Go to Settings → Pages, choose Source: Deploy from branch `main` / root, and set Custom domain to `cyberhubsoftware.com`.
3. Add the DNS records below. Once the domain check passes, tick **Enforce HTTPS**.
4. Optional, to block domain takeover: verify the domain under GitHub Profile → Settings → Pages → Verified domains. This adds a TXT record.

## DNS records (at Cloudflare, set to "DNS only", the grey cloud)
| Type  | Name | Value |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | cyberhub28-dotcom.github.io |

You can also add AAAA records for @: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153.

## Email: Cloudflare Email Routing (free)
In Cloudflare → Email → Email Routing, turn it on and let it add its records automatically:
- MX @ → route1/route2/route3.mx.cloudflare.net
- TXT @ → `v=spf1 include:_spf.mx.cloudflare.net ~all`

Then add rules that send `support@cyberhubsoftware.com` and `contact@cyberhubsoftware.com` to your private mailbox (not listed here), and verify that destination address.

If you later want a real mailbox that can send (Zoho Mail), replace the MX and SPF records with the ones Zoho gives you, and add Zoho's DKIM TXT record plus a DMARC record (`_dmarc` TXT `v=DMARC1; p=none`).
