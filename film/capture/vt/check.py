import glob, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
for f in sorted(glob.glob("capture/vt/*.mp3")):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    pcm = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(pcm, beam_size=5)
    print(f, "->", " ".join(s.text.strip() for s in segs), "| dur", round(len(pcm) / 16000, 2))
