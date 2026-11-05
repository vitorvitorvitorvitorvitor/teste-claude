"""Synthesized soundtrack (no samples): warm pad + street hum, ticking clock,
fast-forward riser, hard silence during the blackout, swell when the Sun returns."""
import sys, wave
import numpy as np

SR, DUR = 48000, 30.0
t = np.arange(int(SR * DUR)) / SR
rng = np.random.default_rng(7)

def env(a, b, fade=0.3):
    return np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)

def smooth(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)

# blackout gate: world blackout = video 15.5–17.5
gate = 1 - smooth(15.45, 15.52, t) * (1 - smooth(17.45, 17.9, t))

# warm pad (D major-ish, slow vibrato), brighter after the return
pad = np.zeros_like(t)
for f, g in [(146.83, .5), (220.0, .35), (293.66, .3), (369.99, .18), (440.0, .12)]:
    vib = 1 + .003 * np.sin(2 * np.pi * .23 * t + f)
    pad += g * (np.sin(2 * np.pi * f * vib * t) + .3 * np.sin(2 * np.pi * 2 * f * vib * t))
pad *= .16 * smooth(0, 2.0, t) * (1 - .35 * smooth(7, 9, t) * (1 - smooth(13, 15, t))) * (1 - smooth(29.0, 30, t))

# street murmur: low-passed noise
noise = rng.standard_normal(t.size)
k = np.exp(-np.arange(400) / 60.0); k /= k.sum()
murmur = np.convolve(noise, k, mode='same') * .5 * smooth(0, 1.5, t) * (1 - smooth(29, 30, t))

# clock ticks: once per video second in real-time parts, faster in the countdown
ticks = np.zeros_like(t)
tick_times = list(np.arange(0.5, 7, 1.0)) + list(np.arange(14.0, 15.5, 0.5)) + list(np.arange(17.9, 29, 1.0))
for tt in tick_times:
    i = int(tt * SR); n = int(.035 * SR)
    ticks[i:i + n] += np.sin(2 * np.pi * 2400 * np.arange(n) / SR) * np.exp(-np.arange(n) / (SR * .006)) * .35

# fast-forward riser 7–14 s
ff = env(7, 14, .6)
phase = np.cumsum(2 * np.pi * (180 + 600 * smooth(7, 14, t)) / SR)
riser = .07 * ff * np.sin(phase) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))

# blackout: sub thump at onset, then near-silence with a faint high ring
thump = np.zeros_like(t); i0 = int(15.5 * SR); n = int(1.2 * SR)
thump[i0:i0 + n] = np.sin(2 * np.pi * 42 * np.arange(n) / SR) * np.exp(-np.arange(n) / (SR * .35)) * .55
ring = .02 * np.sin(2 * np.pi * 3100 * t) * env(15.6, 17.4, .3)
# swell when light returns
swell = .12 * env(17.5, 21, .4) * smooth(17.5, 18.2, t) * (np.sin(2 * np.pi * 587.33 * t) + .6 * np.sin(2 * np.pi * 880 * t))

mix = (pad + murmur + riser) * gate + ticks * gate + thump + ring + swell
mix = np.tanh(mix * 1.2) * .8
stereo = np.stack([mix, np.roll(mix, 240)], axis=1)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype('<i2').tobytes())
