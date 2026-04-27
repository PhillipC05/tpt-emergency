import { createSignal, createEffect } from 'solid-js'
import { db } from '../lib/offline-db'
import { socket } from '../lib/socket'

export function PanicButton() {
  const [active, setActive] = createSignal(false)

  const triggerPanic = async () => {
    setActive(true)
    
    const position = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null)
      )
    })

    const alarm = {
      type: 'man_down',
      unit_id: localStorage.getItem('unit_id'),
      location: position,
      created_at: Date.now(),
      acknowledged: false,
      acknowledged_by: null
    }

    await db.alarms.add(alarm)
    socket.emit('panic_alarm', alarm)

    // Play continuous alarm sound
    const audio = new Audio('/assets/alarm.mp3')
    audio.loop = true
    audio.play()
  }

  const cancelPanic = () => {
    setActive(false)
  }

  return (
    <div class="fixed bottom-6 right-6 z-50">
      <button
        onClick={active() ? cancelPanic : triggerPanic}
        class={`w-24 h-24 rounded-full font-bold text-white text-lg shadow-2xl transition-all transform active:scale-95 ${
          active() 
            ? 'bg-red-600 animate-pulse border-4 border-white' 
            : 'bg-red-700 hover:bg-red-600 border-4 border-red-900'
        }`}
        oncontextmenu={(e) => e.preventDefault()}
      >
        {active() ? 'CANCEL' : 'PANIC'}
      </button>
    </div>
  )
}