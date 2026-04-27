/**
 * Global keyboard shortcut system for dispatch operators
 * Dispatchers don't use mice, all common operations available via keyboard
 */
const shortcuts = []
let enabled = true

export function registerShortcut(key, callback, description, scope = 'global') {
  shortcuts.push({
    key: key.toLowerCase(),
    callback,
    description,
    scope
  })
}

export function enableKeyboardShortcuts() {
  enabled = true
}

export function disableKeyboardShortcuts() {
  enabled = false
}

// Setup global listener
document.addEventListener('keydown', (e) => {
  if (!enabled) return
  
  // Ignore when user is typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    return
  }

  // Ignore modifier keys alone
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
    return
  }

  let key = ''
  if (e.ctrlKey) key += 'ctrl+'
  if (e.altKey) key += 'alt+'
  if (e.shiftKey) key += 'shift+'
  key += e.key.toLowerCase()

  const matched = shortcuts.find(s => s.key === key)
  
  if (matched) {
    e.preventDefault()
    e.stopPropagation()
    matched.callback(e)
  }
})

// Default emergency shortcuts
export function setupDefaultShortcuts(handlers) {
  registerShortcut('f1', handlers.newIncident, 'Create new incident')
  registerShortcut('f2', handlers.toggleMap, 'Toggle map view')
  registerShortcut('f3', handlers.toggleDispatch, 'Toggle dispatch console')
  registerShortcut('f4', handlers.showUnits, 'Show all units')
  registerShortcut('f5', handlers.allActiveIncidents, 'Show active incidents')
  registerShortcut('f12', handlers.panicButton, 'MAN DOWN PANIC ALARM')
  registerShortcut('escape', handlers.closeModal, 'Close all dialogs')
  registerShortcut('ctrl+p', handlers.printCurrent, 'Print current incident')
  registerShortcut('ctrl+s', handlers.quickSave, 'Quick save')
}

export function getRegisteredShortcuts() {
  return [...shortcuts]
}