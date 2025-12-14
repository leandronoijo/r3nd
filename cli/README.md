# r3nd CLI

Usage:

- From the project root run `npx r3nd new`.
- The CLI will prompt for backend and frontend choices and copy matching files from the `leandronoijo/r3nd` GitHub `develop` branch into the current working directory.

Notes:

- Install dependencies locally to test faster: run `npm install` inside `cli/`.
- The script uses GitHub's API to list files and then downloads the raw files. If you hit rate limits, set a `GITHUB_TOKEN` env var and update the script to use it.
