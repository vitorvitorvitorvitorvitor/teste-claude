let ctx: AudioContext | null = null;

/** Prepara o áudio dentro de um gesto do usuário (exigência do Safari). */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    if (ctx?.state === 'suspended') void ctx.resume();
  } catch {
    /* sem áudio */
  }
}

export function beep() {
  try {
    if (!ctx) return;
    const t = ctx.currentTime;
    [0, 0.25].forEach((off) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.25, t + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.18);
      o.connect(g).connect(ctx!.destination);
      o.start(t + off);
      o.stop(t + off + 0.2);
    });
  } catch {
    /* ignora */
  }
  if ('vibrate' in navigator) navigator.vibrate?.([120, 80, 120]);
}
