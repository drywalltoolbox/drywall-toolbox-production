export const DTB_GLOBAL_LOADING_START_EVENT = 'dtb:global-loading:start';
export const DTB_GLOBAL_LOADING_END_EVENT = 'dtb:global-loading:end';

function dispatchGlobalLoadingEvent(eventName) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(eventName));
}

export function emitGlobalLoadingStart() {
  dispatchGlobalLoadingEvent(DTB_GLOBAL_LOADING_START_EVENT);
}

export function emitGlobalLoadingEnd() {
  dispatchGlobalLoadingEvent(DTB_GLOBAL_LOADING_END_EVENT);
}
