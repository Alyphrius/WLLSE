// --- Utility functions ---
function mclamp(a, l, h) {
  return Math.min(Math.max(a, l), h);
}

function findnearbypt(x, y, list) {
  return list.find(p => Math.hypot(p.x - x, p.y - y) < 12);
}

function getmousepos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  return {
    x: (e.clientX - rect.left) * scale,
    y: (e.clientY - rect.top) * scale
  };
}

function datanormal(dat, width, height) {
  function a(p) {
    return { x: p.x / width, y: 1 - (p.y / height) };
  }
  return {
    mainpoints: dat.mainpoints.map(a),
    segments: dat.segments.map(s => ({ p0: a(s.p0), p1: a(s.p1), c0: a(s.c0), c1: a(s.c1) })),
    min: dat.min,
    max: dat.max
  };
}

function datadenormal(dat, width, height) {
  function a(p) {
    return { x: p.x * width, y: (1 - p.y) * height };
  }
  return {
    mainpoints: dat.mainpoints.map(a),
    segments: dat.segments.map(s => ({ p0: a(s.p0), p1: a(s.p1), c0: a(s.c0), c1: a(s.c1) })),
    min: dat.min,
    max: dat.max
  };
}

function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return ctx;
}

function updsegments(state) {
  const points = state.moddata.mainpoints;
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const d = (p1.x - p0.x) / 2.5;
    segments.push({
      p0,
      p1,
      c0: { x: mclamp(p0.x + d, p0.x, p1.x), y: p0.y },
      c1: { x: mclamp(p1.x - d, p0.x, p1.x), y: p1.y }
    });
  }
  state.moddata.segments = segments;
}

function drawmodcanvas(ctx, canvas, state) {
  const scale = window.devicePixelRatio || 1;
  const width = canvas.width / scale;
  const height = canvas.height / scale;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const segments = state.moddata.segments;
  const normed = datanormal(state.moddata, width, height);
  const jss = JSON.stringify(normed);
  state.vvalfield.value = "g!" + jss;

  // Draw curves
  for (let seg of segments) {
    ctx.beginPath();
    ctx.moveTo(seg.p0.x, seg.p0.y);
    ctx.bezierCurveTo(seg.c0.x, seg.c0.y, seg.c1.x, seg.c1.y, seg.p1.x, seg.p1.y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw handles
  ctx.strokeStyle = 'gray';
  for (let seg of segments) {
    ctx.beginPath();
    ctx.moveTo(seg.p0.x, seg.p0.y);
    ctx.lineTo(seg.c0.x, seg.c0.y);
    ctx.moveTo(seg.p1.x, seg.p1.y);
    ctx.lineTo(seg.c1.x, seg.c1.y);
    ctx.stroke();
  }

  // Draw control points
  for (let seg of segments) {
    [seg.c0, seg.c1].forEach(cp => {
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    });
  }

  // Draw main points
  for (let p of state.moddata.mainpoints) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = ([0, width].includes(p.x)) ? 'yellow' : 'blue';
    ctx.fill();
  }
}
function setupCanvasInteractions(canvas, ctx, state) {
  const scale = window.devicePixelRatio || 1;

  canvas.addEventListener("mousedown", (e) => {
    const { x, y } = getmousepos(canvas, e);
    state.mselectedpt = findnearbypt(x, y, state.moddata.mainpoints);
    state.mgdragtype = "main";

    if (!state.mselectedpt) {
      for (let s of state.moddata.segments) {
        state.mselectedpt = findnearbypt(x, y, [s.c0, s.c1]);
        if (state.mselectedpt) {
          state.mgdragtype = "ctrl";
          break;
        }
      }
    }

    if (!state.mselectedpt) {
      state.moddata.mainpoints.push({ x, y });
      state.moddata.mainpoints.sort((a, b) => a.x - b.x);
      updsegments(state);
      drawmodcanvas(ctx, canvas, state);
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    const { x, y } = getmousepos(canvas, e);
    const width = canvas.width / scale;

    if (state.mselectedpt) {
      if (![0, width].includes(state.mselectedpt.x)) {
        state.mselectedpt.x = mclamp(x, 0.01 * width, 0.99 * width);
      }
      state.mselectedpt.y = y;

      if (state.mgdragtype === "main") {
        state.moddata.mainpoints.sort((a, b) => a.x - b.x);
        updsegments(state);
      } else {
        for (let s of state.moddata.segments) {
          if (s.c0 === state.mselectedpt || s.c1 === state.mselectedpt) {
            state.mselectedpt.x = mclamp(x, s.p0.x, s.p1.x);
          }
        }
      }

      drawmodcanvas(ctx, canvas, state);
    }
  });

  canvas.addEventListener("mouseup", () => {
    state.mselectedpt = null;
    state.mgdragtype = null;
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const { x, y } = getmousepos(canvas, e);
    const width = canvas.width / scale;
    state.mselectedpt = findnearbypt(x, y, state.moddata.mainpoints);

    if (state.mselectedpt && ![0, width].includes(state.mselectedpt.x)) {
      const idx = state.moddata.mainpoints.indexOf(state.mselectedpt);
      if (idx !== -1) {
        state.moddata.mainpoints.splice(idx, 1);
        updsegments(state);
        drawmodcanvas(ctx, canvas, state);
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("editorCanvas");
  const ctx = setupCanvas(canvas);

  // --- Wait for data from the opener ---
  function waitForData() {
    const openerData = window.opener && window.opener.__modEditorData__;
    if (!openerData) {
      requestAnimationFrame(waitForData); // Try again next frame
      return;
    }

    const { key, data, vvalfield } = openerData;
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;

    const state = {
      modvar: key,
      moddata: datadenormal(JSON.parse(data), width, height),
      vvalfield: vvalfield,
      mselectedpt: null,
      mgdragtype: null
    };

    updsegments(state);
    drawmodcanvas(ctx, canvas, state);

    // Attach interaction listeners (unchanged)
    setupCanvasInteractions(canvas, ctx, state);
  }

  waitForData();
});


// // --- Initialization ---
// window.addEventListener("DOMContentLoaded", () => {
//   const canvas = document.getElementById("editorCanvas");
//   const ctx = setupCanvas(canvas);

//   // Expecting parent to send this data
//   const openerData = window.opener.__modEditorData__;
//   const { key, data, vvalfield } = openerData;
//   const scale = window.devicePixelRatio || 1;
//   const width = canvas.width / scale;
//   const height = canvas.height / scale;

//   const state = {
//     modvar: key,
//     moddata: datadenormal(JSON.parse(data), width, height),
//     vvalfield: vvalfield,
//     mselectedpt: null,
//     mgdragtype: null
//   };

//   updsegments(state);
//   drawmodcanvas(ctx, canvas, state);

//   canvas.addEventListener("mousedown", (e) => {
//     const { x, y } = getmousepos(canvas, e);
//     state.mselectedpt = findnearbypt(x, y, state.moddata.mainpoints);
//     state.mgdragtype = "main";

//     if (!state.mselectedpt) {
//       for (let s of state.moddata.segments) {
//         state.mselectedpt = findnearbypt(x, y, [s.c0, s.c1]);
//         if (state.mselectedpt) {
//           state.mgdragtype = "ctrl";
//           break;
//         }
//       }
//     }

//     if (!state.mselectedpt) {
//       state.moddata.mainpoints.push({ x, y });
//       state.moddata.mainpoints.sort((a, b) => a.x - b.x);
//       updsegments(state);
//       drawmodcanvas(ctx, canvas, state);
//     }
//   });

//   canvas.addEventListener("mousemove", (e) => {
//     const { x, y } = getmousepos(canvas, e);
//     const width = canvas.width / scale;

//     if (state.mselectedpt) {
//       if (![0, width].includes(state.mselectedpt.x)) {
//         state.mselectedpt.x = mclamp(x, 0.01 * width, 0.99 * width);
//       }
//       state.mselectedpt.y = y;

//       if (state.mgdragtype === "main") {
//         state.moddata.mainpoints.sort((a, b) => a.x - b.x);
//         updsegments(state);
//       } else {
//         for (let s of state.moddata.segments) {
//           if (s.c0 === state.mselectedpt || s.c1 === state.mselectedpt) {
//             state.mselectedpt.x = mclamp(x, s.p0.x, s.p1.x);
//           }
//         }
//       }

//       drawmodcanvas(ctx, canvas, state);
//     }
//   });

//   canvas.addEventListener("mouseup", () => {
//     state.mselectedpt = null;
//     state.mgdragtype = null;
//   });

//   canvas.addEventListener("contextmenu", (e) => {
//     e.preventDefault();
//     const { x, y } = getmousepos(canvas, e);
//     const width = canvas.width / scale;
//     state.mselectedpt = findnearbypt(x, y, state.moddata.mainpoints);

//     if (state.mselectedpt && ![0, width].includes(state.mselectedpt.x)) {
//       const idx = state.moddata.mainpoints.indexOf(state.mselectedpt);
//       if (idx !== -1) {
//         state.moddata.mainpoints.splice(idx, 1);
//         updsegments(state);
//         drawmodcanvas(ctx, canvas, state);
//       }
//     }
//   });
// });
