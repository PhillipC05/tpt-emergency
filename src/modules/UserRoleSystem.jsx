/**
 * TPT Emergency System - User Role & Permission System
 * @module src/modules/UserRoleSystem.jsx
 * Role-based access control and user management system
 */

import { createSignal, createEffect, createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'

const UserContext = createContext()

export function UserProvider(props) {
  const [currentUser, setCurrentUser] = createStore({
    id: null,
    username: null,
    role: null,
    permissions: [],
    authenticated: false,
    lastLogin: null
  })

  const [userSessions, setUserSessions] = createStore([])
  const [permissionCache, setPermissionCache] = createStore({})

  // System role definitions
  const SYSTEM_ROLES = {
    ADMINISTRATOR: {
      level: 0,
      name: 'System Administrator',
      permissions: [
        'system.full_access',
        'users.manage',
        'modules.configure',
        'system.view_logs',
        'incidents.create',
        'incidents.edit',
        'incidents.delete',
        'units.dispatch',
        'units.manage',
        'resources.allocate',
        'triage.perform',
        'reports.generate'
      ]
    },
    DISPATCHER: {
      level: 1,
      name: 'Emergency Dispatcher',
      permissions: [
        'incidents.create',
        'incidents.edit',
        'units.dispatch',
        'units.view',
        'resources.view',
        'triage.view',
        'map.full_access'
      ]
    },
    FIELD_COMMANDER: {
      level: 2,
      name: 'Field Commander',
      permissions: [
        'incidents.view',
        'incidents.edit',
        'units.view',
        'units.update_status',
        'resources.allocate',
        'triage.perform',
        'map.full_access'
      ]
    },
    FIRST_RESPONDER: {
      level: 3,
      name: 'First Responder',
      permissions: [
        'incidents.view',
        'units.view',
        'units.update_status',
        'resources.view',
        'triage.view',
        'map.view'
      ]
    },
    OBSERVER: {
      level: 4,
      name: 'Observer',
      permissions: [
        'incidents.view',
        'map.view'
      ]
    }
  }

  /**
   * Authenticate user with credentials
   */
  const authenticate = async (username, password) => {
    // Demo authentication - in production would validate against backend
    const demoUsers = {
      admin: { role: 'ADMINISTRATOR', name: 'System Admin' },
      dispatch: { role: 'DISPATCHER', name: 'Dispatch Operator' },
      commander: { role: 'FIELD_COMMANDER', name: 'Incident Commander' },
      responder: { role: 'FIRST_RESPONDER', name: 'Field Responder' }
    }

    const user = demoUsers[username.toLowerCase()]
    
    if (user) {
      const role = SYSTEM_ROLES[user.role]
      
      setCurrentUser({
        id: Date.now(),
        username,
        displayName: user.name,
        role: user.role,
        roleLevel: role.level,
        permissions: role.permissions,
        authenticated: true,
        lastLogin: new Date().toISOString()
      })

      addSession({
        userId: currentUser.id,
        username,
        role: user.role,
        loginTime: new Date().toISOString()
      })

      return { success: true, user: currentUser }
    }

    return { success: false, error: 'Invalid credentials' }
  }

  /**
   * Logout current user
   */
  const logout = () => {
    setCurrentUser({
      id: null,
      username: null,
      role: null,
      permissions: [],
      authenticated: false,
      lastLogin: null
    })
  }

  /**
   * Check if current user has specific permission
   */
  const hasPermission = (permission) => {
    if (!currentUser.authenticated) return false
    if (currentUser.role === 'ADMINISTRATOR') return true
    
    return currentUser.permissions.includes(permission)
  }

  /**
   * Check if user has minimum role level access
   */
  const hasRoleLevel = (minimumRole) => {
    if (!currentUser.authenticated) return false
    
    const requiredLevel = SYSTEM_ROLES[minimumRole]?.level || 99
    return currentUser.roleLevel <= requiredLevel
  }

  /**
   * Add new user session
   */
  const addSession = (sessionData) => {
    const session = {
      id: Date.now() + Math.random(),
      active: true,
      ...sessionData
    }
    setUserSessions(userSessions.length, session)
  }

  /**
   * Get all active sessions
   */
  const getActiveSessions = () => {
    return userSessions.filter(s => s.active)
  }

  createEffect(() => {
    // Pre-calculate permission cache for fast lookups
    if (currentUser.authenticated) {
      const cache = {}
      currentUser.permissions.forEach(p => cache[p] = true)
      setPermissionCache(cache)
    } else {
      setPermissionCache({})
    }
  })

  const value = {
    currentUser,
    userSessions,
    SYSTEM_ROLES,
    authenticate,
    logout,
    hasPermission,
    hasRoleLevel,
    getActiveSessions
  }

  return (
    <UserContext.Provider value={value}>
      {props.children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

/**
 * Permission Guard Component
 * Protects content based on user permissions
 */
export function PermissionGuard(props) {
  const user = useUser()
  
  const hasAccess = () => {
    if (props.permission) return user.hasPermission(props.permission)
    if (props.minRole) return user.hasRoleLevel(props.minRole)
    return user.currentUser.authenticated
  }

  return hasAccess() ? props.children : props.fallback || null
}

export default UserProvider