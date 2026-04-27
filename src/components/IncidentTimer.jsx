import { createSignal, createEffect, onCleanup } from 'solid-js'

export function IncidentTimer({ incidentId, name, startTime = null, onStart, onStop }) {
  const [elapsed, setElapsed] = createSignal(0)
  const [running, setRunning] = createSignal(!!startTime)
  
  let interval
  
  const start = () => {
    setRunning(true)
    onStart && onStart()
  }
  
  const stop = () => {
    setRunning(false)
    onStop && onStop(elapsed())
  }
  
  const reset = () => {
    stop()
    setElapsed(0)
  }

  createEffect(() => {
    if (running()) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
  })

  onCleanup(() => clearInterval(interval))

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div class="flex items-center gap-3 bg-gray-900 rounded px-4 py-2 font-mono text-xl">
      <div class="text-white">{name}</div>
      <div class={`${running() ? 'text-green-400' : 'text-gray-400'}`}>
        {formatTime(elapsed())}
      </div>
      {running() ? (
        <button onClick={stop} class="px-3 py-1 bg-red-600 rounded text-white text-sm">Stop</button>
      ) : (
        <button onClick={start} class="px-3 py-1 bg-green-600 rounded text-white text-sm">Start</button>
      )}
      <button onClick={reset} class="px-3 py-1 bg-gray-700 rounded text-white text-sm">Reset</button>
    </div>
  )
}