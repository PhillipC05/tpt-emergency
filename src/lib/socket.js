/**
 * Socket.io client singleton
 * Shared socket connection across all components
 */
import { io } from 'socket.io-client'

export const socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity
})

// Export for direct usage
export default socket