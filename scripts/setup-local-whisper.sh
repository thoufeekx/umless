#!/usr/bin/env bash
# Sets up free, local transcription for Umless (no API key):
#   1. clones and builds whisper.cpp's whisper-cli
#   2. downloads the ggml-base.en model into ~/.cache/umless
# Needs git, a C/C++ compiler, cmake and curl. Override with WHISPER_DIR, JOBS, MODEL.
#   bash scripts/setup-local-whisper.sh
set -euo pipefail

WHISPER_DIR=${WHISPER_DIR:-$HOME/whisper.cpp}
JOBS=${JOBS:-2}
MODEL=${MODEL:-base.en}
CACHE=$HOME/.cache/umless

for tool in git cmake curl; do
  command -v "$tool" >/dev/null || {
    echo "missing: $tool" >&2
    [ "$tool" = cmake ] && echo "  no sudo? download a prebuilt cmake from https://cmake.org/download/ and put its bin/ on PATH" >&2
    exit 1
  }
done

if [ ! -d "$WHISPER_DIR/.git" ]; then
  git clone --depth 1 https://github.com/ggml-org/whisper.cpp "$WHISPER_DIR"
fi
cmake -S "$WHISPER_DIR" -B "$WHISPER_DIR/build" -DCMAKE_BUILD_TYPE=Release -DWHISPER_BUILD_TESTS=OFF
cmake --build "$WHISPER_DIR/build" -j"$JOBS" --config Release --target whisper-cli

mkdir -p "$CACHE"
if [ ! -s "$CACHE/ggml-$MODEL.bin" ]; then
  curl -fL -o "$CACHE/ggml-$MODEL.bin.part" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-$MODEL.bin"
  mv "$CACHE/ggml-$MODEL.bin.part" "$CACHE/ggml-$MODEL.bin"
fi

BIN="$WHISPER_DIR/build/bin/whisper-cli"
"$BIN" --help >/dev/null 2>&1 || { echo "build finished but $BIN does not run" >&2; exit 1; }
echo
echo "Done. Add these to your shell profile:"
echo "  export UMLESS_WHISPER_BIN=$BIN"
[ "$MODEL" != base.en ] && echo "  export UMLESS_WHISPER_MODEL=$CACHE/ggml-$MODEL.bin"
echo "Then run umless without OPENROUTER_API_KEY (or with UMLESS_STT=local)."
