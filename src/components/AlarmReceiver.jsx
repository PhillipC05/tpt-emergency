import { createSignal, createEffect, onCleanup } from 'solid-js'
import { db } from '../lib/offline-db'
import { socket } from '../lib/socket'

/**
 * src/components/AlarmReceiver.jsx
 * Audible alarm hierarchy with distinct sounds
 * 
 * Alarm Priority Levels:
 * 1. CRITICAL (Panic / Man Down) - 100% volume, repeating siren
 * 2. EMERGENCY (New Incident) - 80% volume, alert tone
 * 3. WARNING (Unit Status Change) - 60% volume, single beep
 * 4. NOTIFICATION (Message) - 40% volume, soft chime
 * 5. INFO (System Status) - 20% volume, quiet tone
 */

export function AlarmReceiver() {
  const [activeAlarms, setActiveAlarms] = createSignal([])
  const activeAudio = new Map()

  const alarmProfiles = {
    critical: {
      volume: 1.0,
      frequency: 'repeat',
      color: 'bg-red-700',
      icon: '🚨',
      label: 'CRITICAL ALARM'
    },
    emergency: {
      volume: 0.8,
      frequency: 'triple',
      color: 'bg-orange-700',
      icon: '⚠️',
      label: 'EMERGENCY ALERT'
    },
    warning: {
      volume: 0.6,
      frequency: 'double',
      color: 'bg-yellow-700',
      icon: '🔔',
      label: 'WARNING'
    },
    notification: {
      volume: 0.4,
      frequency: 'single',
      color: 'bg-blue-700',
      icon: '📢',
      label: 'NOTIFICATION'
    },
    info: {
      volume: 0.2,
      frequency: 'soft',
      color: 'bg-gray-700',
      icon: 'ℹ️',
      label: 'INFORMATION'
    }
  }

  const generateTone = (frequency, duration, type = 'sine') => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = type
    
    return { audioContext, oscillator, gainNode }
  }

  const playAlarmSound = (priority, alarmId) => {
    const profile = alarmProfiles[priority] || alarmProfiles.info
    
    // Use Web Audio API for distinct synthesized sounds - no external files required
    switch(profile.frequency) {
      case 'repeat':
        // Critical: Rising siren pattern, repeating
        const ctx1 = new (window.AudioContext || window.webkitAudioContext)()
        const playSiren = () => {
          if (!activeAudio.has(alarmId)) return
          
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              if (!activeAudio.has(alarmId)) return
              const osc = ctx1.createOscillator()
              const gain = ctx1.createGain()
              osc.connect(gain)
              gain.connect(ctx1.destination)
              osc.frequency.setValueAtTime(800, ctx1.currentTime)
              osc.frequency.linearRampToValueAtTime(1200, ctx1.currentTime + 0.2)
              gain.gain.setValueAtTime(profile.volume, ctx1.currentTime)
              gain.gain.exponentialRampToValueAtTime(0.01, ctx1.currentTime + 0.3)
              osc.start(ctx1.currentTime)
              osc.stop(ctx1.currentTime + 0.3)
            }, i * 400)
          }
          
          setTimeout(playSiren, 1500)
        }
        activeAudio.set(alarmId, ctx1)
        playSiren()
        break
        
      case 'triple':
        // Emergency: Three fast beeps
        const ctx2 = new (window.AudioContext || window.webkitAudioContext)()
        activeAudio.set(alarmId, ctx2)
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const osc = ctx2.createOscillator()
            const gain = ctx2.createGain()
            osc.connect(gain)
            gain.connect(ctx2.destination)
            osc.frequency.value = 1000
            gain.gain.setValueAtTime(profile.volume, ctx2.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.15)
            osc.start(ctx2.currentTime)
            osc.stop(ctx2.currentTime + 0.15)
          }, i * 180)
        }
        setTimeout(() => activeAudio.delete(alarmId), 800)
        break
        
      case 'double':
        // Warning: Two medium beeps
        const ctx3 = new (window.AudioContext || window.webkitAudioContext)()
        activeAudio.set(alarmId, ctx3)
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            const osc = ctx3.createOscillator()
            const gain = ctx3.createGain()
            osc.connect(gain)
            gain.connect(ctx3.destination)
            osc.frequency.value = 880
            gain.gain.setValueAtTime(profile.volume, ctx3.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx3.currentTime + 0.12)
            osc.start(ctx3.currentTime)
            osc.stop(ctx3.currentTime + 0.12)
          }, i * 250)
        }
        setTimeout(() => activeAudio.delete(alarmId), 600)
        break
        
      case 'single':
        // Notification: Single clear beep
        const ctx4 = new (window.AudioContext || window.webkitAudioContext)()
        activeAudio.set(alarmId, ctx4)
        const osc4 = ctx4.createOscillator()
        const gain4 = ctx4.createGain()
        osc4.connect(gain4)
        gain4.connect(ctx4.destination)
        osc4.frequency.value = 720
        gain4.gain.setValueAtTime(profile.volume, ctx4.currentTime)
        gain4.gain.exponentialRampToValueAtTime(0.01, ctx4.currentTime + 0.1)
        osc4.start(ctx4.currentTime)
        osc4.stop(ctx4.currentTime + 0.1)
        setTimeout(() => activeAudio.delete(alarmId), 200)
        break
        
      case 'soft':
        // Info: Soft gentle tone
        const ctx5 = new (window.AudioContext || window.webkitAudioContext)()
        activeAudio.set(alarmId, ctx5)
        const osc5 = ctx5.createOscillator()
        const gain5 = ctx5.createGain()
        osc5.type = 'sine'
        osc5.connect(gain5)
        gain5.connect(ctx5.destination)
        osc5.frequency.value = 523
        gain5.gain.setValueAtTime(profile.volume, ctx5.currentTime)
        gain5.gain.exponentialRampToValueAtTime(0.01, ctx5.currentTime + 0.2)
        osc5.start(ctx5.currentTime)
        osc5.stop(ctx5.currentTime + 0.2)
        setTimeout(() => activeAudio.delete(alarmId), 300)
        break
    }
  }

  const stopAlarmSound = (alarmId) => {
    if (activeAudio.has(alarmId)) {
      const ctx = activeAudio.get(alarmId)
      try { ctx.close() } catch(e) {}
      activeAudio.delete(alarmId)
    }
  }

  createEffect(() => {
    // Critical Panic / Man Down Alarm
    socket.on('panic_alarm', async (alarm) => {
      alarm.priority = 'critical'
      await db.alarms.add(alarm)
      setActiveAlarms(prev => [...prev, alarm])
      playAlarmSound('critical', alarm.id)
    })

    // New Incident Alert
    socket.on('incident:new', (incident) => {
      playAlarmSound('emergency', `incident-${incident.id}`)
    })

    // Unit Status Change
    socket.on('unit:status', (unit) => {
      playAlarmSound('warning', `unit-${unit.id}`)
    })

    // New Message Received
    socket.on('message:received', (message) => {
      if (message.priority === 'high') {
        playAlarmSound('notification', message.id)
      } else {
        playAlarmSound('info', message.id)
      }
    })

    // System Alerts
    socket.on('system:alert', (alert) => {
      playAlarmSound(alert.priority || 'info', alert.id)
    })

    return () => {
      socket.off('panic_alarm')
      socket.off('incident:new')
      socket.off('unit:status')
      socket.off('message:received')
      socket.off('system:alert')
    }
  })

  const acknowledge = async (alarmId) => {
    stopAlarmSound(alarmId)
    
    await db.alarms.update(alarmId, {
      acknowledged: true,
      acknowledged_at: Date.now(),
      acknowledged_by: localStorage.getItem('user_id')
    })

    setActiveAlarms(prev => prev.filter(a => a.id !== alarmId))
  }

  onCleanup(() => {
    activeAudio.forEach((ctx, id) => {
      try { ctx.close() } catch(e) {}
    })
    activeAudio.clear()
  })

  if (!activeAlarms().length) return null

  const highestPriority = activeAlarms().sort((a, b) => {
    const priorityOrder = ['critical', 'emergency', 'warning', 'notification', 'info']
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  })[0]
  
  const profile = alarmProfiles[highestPriority.priority] || alarmProfiles.info

  return (
    <div class="fixed inset-x-0 top-0 z-[100]">
      <div class={`${profile.color} animate-pulse p-4 border-b-4 border-white`}>
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-4xl animate-bounce">{profile.icon}</div>
            <div>
              <div class="text-2xl font-bold text-white">{profile.label}</div>
              <div class="text-white/80">
                {highestPriority.message || `Unit: ${highestPriority.unit_id} - Immediate response required`}
              </div>
              {activeAlarms().length > 1 && (
                <div class="text-sm mt-1 text-white/60">
                  + {activeAlarms().length - 1} additional active alarms
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => acknowledge(highestPriority.id)}
            class="px-8 py-4 bg-white text-black font-bold rounded-lg text-xl shadow-xl hover:bg-gray-100 transition active:scale-95"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  )
}
