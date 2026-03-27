# MP3 Cleanup Web App (Proof of Concept)

This repo now includes a small local Flask web app for preparing one MP3 at a time for an original iPod 5.5 workflow.

## Render deployment

This app is set up for a first public demo on Render using:

- Python web service runtime
- `gunicorn` as the production process
- Render's native environment for `ffmpeg` support
- `render.yaml` for repeatable service configuration

### Render start command

```bash
gunicorn --bind 0.0.0.0:$PORT app:app
```

### Files used for Render

- `render.yaml`
- `requirements.txt`
- `app.py`

### Deploy from GitHub to Render

1. Push this repository to GitHub.
2. Sign in to [Render](https://render.com/).
3. Click `New +` and choose `Blueprint`.
4. Connect your GitHub account if Render prompts you.
5. Select the repository that contains this app.
6. Render will detect `render.yaml` and show a `swagpods` web service plan.
7. Review the service settings and click `Apply`.
8. Wait for the initial build to finish.
9. Open the generated Render URL once the service shows as live.

### Manual Render settings if you do not use Blueprint

Create a new `Web Service` with:

- Runtime: `Python`
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
gunicorn --bind 0.0.0.0:$PORT app:app
```

- Health Check Path: `/`
- Environment Variable:

```text
PYTHON_VERSION=3.11.11
```

### Important Render notes

- The Render config assumes Render's native Python environment, which already provides the system tools this demo needs.
- Render's filesystem is ephemeral, so uploaded originals and exported files are not permanent across deploys or restarts.
- This setup is intended for a first public demo, not durable storage.
- If you want uploaded/exported media to persist, add a persistent disk or external object storage later.

## UI Attribution

The current SwagPods front-end presentation is an adaptation/reference implementation inspired by Tanner Villarete's MIT-licensed `ipod-classic-js` simulator. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution and the preserved MIT notice.

What it does:
- Uploads one MP3 file
- Reads embedded MP3 metadata when present
- Falls back to a conservative filename guess when metadata is missing
- Lets you edit `Title`, `Artist`, `Album`, and `Genre`
- Exports a new cleaned MP3 copy with updated embedded metadata
- Preserves the original uploaded file

## Local setup

Create a local virtual environment and install dependencies:

```bash
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

## Run the app

Start the local server:

```bash
./.venv/bin/python app.py
```

Then open:

```text
http://127.0.0.1:5001
```

## Output locations

- Original uploaded copy: `/Users/patrickkelker/Documents/New project/uploads/originals`
- Cleaned exported copy: `/Users/patrickkelker/Documents/New project/exports/cleaned`

If you restart the server, upload the file again before exporting. The proof of concept keeps the active upload in memory while the app is running.

## Test flow

1. Start the app.
2. Open `http://127.0.0.1:5001`.
3. Choose one `.mp3` file.
4. Click `Upload MP3`.
5. Review or edit `Title`, `Artist`, `Album`, and `Genre`.
6. Click `Export Clean File`.
7. Confirm the success message shows the full saved path.
8. Open `/Users/patrickkelker/Documents/New project/exports/cleaned` to inspect the new MP3.

## Notes

- This proof of concept supports MP3 only.
- It does not modify the original uploaded file.
- Filename guessing is intentionally conservative:
  - `Artist - Title.mp3` -> guesses `Artist` and `Title`
  - `Artist - Album - Title.mp3` -> guesses `Artist`, `Album`, and `Title`
  - `SingleName.mp3` -> guesses `Title` only

# Apple TV Batch Retagger (iPod classic friendly)

This script batch-updates MP4/M4V metadata from filenames so Apple TV and iTunes-style sync workflows can sort episodes correctly.

It writes:
- `TV Show` (`tvsh`)
- `Season Number` (`tvsn`)
- `Episode Number` (`tves`)
- `Episode Title` (`©nam`)
- `Media Type = TV Show` (`stik=10`)

## 1) Install dependency

```bash
pip3 install mutagen
```

## 2) Dry-run first (no files changed)

```bash
python3 retag_videos.py "/path/to/videos" --recursive
```

## 3) Apply tags

```bash
python3 retag_videos.py "/path/to/videos" --recursive --apply
```

## 4) Process in chunks (optional)

Useful for testing with a small batch first:

```bash
python3 retag_videos.py "/path/to/videos" --recursive --limit 50 --apply
```

## Filename formats supported

Examples the parser understands:
- `Show Name - S02E05 - Episode Title.m4v`
- `Show.Name.S02E05.Episode.Title.mp4`
- `Show Name Season 2 Episode 5 Episode Title.m4v`
- `Show Name - 2x05 - Episode Title.mp4`

## Apple TV app note

Apple TV can cache metadata for already-imported items. After retagging files:
- Remove and re-add the retagged files in TV/iTunes, or
- Refresh/reimport the Home Videos library source.

For iPod classic sync, ensure files remain MP4/M4V with compatible codecs.

## iPod Size Reduction

The batch converter now supports lower-bitrate presets so new output can be much smaller:

```bash
./scripts/ipod_convert_and_tag.sh --quality compact --fast
```

Available presets:
- `legacy`: previous higher-size settings
- `balanced`: smaller than legacy with moderate headroom
- `compact`: default smaller setting aimed at fitting more content
- `very-compact`: most aggressive built-in preset

You can also override the bitrates directly:

```bash
./scripts/ipod_convert_and_tag.sh --video-bitrate 700 --audio-bitrate 96 --maxrate 840 --bufsize 1680 --fast
```

To estimate what bitrate budget is needed for a full-library target such as 400 GB:

```bash
./scripts/ipod_capacity_report.sh --target-gb 400 --audio-bitrate 96
```

To recompress already-finished iPod files into a separate output folder first:

```bash
./scripts/recompress_ipod_library.sh --quality compact
```

For a small test batch before committing to a full re-encode:

```bash
./scripts/recompress_ipod_library.sh --quality compact --limit 10
```

## Spotify Playlist -> Local Library Pipeline

This repo now includes a metadata-only Spotify pipeline:

- Reads a Spotify playlist through the Spotify Web API
- Exports playlist metadata to local JSON
- Matches Spotify tracks to files already on your external SSD
- Repairs tags for matched files
- Stages results into:
  - `READY_FOR_IMPORT`
  - `REVIEW_REQUIRED`
  - `MISSING_FROM_LIBRARY`

Important:
- It does **not** download Spotify audio
- It uses Spotify only for metadata and playlist structure
- Reports keep Spotify URLs so the data can link back to Spotify

Run it like this:

```bash
python3 scripts/spotify_playlist_local_library_pipeline.py \
  "https://open.spotify.com/playlist/YOUR_PLAYLIST_ID" \
  --spotify-client-id "$SPOTIFY_CLIENT_ID" \
  --library-root "/Volumes/4 tb backup/MUSIC" \
  --output-root "/Volumes/4 tb backup/codex ipod ready 500gb/spotify_playlist_pipeline" \
  --final-import-root "/Volumes/4 tb backup/codex ipod ready 500gb/music/READY_FOR_IMPORT"
```

Useful flags:
- `--embed-artwork`: embed Spotify cover art into staged matched files
- `--transfer-mode copy|move|hardlink|symlink`: control how staged files are materialized
- `--duplicate-check-root /path/to/library`: scan extra libraries before import
- `--dry-run`: build the report without modifying or staging files

Outputs:
- `playlist_metadata.json`: playlist structure and Spotify metadata
- `reports/pipeline_report.json`: full matching, duplicate, and staging report

## Spotify Connection Setup

1. Create a Spotify app:
   Use the Spotify Developer Dashboard at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and create an app for SwagPods.

2. Add the redirect URI:
   In your Spotify app settings, add the exact callback URL used by this app.
   Local example:
   `http://127.0.0.1:5001/spotify/callback`
   Render example:
   `https://swagpods.onrender.com/spotify/callback`

3. Set these environment variables:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_REDIRECT_URI`
   - `SPOTIFY_SCOPES`
   - `FLASK_SECRET_KEY`

   Example scopes for playlist read + remote control:
   `playlist-read-private playlist-read-collaborative user-read-playback-state user-read-currently-playing user-modify-playback-state`

4. Test locally:
   Start the app, open the site, go to `Spotify` in the emulator, and select `Connect Spotify`.
   Spotify should prompt for sign-in and consent, then return to your site and show:
   - `Spotify Connected`
   - your Spotify profile name
   - your playlists
   - `Now Playing` remote controls

Notes:
- Spotify playback control works only against an active Spotify playback device.
- In practice, the user should start playback in the Spotify app first, then use SwagPods as the remote.
