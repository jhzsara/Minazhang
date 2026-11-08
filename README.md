# MINAFLIX

A mobile-first movie and series discovery website for minazhang.nl.

## What it does
- Live movie and TV catalogue powered by TMDB
- Trending, popular, top-rated and search views
- Title details, synopsis, cast and official trailers
- Netherlands-first availability information (stream, free, ads, rent and buy)
- Local-device watchlist
- Responsive layout for phones, tablets and desktop

## Important
MINAFLIX is a discovery guide, not a video-hosting or piracy site. It does not scrape, embed or link to unauthorised streams. It sends viewers to legitimate providers and official trailers. Availability is supplied by TMDB and may change.

## First-time setup
1. Open the deployed site and tap the gear icon.
2. Create a free TMDB account and request an API Read Access Token at https://www.themoviedb.org/settings/api.
3. Paste the token into Catalogue settings and choose your country.
4. Your token is stored in that browser only. It is not committed to GitHub.

TMDB API use is subject to TMDB's terms and attribution requirements. This product uses the TMDB API but is not endorsed or certified by TMDB. Non-commercial use only unless you obtain the appropriate commercial permission.

## Hosting
The repository includes a GitHub Pages Actions workflow and a CNAME file for minazhang.nl. The domain's DNS must point to GitHub Pages and GitHub Pages must be enabled for this repository. DNS is managed at your domain registrar, not in GitHub files.

## Privacy
No account is required. The watchlist and TMDB token are stored locally in the browser. The site does not send them to a custom backend.
