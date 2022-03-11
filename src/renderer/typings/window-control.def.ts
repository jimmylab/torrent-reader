import type {
  windowEvents as _windowEvents,
  windowControls as _windowControls,
} from '../../main/window-control'

const windowEvents = (window as any).windowEvents as (typeof _windowEvents);
const windowControls = (window as any).windowControls as (typeof _windowControls);

export {
  windowEvents,
  windowControls,
}
