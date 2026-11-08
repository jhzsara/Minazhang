# MINAFLIX — launch checklist

## 1. TMDB catalogue
- Create an account at https://www.themoviedb.org/
- Request an API Read Access Token at https://www.themoviedb.org/settings/api
- Open MINAFLIX → gear icon → paste the token → Save settings
- Choose NL for Netherlands availability

The token is kept in the visitor's browser local storage. Do not paste it into a source file or commit it to GitHub. TMDB's API is subject to its terms, attribution rules and commercial-use restrictions.

## 2. GitHub Pages
The existing GitHub Actions workflow deploys the repository root whenever a commit reaches main. In GitHub, open Settings → Pages and confirm deployment from GitHub Actions is enabled.

## 3. Connect minazhang.nl
The repository CNAME is set to minazhang.nl. At the company where the domain's DNS is managed:
- Add the four GitHub Pages A records for the root domain: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- Optionally add www as a CNAME to jhzsara.github.io
- Remove conflicting old A/AAAA/CNAME records for @ or www
- In GitHub → Settings → Pages, set the custom domain to minazhang.nl and enable Enforce HTTPS once the certificate is ready

DNS changes can take time to propagate. I cannot edit registrar DNS from the GitHub connection.

## 4. What the site does / does not do
MINAFLIX discovers films and series, displays metadata, trailers and legal viewing options returned by TMDB. It does not host films, proxy streams, or surface unauthorised video sources. A title without a listed provider is not playable on this site.

## 5. Before public launch
- Test on mobile and desktop
- Check the region setting
- Review TMDB attribution and terms
- If the site becomes commercial, obtain the required TMDB permission first
