/**
 * Type declarations for pusher-js/react-native
 * This provides TypeScript support for the Pusher React Native module
 */

declare module 'pusher-js/react-native' {
  interface PusherOptions {
    cluster?: string
    forceTLS?: boolean
    authEndpoint?: string
    auth?: {
      headers?: Record<string, string>
      params?: Record<string, string>
    }
    enabledTransports?: string[]
    disabledTransports?: string[]
    activityTimeout?: number
    pongTimeout?: number
  }

  interface Channel {
    bind(eventName: string, callback: (data: any) => void): this
    unbind(eventName?: string, callback?: (data: any) => void): this
    unbind_all(): this
    trigger(eventName: string, data: any): boolean
  }

  interface PrivateChannel extends Channel {
    // Private channels can trigger client events
  }

  interface PresenceChannel extends Channel {
    members: {
      count: number
      each(callback: (member: { id: string; info: any }) => void): void
      get(id: string): { id: string; info: any } | null
      me: { id: string; info: any }
    }
  }

  interface ConnectionManager {
    bind(eventName: string, callback: (data?: any) => void): this
    unbind(eventName?: string, callback?: (data?: any) => void): this
    state: string
  }

  class Pusher {
    constructor(key: string, options?: PusherOptions)

    connection: ConnectionManager

    subscribe(channelName: string): Channel
    unsubscribe(channelName: string): void
    channel(channelName: string): Channel | undefined
    allChannels(): Channel[]

    bind(eventName: string, callback: (data: any) => void): this
    unbind(eventName?: string, callback?: (data: any) => void): this
    bind_global(callback: (eventName: string, data: any) => void): this
    unbind_global(callback?: (eventName: string, data: any) => void): this

    disconnect(): void
    connect(): void

    static log: (message: string) => void
    static logToConsole: boolean
  }

  export default Pusher
}
