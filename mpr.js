const mpr = (function(){

  let state = {};
  let ci = 0;
  let ca = [];
  let pathno = 0;

  let oldx = -1;
  let oldy = -1;
  let paint = false;
  let threshold = 0;

  let replay = document.querySelector('#replay');
  let o = document.querySelector('output');
  let dl = document.querySelector('#download');
  let pathdata = document.querySelector('#pathdata');
  let limit = document.querySelector('#fewer');

  let c = document.querySelector('canvas');
  let cpos = c.getBoundingClientRect();
  let cx = c.getContext('2d');
  c.width = 640;
  c.height = 400;
  let paths = {};
  let path = 1;

  const getxy = (e) => {
     return {
       x: e.x - cpos.x + window.scrollX,
       y: e.y - cpos.y + window.scrollY
      }
  }

  const paintline = (x, y) => {
    cx.beginPath();
    cx.fillStyle = "rgb(0,0,0)";
    cx.arc(x, y, 5, 0, 2 * Math.PI);
    cx.fill();
    cx.closePath();
    cx.beginPath();
    if (oldx > 0 && oldy > 0) {
      cx.moveTo(oldx - 0, oldy - 0)
    }
    cx.strokeStyle = "rgba(0,200,0,0.6)";
    cx.lineCap = 'round';
    cx.lineWidth = 10;
    cx.lineTo(x - 0 , y - 0);
    cx.stroke();
    cx.closePath();
    oldx = x;
    oldy = y;
  }

  const replayPath = i => {
    if (i === 0) {
      pathno = 0;
      cx.clearRect(0,0,c.width,c.height);
    }
    if(Object.entries(paths)[i]) {
      ca = Object.entries(paths)[i][1];
      ci = 0;
      state.plot();
    }
  }

  state.plot = () => {
    paintline(ca[ci] * 2, ca[ci+1] * 2);
    if (ca[ci + 1]) {
      ci += 2
      setTimeout('mpr.state.plot()', 10);
    } else {
      pathno++;
      replayPath(pathno);
    }
  }

  const startPathRecording = e => {
    if(!paint) {
      paths[path] = [];
      o.classList.add('recording');
    } else {
      o.classList.remove('recording');
      writePathData(paths[path]);
      oldx = -1;
      oldy = -1;
      path++;
    }
    paint = !paint;
  };

  const writePathData = _ => {
    let out = '';
    out = JSON.stringify(paths);
    out = out.replace(/:/g,":\n");
    out = out.replace(/\],/g,"],\n");
    out = out.replace(/\{/g,"{\n");
    out = out.replace(/\}/g,"\n}");
    out = out.replace(/,/g,", ");
    let all = 0;
    for(p of Object.keys(paths)) {
      all += paths[p].length;
    }
    o.classList.remove('guru');
    o.innerHTML = all + ' points';
    dl.classList.remove('inactive');
    replay.classList.remove('inactive');
    pathdata.innerHTML = out;
    pathdata.scrollTop = pathdata.scrollHeight;
    dl.setAttribute('href', 
    'data:application/json;charset=utf-8,' +
     encodeURIComponent(JSON.stringify(paths)));
    dl.setAttribute('download', 'paths.txt');
  }

  const recordPath = e => {
    if (paint) {
      let x = getxy(e).x;
      let y = getxy(e).y;
      if (oldx > 0 && oldy > 0) {
        if (Math.abs(oldx-x) < threshold &&
            Math.abs(oldy-y) < threshold) {
          return false;
        }
      } 
      paths[path].push(x/2|0,y/2|0);
      paintline(x, y);
      o.innerHTML = paths[path].length + ' new points';
    }
  }

/* Getting the background image */

const loadImage = (file, name) => {
  let img = new Image();
  img.src = file;
  img.onload = function() {
      c.style.background = `url(${img.src})`;
      c.style.backgroundSize = 'contain';
  };
}

const loadText = (file) => {
  let reader = new FileReader();
  reader.onload = function(event) {
    validatetext(event.target.result);
  }
  reader.readAsText(file);
}
const validatetext = text => {
  try { JSON.parse(text); }
  catch (e) {
    o.innerHTML = 'Error: invalid format';
    o.classList.add('guru');
    return false;
  }
  o.classList.remove('guru');
  paths = JSON.parse(text);
  path = Object.keys(paths).length + 1
  writePathData();
  replayPath(0);
}

const imageFromUpload = (e) => {
  let file = e.target.files[0];
  if (file.type.indexOf('image') !== -1) {
    loadImage(window.URL.createObjectURL(file), file.name);
  } else {
    loadText(file);
  }
  e.preventDefault();
}
const updatepaths = (e) => {
  validatetext(pathdata.value);
}

replay.addEventListener('click',e => {replayPath(0)});
limit.addEventListener('click',e => {
  threshold = e.target.checked ? 10 : 0
});
c.addEventListener('mousedown',startPathRecording);
c.addEventListener('mousemove',recordPath);
pathdata.addEventListener('change', updatepaths);
document.querySelector('#getfile').
addEventListener('change', imageFromUpload, false);

return {state:state};

})();