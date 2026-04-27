/**
 * TPT Emergency System - Granular Permission System
 * @module src/modules/PermissionSystem.jsx
 * Role-based access control, permissions matrix and security management
 */

import { createSignal, onMount, For } from 'solid-js'

export function PermissionSystem() {
  const [activeTab, setActiveTab] = createSignal('roles')
  const [roles, setRoles] = createSignal([])
  const [users, setUsers] = createSignal([])
  const [permissions, setPermissions] = createSignal([])
  const [selectedRole, setSelectedRole] = createSignal(null)
  const [selectedUser, setSelectedUser] = createSignal(null)

  const generateMockData = () => {
    const permissionList = [
      { id: 'incident.view', name: 'View Incidents', category: 'incident', description: 'View all incident details' },
      { id: 'incident.create', name: 'Create Incidents', category: 'incident', description: 'Create new incident records' },
      { id: 'incident.edit', name: 'Edit Incidents', category: 'incident', description: 'Modify existing incidents' },
      { id: 'incident.delete', name: 'Delete Incidents', category: 'incident', description: 'Remove incident records' },
      { id: 'incident.close', name: 'Close Incidents', category: 'incident', description: 'Mark incidents as resolved' },
      { id: 'units.view', name: 'View Units', category: 'units', description: 'View unit status and locations' },
      { id: 'units.dispatch', name: 'Dispatch Units', category: 'units', description: 'Assign and dispatch units' },
      { id: 'units.edit', name: 'Edit Units', category: 'units', description: 'Modify unit details' },
      { id: 'personnel.view', name: 'View Personnel', category: 'personnel', description: 'View personnel information' },
      { id: 'personnel.edit', name: 'Edit Personnel', category: 'personnel', description: 'Modify personnel records' },
      { id: 'messaging.send', name: 'Send Messages', category: 'messaging', description: 'Send broadcast messages' },
      { id: 'messaging.receive', name: 'Receive Messages', category: 'messaging', description: 'Receive unit messages' },
      { id: 'admin.users', name: 'Manage Users', category: 'admin', description: 'Create and modify user accounts' },
      { id: 'admin.roles', name: 'Manage Roles', category: 'admin', description: 'Configure roles and permissions' },
      { id: 'admin.settings', name: 'System Settings', category: 'admin', description: 'Modify system configuration' },
      { id: 'audit.view', name: 'View Audit Log', category: 'audit', description: 'Access system audit logs' },
      { id: 'map.view', name: 'View Map', category: 'map', description: 'Access map features' },
      { id: 'map.edit', name: 'Edit Map Objects', category: 'map', description: 'Draw and modify map elements' },
    ]

    const roleList = [
      {
        id: 'admin',
        name: 'Administrator',
        color: 'bg-red-600',
        level: 1,
        description: 'Full system access',
        permissions: permissionList.map(p => p.id)
      },
      {
        id: 'commander',
        name: 'Incident Commander',
        color: 'bg-orange-600',
        level: 2,
        description: 'Incident command and control',
        permissions: permissionList.filter(p => !p.id.startsWith('admin.') || p.id === 'admin.settings').map(p => p.id)
      },
      {
        id: 'dispatcher',
        name: 'Dispatcher',
        color: 'bg-yellow-600',
        level: 3,
        description: 'Call center and dispatch operations',
        permissions: permissionList.filter(p => 
          ['incident.view', 'incident.create', 'incident.edit', 'units.view', 'units.dispatch', 'messaging.send', 'messaging.receive', 'map.view'].includes(p.id)
        ).map(p => p.id)
      },
      {
        id: 'supervisor',
        name: 'Unit Supervisor',
        color: 'bg-blue-600',
        level: 4,
        description: 'Unit supervision and management',
        permissions: permissionList.filter(p => 
          ['incident.view', 'incident.edit', 'units.view', 'personnel.view', 'messaging.receive', 'map.view'].includes(p.id)
        ).map(p => p.id)
      },
      {
        id: 'responder',
        name: 'Field Responder',
        color: 'bg-green-600',
        level: 5,
        description: 'Field personnel access',
        permissions: permissionList.filter(p => 
          ['incident.view', 'units.view', 'messaging.receive', 'map.view'].includes(p.id)
        ).map(p => p.id)
      },
      {
        id: 'observer',
        name: 'Observer',
        color: 'bg-gray-600',
        level: 6,
        description: 'Read-only access',
        permissions: permissionList.filter(p => p.id.endsWith('.view')).map(p => p.id)
      }
    ]

    const userList = [
      { id: 'u1', name: 'Admin User', username: 'admin', role: 'admin', status: 'active' },
      { id: 'u2', name: 'John Smith', username: 'jsmith', role: 'commander', status: 'active' },
      { id: 'u3', name: 'Sarah Johnson', username: 'sjohnson', role: 'dispatcher', status: 'active' },
      { id: 'u4', name: 'Michael Brown', username: 'mbrown', role: 'supervisor', status: 'active' },
      { id: 'u5', name: 'Emily Davis', username: 'edavis', role: 'responder', status: 'active' },
      { id: 'u6', name: 'David Wilson', username: 'dwilson', role: 'responder', status: 'active' },
      { id: 'u7', name: 'Lisa Anderson', username: 'landerson', role: 'observer', status: 'inactive' },
    ]

    setPermissions(permissionList)
    setRoles(roleList)
    setUsers(userList)
  }

  const getRoleById = (id) => roles().find(r => r.id === id)
  const getPermissionById = (id) => permissions().find(p => p.id === id)

  const hasPermission = (roleId, permissionId) => {
    const role = getRoleById(roleId)
    return role?.permissions.includes(permissionId) || false
  }

  const togglePermission = (roleId, permissionId) => {
    setRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const newPermissions = role.permissions.includes(permissionId)
          ? role.permissions.filter(p => p !== permissionId)
          : [...role.permissions, permissionId]
        return { ...role, permissions: newPermissions }
      }
      return role
    }))
  }

  const getCategoryColor = (category) => {
    return {
      'incident': 'bg-red-900/30 border-red-700',
      'units': 'bg-blue-900/30 border-blue-700',
      'personnel': 'bg-green-900/30 border-green-700',
      'messaging': 'bg-yellow-900/30 border-yellow-700',
      'admin': 'bg-purple-900/30 border-purple-700',
      'audit': 'bg-orange-900/30 border-orange-700',
      'map': 'bg-cyan-900/30 border-cyan-700'
    }[category] || 'bg-gray-900/30 border-gray-700'
  }

  onMount(() => {
    generateMockData()
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🔒 Granular Permission System</h2>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('roles')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'roles' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab('users')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'users' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'matrix' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Permission Matrix
        </button>
      </div>

      {activeTab() === 'roles' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-3 gap-4">
            <For each={roles()}>
              {role => (
                <div class={`bg-gray-800 rounded-lg p-4 ${selectedRole() === role.id ? 'border border-blue-500' : ''}`} onClick={() => setSelectedRole(role.id)}>
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class={`px-2 py-0.5 rounded text-xs ${role.color}`}>{role.name}</span>
                      <span class="text-xs text-gray-400">Level {role.level}</span>
                    </div>
                    <span class="text-sm text-gray-400">{role.permissions.length} permissions</span>
                  </div>
                  <div class="text-sm text-gray-400 mb-3">{role.description}</div>
                  {selectedRole() === role.id && (
                    <div class="border-t border-gray-700 pt-3 mt-2">
                      <div class="text-xs font-medium mb-2">Permissions:</div>
                      <div class="flex flex-wrap gap-1 max-h-32 overflow-auto">
                        <For each={role.permissions.slice(0, 12)}>
                          {pid => {
                            const perm = getPermissionById(pid)
                            return <span class="px-1 py-0.5 bg-gray-700 rounded text-xs">{perm?.name}</span>
                          }}
                        </For>
                        {role.permissions.length > 12 && (
                          <span class="px-1 py-0.5 bg-gray-600 rounded text-xs">+{role.permissions.length - 12} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'users' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={users()}>
              {user => {
                const role = getRoleById(user.role)
                return (
                  <div class={`bg-gray-800 rounded-lg p-4 ${selectedUser() === user.id ? 'border border-blue-500' : ''}`} onClick={() => setSelectedUser(user.id)}>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <span class={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <div>
                          <div class="font-medium">{user.name}</div>
                          <div class="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                      <span class={`px-2 py-0.5 rounded text-xs ${role?.color || 'bg-gray-600'}`}>
                        {role?.name || user.role}
                      </span>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'matrix' && (
        <div class="flex-1 overflow-auto">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-700">
                  <th class="text-left py-2 px-2 sticky left-0 bg-gray-900">Permission</th>
                  <For each={roles()}>
                    {role => (
                      <th class="text-center py-2 px-2 min-w-24">
                        <span class={`px-2 py-0.5 rounded text-xs ${role.color}`}>{role.name}</span>
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={Object.groupBy(permissions(), p => p.category)}>
                  {(perms, category) => (
                    <>
                      <tr class="bg-gray-800/50">
                        <td colspan={roles().length + 1} class={`py-2 px-2 font-medium capitalize border-l-2 ${getCategoryColor(category())}`}>
                          {category()}
                        </td>
                      </tr>
                      <For each={perms}>
                        {perm => (
                          <tr class="border-b border-gray-800 hover:bg-gray-800/30">
                            <td class="py-2 px-2 sticky left-0 bg-gray-900">
                              <div class="font-medium">{perm.name}</div>
                              <div class="text-xs text-gray-500">{perm.description}</div>
                            </td>
                            <For each={roles()}>
                              {role => (
                                <td class="text-center py-2 px-2">
                                  <button
                                    onClick={() => togglePermission(role.id, perm.id)}
                                    class={`w-6 h-6 rounded flex items-center justify-center mx-auto ${hasPermission(role.id, perm.id) ? 'bg-green-600' : 'bg-gray-700'}`}
                                  >
                                    {hasPermission(role.id, perm.id) ? '✓' : ''}
                                  </button>
                                </td>
                              )}
                            </For>
                          </tr>
                        )}
                      </For>
                    </>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PermissionSystem