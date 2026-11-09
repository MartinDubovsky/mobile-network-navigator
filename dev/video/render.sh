#!/bin/bash
# Renders the product video in one language: narration (TTS) → frames → music + mix → subtitles → MP4.
#   dev/video/render.sh en|fr            full render (about 10–15 min); outputs in dev/video/<lang>/out/
#   PREVIEW=15 dev/video/render.sh en    no video: every 15th frame as a still in dev/video/<lang>/stills (quick timeline check)
#   FORCE_TTS=1 …                        synthesise the narration again (otherwise reused when dev/video/<lang>/vo exists)
# Needs: node + playwright (dev/package.json), ffmpeg, python3 with kokoro-onnx, soundfile, numpy, scipy, and the Kokoro model
# files in dev/video/tts/ (or $KOKORO_MODEL / $KOKORO_VOICES) – see CLAUDE.md.
set -e
cd "$(dirname "$0")"
L=${1:-en}
case $L in
 en) VOICE=af_heart; ESL=en-us; ISO=eng; NAME=Mobile-Network-Navigator; TITLE="Mobile Network Navigator – product overview";;
 fr) VOICE=ff_siwis; ESL=fr-fr; ISO=fra; NAME=Mobile-Network-Navigator-FR; TITLE="Mobile Network Navigator – présentation";;
 *) echo "language: en or fr (add a folder with narration.json, a case here and texts in director.js / overlay.js)"; exit 1;;
esac
[ -f demo-probe.pcapng ] || python3 gen_demo.py
if [ -n "$FORCE_TTS" ] || [ ! -f "$L/vo/durations.json" ]; then python3 tts.py "$L" "$VOICE" "$ESL"; fi
if [ -n "$PREVIEW" ]; then LANG_VO=$L PREVIEW=$PREVIEW node director.js; echo "stills in $L/stills"; exit 0; fi
LANG_VO=$L node director.js
python3 audio.py "$L"
bash mix.sh "$L"
python3 srt.py "$L" "Mobile-Network-Navigator.$L.srt" "$L"
cd "$L/out"
ffmpeg -y -loglevel error -i video_noaudio.mp4 -i mix.wav -i "Mobile-Network-Navigator.$L.srt" -map 0:v -map 1:a -map 2:s \
  -c:v copy -c:a aac -b:a 192k -c:s mov_text -metadata:s:a:0 language=$ISO -metadata:s:s:0 language=$ISO \
  -metadata title="$TITLE" -movflags +faststart "$NAME.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$NAME.mp4" | xargs printf "$L/out/$NAME.mp4 – %.1f s\n"
