import { Event, ipcRenderer } from "electron";

export type Listener = (ev: Event, ...args) => void;

export function exposeEvents<T extends readonly string[]>(appEventTypes : T, channel: string) {
  type AppEventType = typeof appEventTypes[number];
  const listeners = Object.fromEntries(
    appEventTypes.map( k => [k, new Map<Symbol, Listener>()])
  ) as Record<AppEventType, Map<Symbol, Listener>>;
  if ((process.type === 'renderer')) {
    // Only execute under preload (renderer) process!
    ipcRenderer?.on(channel, (ev: Event, eventType: string, ...args: any[]) => {
      listeners?.[eventType]?.forEach(listener => {
        setTimeout( () => listener.call(null, ev, args), 0 );
      });
    });
  }

  interface EventObject {
    on(type: AppEventType, listener: Listener, identifer: Symbol) : EventObject;
    off(type: AppEventType, identifer: Symbol);
    once(type: AppEventType, listener: Listener);
  }

  const self : EventObject = {
    on(eventName: AppEventType, listener: Listener, identifer = Symbol()) {
      listeners?.[eventName]?.set(identifer, listener);
      return self;
    },
    off(eventName: AppEventType, identifer: Symbol) {
      listeners?.[eventName]?.delete(identifer);
      return self;
    },
    once(eventName: AppEventType, listener: Listener) {
      let identifer = Symbol();
      listeners?.[eventName]?.set(identifer, function wrapped(ev: Event) {
        listeners?.[eventName].delete(identifer);
        listener.call(null, ev);
      });
      return self;
    },
  }
  return self;
}
