let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

export function playNotificationSound() {
  try {
    const audio = getContext()
    if (!audio) return
    if (audio.state === 'suspended') void audio.resume()
    const now = audio.currentTime

    const master = audio.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.25, now + 0.02)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
    master.connect(audio.destination)

    const tone = (freq: number, start: number, dur: number) => {
      const osc = audio.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + start)
      const gain = audio.createGain()
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(0.5, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(gain)
      gain.connect(master)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.05)
    }

    tone(880, 0, 0.25)
    tone(1320, 0.18, 0.35)
  } catch {
    // sound is best-effort; never let it break the app
  }
}
