// Lumo Pomodoro Timer — Web Worker
// Runs in a separate thread so it's not throttled when the tab is hidden.
// Messages IN:  { type: "start", duration: number }
//               { type: "pause" }
//               { type: "resume" }
//               { type: "reset", duration: number }
// Messages OUT: { type: "tick", remaining: number }
//               { type: "done" }

let interval = null;
let remaining = 0;

function tick() {
  remaining = Math.max(0, remaining - 1);
  self.postMessage({ type: "tick", remaining });
  if (remaining === 0) {
    clearInterval(interval);
    interval = null;
    self.postMessage({ type: "done" });
  }
}

self.onmessage = function (e) {
  const { type, duration } = e.data;
  switch (type) {
    case "start":
      clearInterval(interval);
      remaining = duration;
      self.postMessage({ type: "tick", remaining });
      interval = setInterval(tick, 1000);
      break;

    case "pause":
      clearInterval(interval);
      interval = null;
      break;

    case "resume":
      if (remaining > 0 && !interval) {
        interval = setInterval(tick, 1000);
      }
      break;

    case "reset":
      clearInterval(interval);
      interval = null;
      remaining = typeof duration === "number" ? duration : 25 * 60;
      self.postMessage({ type: "tick", remaining });
      break;
  }
};
