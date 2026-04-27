/**
 * TPT Emergency System - Unit Shift Scheduling
 * @module src/modules/UnitShiftScheduling.jsx
 * Personnel and unit shift management, scheduling, and on-call roster
 */

import { createSignal, onMount, For } from 'solid-js'

export function UnitShiftScheduling() {
  const [activeTab, setActiveTab] = createSignal('current')
  const [shifts, setShifts] = createSignal([])
  const [personnel, setPersonnel] = createSignal([])
  const [units, setUnits] = createSignal([])
  const [selectedDate, setSelectedDate] = createSignal(new Date().toISOString().split('T')[0])

  const shiftTemplates = [
    { id: 'day', name: 'Day Shift', start: '07:00', end: '19:00', color: 'bg-yellow-600' },
    { id: 'night', name: 'Night Shift', start: '19:00', end: '07:00', color: 'bg-blue-800' },
    { id: 'morning', name: 'Morning', start: '06:00', end: '14:00', color: 'bg-green-600' },
    { id: 'afternoon', name: 'Afternoon', start: '14:00', end: '22:00', color: 'bg-orange-600' },
    { id: 'oncall', name: 'On-Call', start: '00:00', end: '23:59', color: 'bg-purple-600' },
  ]

  const generateMockData = () => {
    const personnelList = [
      { id: 'p1', name: 'John Smith', role: 'Paramedic', status: 'on-duty', qualifications: ['ALS', 'BLS'] },
      { id: 'p2', name: 'Sarah Johnson', role: 'Firefighter', status: 'on-duty', qualifications: ['HazMat', 'Rescue'] },
      { id: 'p3', name: 'Michael Brown', role: 'EMT', status: 'off-duty', qualifications: ['BLS'] },
      { id: 'p4', name: 'Emily Davis', role: 'Paramedic', status: 'on-call', qualifications: ['ALS', 'Critical Care'] },
      { id: 'p5', name: 'David Wilson', role: 'Fire Captain', status: 'on-duty', qualifications: ['Command', 'Incident Mgmt'] },
      { id: 'p6', name: 'Lisa Anderson', role: 'EMT', status: 'sick-leave', qualifications: ['BLS'] },
      { id: 'p7', name: 'Robert Taylor', role: 'Paramedic', status: 'on-duty', qualifications: ['ALS'] },
      { id: 'p8', name: 'Jennifer Martinez', role: 'Firefighter', status: 'off-duty', qualifications: ['Rescue', 'EMS'] },
    ]

    const unitList = [
      { id: 'u1', name: 'Ambulance 1', type: 'Ambulance', status: 'active', crew: ['p1', 'p4'] },
      { id: 'u2', name: 'Engine 3', type: 'Fire Engine', status: 'active', crew: ['p2', 'p5', 'p7'] },
      { id: 'u3', name: 'Ambulance 2', type: 'Ambulance', status: 'standby', crew: ['p3'] },
      { id: 'u4', name: 'Rescue 2', type: 'Rescue Unit', status: 'active', crew: ['p8'] },
      { id: 'u5', name: 'Battalion Chief', type: 'Command', status: 'active', crew: ['p5'] },
    ]

    const today = new Date()
    const shiftList = []
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i - 3)
      const dateStr = date.toISOString().split('T')[0]
      
      shiftTemplates.forEach(template => {
        if (Math.random() > 0.3) {
          shiftList.push({
            id: `shift-${dateStr}-${template.id}`,
            date: dateStr,
            template: template.id,
            personnel: personnelList.filter(() => Math.random() > 0.6).map(p => p.id),
            units: unitList.filter(() => Math.random() > 0.5).map(u => u.id),
            notes: ''
          })
        }
      })
    }

    setPersonnel(personnelList)
    setUnits(unitList)
    setShifts(shiftList)
  }

  const getStatusColor = (status) => {
    return {
      'on-duty': 'bg-green-500',
      'off-duty': 'bg-gray-500',
      'on-call': 'bg-yellow-500',
      'sick-leave': 'bg-red-500',
      'vacation': 'bg-blue-500',
      'training': 'bg-purple-500'
    }[status] || 'bg-gray-500'
  }

  const getShiftTemplate = (id) => shiftTemplates.find(s => s.id === id)

  const isToday = (dateStr) => {
    return dateStr === new Date().toISOString().split('T')[0]
  }

  const getPersonnelById = (id) => personnel().find(p => p.id === id)
  const getUnitById = (id) => units().find(u => u.id === id)

  const createNewShift = () => {
    const newShift = {
      id: `shift-${Date.now()}`,
      date: selectedDate(),
      template: 'day',
      personnel: [],
      units: [],
      notes: ''
    }
    setShifts(prev => [...prev, newShift])
  }

  const deleteShift = (shiftId) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId))
  }

  onMount(() => {
    generateMockData()
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">⏰ Unit Shift Scheduling</h2>
        <div class="flex items-center gap-3">
          <input 
            type="date" 
            value={selectedDate()} 
            onInput={(e) => setSelectedDate(e.target.value)}
            class="px-3 py-1 bg-gray-700 rounded border-none"
          />
          <button
            onClick={createNewShift}
            class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500"
          >
            + New Shift
          </button>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('current')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'current' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Current Shifts
        </button>
        <button
          onClick={() => setActiveTab('personnel')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'personnel' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Personnel Roster
        </button>
        <button
          onClick={() => setActiveTab('units')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'units' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Unit Status
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'calendar' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Schedule Calendar
        </button>
      </div>

      {activeTab() === 'current' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-3">
            <For each={shifts().filter(s => s.date >= new Date().toISOString().split('T')[0]).slice(0, 8)}>
              {shift => {
                const template = getShiftTemplate(shift.template)
                return (
                  <div class={`bg-gray-800 rounded-lg p-4 ${isToday(shift.date) ? 'border border-blue-500' : ''}`}>
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <span class={`px-2 py-1 rounded text-xs font-bold ${template?.color || 'bg-gray-600'}`}>
                          {template?.name || shift.template}
                        </span>
                        <span class="font-medium">
                          {new Date(shift.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                        <span class="text-sm text-gray-400">{template?.start} - {template?.end}</span>
                        {isToday(shift.date) && <span class="px-2 py-0.5 bg-blue-600 rounded text-xs">TODAY</span>}
                      </div>
                      <button 
                        onClick={() => deleteShift(shift.id)}
                        class="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <div class="text-xs text-gray-400 mb-2">Assigned Personnel ({shift.personnel.length})</div>
                        <div class="flex flex-wrap gap-1">
                          <For each={shift.personnel}>
                            {pid => {
                              const person = getPersonnelById(pid)
                              return person ? (
                                <span class="px-2 py-1 bg-gray-700 rounded text-xs">
                                  {person.name}
                                </span>
                              ) : null
                            }}
                          </For>
                        </div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-400 mb-2">Assigned Units ({shift.units.length})</div>
                        <div class="flex flex-wrap gap-1">
                          <For each={shift.units}>
                            {uid => {
                              const unit = getUnitById(uid)
                              return unit ? (
                                <span class="px-2 py-1 bg-gray-700 rounded text-xs">
                                  {unit.name}
                                </span>
                              ) : null
                            }}
                          </For>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'personnel' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={personnel()}>
              {person => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class={`w-2 h-2 rounded-full ${getStatusColor(person.status)}`} />
                      <span class="font-medium">{person.name}</span>
                    </div>
                    <span class="text-xs text-gray-400 uppercase">{person.status.replace('-', ' ')}</span>
                  </div>
                  <div class="text-sm text-gray-400 mb-2">{person.role}</div>
                  <div class="flex flex-wrap gap-1">
                    <For each={person.qualifications}>
                      {qual => (
                        <span class="px-2 py-0.5 bg-gray-700 rounded text-xs">{qual}</span>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'units' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={units()}>
              {unit => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">{unit.name}</span>
                    <span class={`px-2 py-0.5 rounded text-xs ${unit.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                      {unit.status.toUpperCase()}
                    </span>
                  </div>
                  <div class="text-sm text-gray-400 mb-2">{unit.type}</div>
                  <div class="text-xs text-gray-500">
                    Crew: {unit.crew.map(id => getPersonnelById(id)?.name).filter(Boolean).join(', ') || 'Unassigned'}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'calendar' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div class="text-center text-sm font-medium text-gray-400 py-2">{day}</div>
            ))}
            
            <For each={Array.from({ length: 35 }, (_, i) => {
              const d = new Date(selectedDate())
              d.setDate(1)
              const firstDay = d.getDay()
              d.setDate(i - firstDay + 1)
              return d.toISOString().split('T')[0]
            })}>
              {dateStr => {
                const dayShifts = shifts().filter(s => s.date === dateStr)
                const isCurrentMonth = new Date(dateStr).getMonth() === new Date(selectedDate()).getMonth()
                
                return (
                  <div class={`min-h-24 p-2 rounded ${isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900 text-gray-600'} ${isToday(dateStr) ? 'border border-blue-500' : ''}`}>
                    <div class="text-sm mb-1">{new Date(dateStr).getDate()}</div>
                    <div class="space-y-1">
                      <For each={dayShifts.slice(0, 2)}>
                        {shift => {
                          const template = getShiftTemplate(shift.template)
                          return (
                            <div class={`text-xs px-1 py-0.5 rounded truncate ${template?.color || 'bg-gray-700'}`}>
                              {template?.name}
                            </div>
                          )
                        }}
                      </For>
                      {dayShifts.length > 2 && (
                        <div class="text-xs text-gray-400">+{dayShifts.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnitShiftScheduling