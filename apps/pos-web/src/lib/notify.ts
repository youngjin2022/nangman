// 신규 주문 알림 - beep음 + 진동
// 브라우저 자동재생 정책 대응을 위해 첫 사용자 상호작용 시 AudioContext를 미리 resume 해 둔다.
// (백그라운드 탭에서도 이미 resume된 AudioContext와 Socket.IO 연결은 계속 동작)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

if (typeof window !== 'undefined') {
  const resume = () => {
    getAudioContext()?.resume();
    window.removeEventListener('pointerdown', resume);
  };
  window.addEventListener('pointerdown', resume);
}

// 짧은 2음 beep
export function playOrderAlertSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  [880, 660].forEach((freq, i) => {
    const start = ctx.currentTime + i * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.16);
  });
}

export function vibrateOrderAlert(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([200, 80, 200]);
  }
}
