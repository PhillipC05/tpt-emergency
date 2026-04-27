/**
 * TPT Emergency System - Radio Channel Management
 * @module src/modules/RadioChannelManagement.jsx
 * Two-way radio channel allocation, monitoring and communication management
 */

import { createSignal, onMount, For } from 'solid-js'

export function RadioChannelManagement() {
  const [activeTab, setActiveTab] = createSignal('channels')
  const [channels, setChannels] = createSignal([])
  const [activeTransmissions, setActiveTransmissions] = createSignal([])
  const [talkGroups, setTalkGroups] = createSignal([])
  const [radioUnits, setRadioUnits] = createSignal([])
  const [selectedChannel, setSelectedChannel] = createSignal(null)
  const [callsigns, setCallsigns] = createSignal([])
  const [transmissionLog, setTransmissionLog] = createSignal([])
  const [newCallsign, setNewCallsign] = createSignal({ unit: '', callsign: '', channel: 1 })
  const [icsRoles, setIcsRoles] = createSignal([])
  const [assignedRoles, setAssignedRoles] = createSignal([])

  const generateMockData = () => {
    const channelList = [
      { id: 1, name: 'Dispatch', frequency: '155.250', mode: 'digital', status: 'active', users: 12, priority: 'high', encryption: 'AES-256' },
      { id: 2, name: 'Fire Tac 1', frequency: '155.295', mode: 'digital', status: 'active', users: 8, priority: 'medium', encryption: 'AES-256' },
      { id: 3, name: 'EMS Tac 1', frequency: '155.340', mode: 'digital', status: 'active', users: 6, priority: 'medium', encryption: 'AES-256' },
      { id: 4, name: 'Police Tac 1', frequency: '155.475', mode: 'digital', status: 'active', users: 15, priority: 'high', encryption: 'AES-256' },
      { id: 5, name: 'Mutual Aid', frequency: '155.160', mode: 'analog', status: 'standby', users: 0, priority: 'low', encryption: 'none' },
      { id: 6, name: 'Command', frequency: '155.505', mode: 'digital', status: 'active', users: 5, priority: 'critical', encryption: 'AES-256' },
      { id: 7, name: 'Fire Ground', frequency: '154.100', mode: 'analog', status: 'active', users: 22, priority: 'high', encryption: 'none' },
      { id: 8, name: 'Hospitals', frequency: '155.220', mode: 'digital', status: 'standby', users: 2, priority: 'medium', encryption: 'AES-256' },
    ]

    const transmissionList = [
      { id: 'tx1', channel: 1, unit: 'Ambulance 1', duration: 12, signal: -62, time: new Date().toISOString() },
      { id: 'tx2', channel: 7, unit: 'Engine 3', duration: 28, signal: -58, time: new Date().toISOString() },
      { id: 'tx3', channel: 6, unit: 'Command', duration: 45, signal: -45, time: new Date().toISOString() },
    ]

    const groupList = [
      { id: 'tg1', name: 'Emergency Dispatch', members: 24, description: 'Primary dispatch channel' },
      { id: 'tg2', name: 'Fire Operations', members: 18, description: 'Fire department tactical operations' },
      { id: 'tg3', name: 'EMS Operations', members: 12, description: 'Ambulance and medical communications' },
      { id: 'tg4', name: 'Police Operations', members: 32, description: 'Law enforcement communications' },
      { id: 'tg5', name: 'Command Staff', members: 6, description: 'Incident command and management' },
    ]

    const unitList = [
      { id: 'radio1', unit: 'Ambulance 1', channel: 1, alias: 'Medic 1', status: 'transmitting', signal: -62 },
      { id: 'radio2', unit: 'Engine 3', channel: 7, alias: 'Engine 3', status: 'transmitting', signal: -58 },
      { id: 'radio3', unit: 'Battalion Chief', channel: 6, alias: 'Command', status: 'transmitting', signal: -45 },
      { id: 'radio4', unit: 'Ambulance 2', channel: 3, alias: 'Medic 2', status: 'monitoring', signal: -71 },
      { id: 'radio5', unit: 'Rescue 2', channel: 1, alias: 'Rescue 2', status: 'idle', signal: -65 },
    ]

    setChannels(channelList)
    setActiveTransmissions(transmissionList)
    setTalkGroups(groupList)
    setRadioUnits(unitList)

    const callsignList = [
      { id: 1, unit: 'Incident Commander', callsign: 'COMMAND 1', channel: 6, active: true, assigned: 'John Smith' },
      { id: 2, unit: 'Operations Chief', callsign: 'OPS 1', channel: 6, active: true, assigned: 'Mike Davis' },
      { id: 3, unit: 'Engine 3', callsign: 'ALPHA 3', channel: 7, active: true, assigned: 'Unit Crew' },
      { id: 4, unit: 'Ambulance 1', callsign: 'MEDIC 1', channel: 3, active: true, assigned: 'Paramedic Team' },
      { id: 5, unit: 'Rescue 2', callsign: 'RESCUE 2', channel: 1, active: false, assigned: '' },
    ]

    const logEntries = [
      { id: 1, time: new Date(Date.now() - 120000).toISOString(), callsign: 'COMMAND 1', channel: 6, duration: 18, transcript: 'All units report current status and location.', signal: -42 },
      { id: 2, time: new Date(Date.now() - 95000).toISOString(), callsign: 'ALPHA 3', channel: 7, duration: 12, transcript: 'Engine 3 on scene, structure fire fully involved.', signal: -58 },
      { id: 3, time: new Date(Date.now() - 60000).toISOString(), callsign: 'MEDIC 1', channel: 3, duration: 22, transcript: 'Medic 1 en route with 2 critical patients.', signal: -65 },
      { id: 4, time: new Date(Date.now() - 30000).toISOString(), callsign: 'OPS 1', channel: 6, duration: 8, transcript: 'Establish water supply and secondary attack line.', signal: -51 },
    ]

    const icsRoleDefinitions = [
      { id: 'ic', name: 'Incident Commander', description: 'Overall incident responsibility', vacant: false, assigned: 'John Smith' },
      { id: 'ops', name: 'Operations Section Chief', description: 'Tactical operations management', vacant: false, assigned: 'Mike Davis' },
      { id: 'plans', name: 'Planning Section Chief', description: 'Situation status and planning', vacant: true, assigned: '' },
      { id: 'logistics', name: 'Logistics Section Chief', description: 'Resource and support coordination', vacant: true, assigned: '' },
      { id: 'finance', name: 'Finance/Admin Section Chief', description: 'Cost tracking and administration', vacant: true, assigned: '' },
      { id: 'safety', name: 'Safety Officer', description: 'Incident safety monitoring', vacant: false, assigned: 'Sarah Wilson' },
      { id: 'pio', name: 'Public Information Officer', description: 'Media and public communications', vacant: true, assigned: '' },
      { id: 'liaison', name: 'Liaison Officer', description: 'Agency and mutual aid coordination', vacant: true, assigned: '' },
    ]

    setCallsigns(callsignList)
    setTransmissionLog(logEntries)
    setIcsRoles(icsRoleDefinitions)
  }

  const assignCallsign = () => {
    if (newCallsign().unit && newCallsign().callsign) {
      setCallsigns(prev => [...prev, {
        id: prev.length + 1,
        ...newCallsign(),
        active: true,
        assigned: new Date().toISOString()
      }])
      setNewCallsign({ unit: '', callsign: '', channel: 1 })
    }
  }

  const toggleCallsignActive = (id) => {
    setCallsigns(prev => prev.map(cs => cs.id === id ? { ...cs, active: !cs.active } : cs))
  }

  const assignIcsRole = (roleId, personName) => {
    setIcsRoles(prev => prev.map(role => 
      role.id === roleId ? { ...role, assigned: personName, vacant: !personName } : role
    ))
  }

  const getPriorityColor = (priority) => {
    return {
      'low': 'bg-gray-600',
      'medium': 'bg-yellow-600',
      'high': 'bg-orange-600',
      'critical': 'bg-red-600'
    }[priority] || 'bg-gray-600'
  }

  const getSignalStrength = (dbm) => {
    if (dbm > -50) return 'excellent'
    if (dbm > -65) return 'good'
    if (dbm > -80) return 'fair'
    return 'poor'
  }

  const getSignalColor = (dbm) => {
    const strength = getSignalStrength(dbm)
    return {
      'excellent': 'text-green-400',
      'good': 'text-green-500',
      'fair': 'text-yellow-400',
      'poor': 'text-red-400'
    }[strength]
  }

  const toggleChannelStatus = (channelId) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        return { ...ch, status: ch.status === 'active' ? 'standby' : 'active' }
      }
      return ch
    }))
  }

  onMount(() => {
    generateMockData()
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">📻 Radio Channel Management</h2>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 bg-green-600 rounded text-sm">System Online</span>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('channels')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'channels' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Channel List
        </button>
        <button
          onClick={() => setActiveTab('transmissions')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'transmissions' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Active Transmissions
        </button>
        <button
          onClick={() => setActiveTab('units')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'units' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Radio Units
        </button>
        <button
          onClick={() => setActiveTab('talkgroups')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'talkgroups' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Talk Groups
        </button>
        <button
          onClick={() => setActiveTab('callsigns')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'callsigns' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Callsigns
        </button>
        <button
          onClick={() => setActiveTab('transmissionlog')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'transmissionlog' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Transmission Log
        </button>
        <button
          onClick={() => setActiveTab('icscommand')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'icscommand' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          ICS Command
        </button>
      </div>

      {activeTab() === 'channels' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={channels()}>
              {channel => (
                <div class={`bg-gray-800 rounded-lg p-4 ${selectedChannel() === channel.id ? 'border border-blue-500' : ''}`} onClick={() => setSelectedChannel(channel.id)}>
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class={`w-2 h-2 rounded-full ${channel.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                      <span class="font-medium">{channel.name}</span>
                      <span class={`px-2 py-0.5 rounded text-xs ${getPriorityColor(channel.priority)}`}>
                        {channel.priority.toUpperCase()}
                      </span>
                    </div>
                    <span class="font-mono text-sm">{channel.frequency} MHz</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <div class="text-gray-400 text-xs">Mode</div>
                      <div class="uppercase">{channel.mode}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Users</div>
                      <div>{channel.users}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Encryption</div>
                      <div>{channel.encryption}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleChannelStatus(channel.id) }}
                    class={`w-full py-1 rounded text-xs ${channel.status === 'active' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                  >
                    {channel.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'transmissions' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-3">
            <For each={activeTransmissions}>
              {tx => {
                const channel = channels().find(c => c.id === tx.channel)
                return (
                  <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="animate-pulse">🔴</span>
                        <span class="font-medium">{tx.unit}</span>
                        <span class="text-sm text-gray-400">{channel?.name}</span>
                      </div>
                      <span class="font-mono">{tx.duration}s</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class={`text-sm ${getSignalColor(tx.signal)}`}>
                        Signal: {tx.signal} dBm ({getSignalStrength(tx.signal)})
                      </span>
                      <span class="text-xs text-gray-500">
                        {new Date(tx.time).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'units' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={radioUnits()}>
              {unit => {
                const channel = channels().find(c => c.id === unit.channel)
                return (
                  <div class="bg-gray-800 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class={`w-2 h-2 rounded-full ${unit.status === 'transmitting' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <span class="font-medium">{unit.unit}</span>
                        <span class="text-sm text-gray-400">({unit.alias})</span>
                      </div>
                      <span class="text-sm">{channel?.name}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Status: <span class="capitalize">{unit.status.replace('-', ' ')}</span></span>
                      <span class={getSignalColor(unit.signal)}>Signal: {unit.signal} dBm</span>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'talkgroups' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-3">
            <For each={talkGroups()}>
              {group => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">{group.name}</span>
                    <span class="text-sm">{group.members} members</span>
                  </div>
                  <div class="text-sm text-gray-400">{group.description}</div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'callsigns' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-gray-800 rounded-lg p-4">
              <h3 class="font-medium mb-3">Assign New Callsign</h3>
              <div class="space-y-2">
                <input
                  placeholder="Unit Name"
                  value={newCallsign().unit}
                  onInput={(e) => setNewCallsign(prev => ({ ...prev, unit: e.target.value }))}
                  class="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                />
                <input
                  placeholder="Radio Callsign"
                  value={newCallsign().callsign}
                  onInput={(e) => setNewCallsign(prev => ({ ...prev, callsign: e.target.value }))}
                  class="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                />
                <select
                  value={newCallsign().channel}
                  onChange={(e) => setNewCallsign(prev => ({ ...prev, channel: parseInt(e.target.value) }))}
                  class="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                >
                  <For each={channels()}>
                    {ch => <option value={ch.id}>{ch.name} - {ch.frequency}</option>}
                  </For>
                </select>
                <button onClick={assignCallsign} class="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm">
                  Assign Callsign
                </button>
              </div>
            </div>
          </div>
          
          <div class="space-y-2">
            <For each={callsigns()}>
              {cs => {
                const channel = channels().find(c => c.id === cs.channel)
                return (
                  <div class="bg-gray-800 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <span class={`w-2 h-2 rounded-full ${cs.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span class="font-medium">{cs.callsign}</span>
                        <span class="text-sm text-gray-400">{cs.unit}</span>
                      </div>
                      <button 
                        onClick={() => toggleCallsignActive(cs.id)}
                        class={`px-2 py-1 rounded text-xs ${cs.active ? 'bg-red-600' : 'bg-green-600'}`}
                      >
                        {cs.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Channel: {channel?.name}</span>
                      <span class="text-gray-400">Assigned: {cs.assigned}</span>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'transmissionlog' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={transmissionLog()}>
              {entry => {
                const channel = channels().find(c => c.id === entry.channel)
                return (
                  <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-bold">{entry.callsign}</span>
                        <span class="text-sm text-gray-400">{channel?.name}</span>
                      </div>
                      <div class="text-xs text-gray-500">
                        {new Date(entry.time).toLocaleTimeString()}
                      </div>
                    </div>
                    <div class="text-sm mb-2">{entry.transcript}</div>
                    <div class="flex justify-between text-xs text-gray-400">
                      <span>Duration: {entry.duration}s</span>
                      <span class={getSignalColor(entry.signal)}>Signal: {entry.signal} dBm</span>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'icscommand' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={icsRoles()}>
              {role => (
                <div class={`bg-gray-800 rounded-lg p-4 ${role.vacant ? 'opacity-70' : ''}`}>
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">{role.name}</span>
                    <span class={`px-2 py-0.5 rounded text-xs ${role.vacant ? 'bg-red-600' : 'bg-green-600'}`}>
                      {role.vacant ? 'VACANT' : 'ASSIGNED'}
                    </span>
                  </div>
                  <div class="text-sm text-gray-400 mb-3">{role.description}</div>
                  <input
                    placeholder="Assign person..."
                    value={role.assigned}
                    onInput={(e) => assignIcsRole(role.id, e.target.value)}
                    class="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      )}
    </div>
  )
}

export default RadioChannelManagement