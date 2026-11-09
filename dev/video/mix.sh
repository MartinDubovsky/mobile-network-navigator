#!/bin/bash
set -e
cd "$1/out"   # $1 = the language directory, e.g. dev/video/en
# premix: voice (mono → both channels) + music 14 dB lower, light bus compression
ffmpeg -y -loglevel error -i vo.wav -i music.wav -filter_complex "[0:a]pan=stereo|c0=c0|c1=c0[v];[1:a]volume=-14dB[m];[v][m]amix=inputs=2:normalize=0,acompressor=threshold=-18dB:ratio=2.2:attack=8:release=180:makeup=1[o]" -map "[o]" -c:a pcm_f32le premix.wav
# two-pass loudness normalisation to -16 LUFS, -1.5 dBTP
J=$(ffmpeg -hide_banner -nostats -i premix.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
MI=$(echo "$J"|python3 -c "import json,sys;j=json.load(sys.stdin);print(j['input_i'],j['input_tp'],j['input_lra'],j['input_thresh'],j['target_offset'])")
read I TP LRA TH OFF <<< "$MI"
ffmpeg -y -loglevel error -i premix.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true,aresample=48000" -c:a pcm_s16le mix.wav
ffmpeg -hide_banner -nostats -i mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' '
