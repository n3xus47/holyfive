// Pause offscreen canvases and stop their animation when the page is hidden.
export function observeCanvasLifecycle({ target, activeFps = 30, onChange = () => {} }) {
  let visible = true;
  let disposed = false;
  let lastFrame = -Infinity;
  const notify = () => onChange();
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    notify();
  });
  observer.observe(target);
  document.addEventListener('visibilitychange', notify);
  return {
    wantsLoop: () => !disposed && visible && !document.hidden,
    shouldThrottleFrame(now) {
      if (now - lastFrame < 1000 / activeFps) return true;
      lastFrame = now;
      return false;
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', notify);
    },
  };
}
