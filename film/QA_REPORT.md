# QA report: LeadTime film (v2: Ava voice, live 60 fps recording)

File: `out/film.mp4` (captions burned in). Captions are also in `captions/film.srt`.

## How the footage was made
All product shots come from **one continuous 60 fps screen recording** of the live site (https://leadtime-liard.vercel.app) in a real Brave tab at full screen. The recording used Desktop Duplication + NVENC (`capture/rec/take.mkv`, git-ignored; transcoded to `public/clips/take.mp4`). The demo was driven by a single in-page script launched through Claude in Chrome. That script used the app's real buttons, real smooth scrolling, and a real map-click event at 4.5° N 90.5° E.

Every action was logged with its time, aligned to the video by a magenta sync frame at 3.133 s (`src/take.json`).

Brave's "Claude is debugging this browser" bar was visible for the first 25.8 s, and Claude's "working" glow and pill for the first ~22 s. Every shot from that period is cropped inside the page area (x 16–1400, y ≥ 150), so neither appears in the film. After 25.8 s the screen is completely clean.

The on-screen cursor is drawn by the film at the logged click positions and times, because in-page clicks don't move the OS pointer. Two stretches are sped up and labelled on screen:
- "SPED UP 2× · AFTER PRESSING MAX"
- "SPED UP 2× · SIMULATING 15 EARTHQUAKES"

## Checks
| Check | Method | Result |
|---|---|---|
| Format | `ffprobe` | H.264 High, 1920×1080, **60 fps**, yuv420p, TV range, bt709; AAC 48 kHz. ✅ |
| Duration | `ffprobe` | 2:08.4 (the rules recommend about 2–3 minutes). ✅ |
| Every second watched | 1 fps contact sheets (`out/qa/c60_1..4.jpg`) | No Claude UI, no empty frames, no transition collisions. The cursor and highlights land on their spoken words. ✅ |
| Black / frozen / silent | `blackdetect`, `freezedetect d=4`, `silencedetect −45 dB d=2` | None. ✅ |
| Loudness | `ebur128 peak=true` | −16.0 LUFS integrated, −1.5 dBTP. ✅ |
| Voice vs script | `scripts/asr_check.py` (faster-whisper) | The transcript matches the script. "err" is heard as "air" (correct pronunciation) and "Simeulue" as "simulu". ✅ |
| Caption sync | same, 49 phrases | median +0.016 s (range −0.74…+0.23 s; Whisper's phrase-start jitter). ✅ |
| Facts | `VOICEOVER_SCRIPT.md` → Fact sources | Every number traces to captured page text, the live recording or the sourced JSON files. ✅ |

## Render notes
The full background render was twice stopped by Claude Code because system memory was low. The final film was therefore rendered as six foreground chunks (one process each), joined losslessly, then muxed with a soundtrack. The soundtrack was mixed with ffmpeg from the same narration clips and music bed at the timeline's positions, then mastered (`loudnorm`).

## Known limitations
- **The voice is synthetic** (Ava, Microsoft Edge neural TTS). Pacing and pronunciation were checked by transcript and spectrogram comparison, **not by ear**.
- **The music is original** (`scripts/audio.py`) and was checked by meters only.
- **The optimizer's first-sensor figure** shows 53.0 M in this Brave recording, versus 52.9 M in headless Chromium (last-bit floating-point differences). The narration says "about 53 million".
- **No caption-free copy yet.** Re-run the chunked render with `--props='{"captions":false}'` if one is needed.
