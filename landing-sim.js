// universal constants
const G = 6.6743E-11;

// timestep, number of steps
let dt;
let n_steps;
let method;

// planet radius, density
let r_pl;
let dens_pl;

let m_pl;

// acceleration due to gravity (on the surface)
//const aG = (G * m_pl) / r_pl**2;
// (debug)
//console.log("aG: " + aG);

// initial position
//const r_orb = 6000;
let s0_x;
let s0_y;

// initial velocity, calc. for orbit insertion
//let v0_x = Math.sqrt((G*m_pl)/r_orb);
let v0_x;
let v0_y;
// (debug)
//console.log("v0_x (v_orb): " + v0_x);

// canvas
const canv_h = 600;
const canv_w = 600;
// zoom (-> maybe calc. due to planet radius)
let zoom;
const r_spaceship = 1;
//const col_spaceship = 'rgb(220, 120, 20)';
const canvas = document.getElementById("mycanv");
const ctx = canvas.getContext('2d');

let pauseAfterLandingCheckbox = document.querySelector('#pauseAfterLanding');
let pauseAfterLanding = pauseAfterLandingCheckbox.checked;
pauseAfterLandingCheckbox.addEventListener('change', evt => { pauseAfterLanding = evt.target.checked; });

function draw_fixed() {
  // draw the canvas and csys
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, canv_h, canv_w);
  ctx.strokeStyle = 'rgb(50, 50, 50)';
  ctx.beginPath();
  ctx.moveTo(0, canv_h/2);
  ctx.lineTo(canv_w, canv_h/2);
  ctx.moveTo(canv_w/2, 0);
  ctx.lineTo(canv_w/2, canv_h);
  ctx.closePath();
  ctx.stroke();

  // draw the planet
  ctx.strokeStyle = 'rgb(20, 200, 150)';
  ctx.beginPath();
  ctx.arc(canv_w/2, canv_h/2, r_pl*zoom, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.stroke();
}

function draw_spaceship(col_spaceship, pos_x, pos_y, r=r_spaceship) {
    ctx.strokeStyle = col_spaceship;
    ctx.beginPath();
    ctx.arc(canv_w/2 + pos_x*zoom, canv_h/2 - pos_y*zoom, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();
}

function draw_vector(s_x, s_y, e_x, e_y) {
    ctx.strokeStyle = 'rgb(220, 30, 30)';
    ctx.beginPath();
    ctx.moveTo(canv_w/2 + s_x*zoom, canv_h/2 - s_y*zoom);
    ctx.lineTo(canv_w/2 + e_x*zoom, canv_h/2 - e_y*zoom);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'rgb(20, 100, 200)';
    ctx.beginPath();
    ctx.arc(canv_w/2 + e_x*zoom, canv_h/2 - e_y*zoom, 2, 0, Math.PI * 2, true);
    ctx.stroke();
}
//draw_vector(-2000, -1300, 1100, -700);

function getLengthVec(x, y) {
  return Math.sqrt(x**2 + y**2);
}

function getUnitVec(x, y) {
  const l = getLengthVec(x, y);
  return [ x / l, y / l ]
}

function getDotProduct(x0, y0, x1, y1) {
  return x0 * x1 + y0 * y1;
}

function getGravAccel(s_x, s_y) {
  const aG = (G * m_pl) / getLengthVec(s_x, s_y)**2;
  const [ u_x, u_y ] = getUnitVec(s_x, s_y);
  const aG_x = -u_x * aG;
  const aG_y = -u_y * aG;
  return [ aG_x, aG_y ]
}

// craft accell. due to thrust, 0 for now...
function getProgThrustAccel(vx, vy) {
  // pro/retrograde
  //const aT = -0.0005;
  const [ ux, uy ] = getUnitVec(vx, vy);
  const aT_x = ux * aT_prog;
  const aT_y = uy * aT_prog;
  return [ aT_x, aT_y ];
}

let landed = false;
function checkStatus(sx, sy) {
  if (getLengthVec(sx, sy) <= r_pl && landed == false) {
    landed = true;
    document.getElementById("res-vxvy").innerHTML = v0_x + ", " + v0_y;
    const [ ux, uy ] = getUnitVec(sx, sy);
    const v_vert = getDotProduct(ux, uy, v0_x, v0_y);
    const v_vert_x = ux * v_vert;
    const v_vert_y = uy * v_vert;
    const v_hor = Math.sqrt((v0_x - v_vert_x)**2 + (v0_y - v_vert_y)**2);
    draw_vector(sx, sy, sx + v_vert_x*1000, sy + v_vert_y*1000);
    const v_hor_x = v0_x - v_vert_x;
    const v_hor_y = v0_y - v_vert_y;
    draw_vector(sx, sy, sx + v_hor_x*1000, sy + v_hor_y*1000);
    console.log("v vert: " + v_vert);
    console.log("v hor: " + v_hor);
  }
  if (getLengthVec(v0_x, v0_y) < 0.1) {
    draw_spaceship('rgb(20, 230, 40)', sx, sy, 5);
  }
}

function runEuler() {
  for (let i = 0; i < n_steps; i++) {
    //draw_vector(s0_x, s0_y, s0_x + aG_x*4E5, s0_y + aG_y*4E5);
    const [ aG_x, aG_y ] = getGravAccel(s0_x, s0_y);
    const [ aT_x, aT_y ] = getProgThrustAccel(v0_x, v0_y);
    const atot_x = aG_x + aT_x;
    const atot_y = aG_y + aT_y;

    const v1_x = v0_x + atot_x * dt;
    const v1_y = v0_y + atot_y * dt;

    const s1_x = s0_x + v1_x * dt;
    const s1_y = s0_y + v1_y * dt;

    draw_spaceship('rgb(220, 120, 20)', s1_x, s1_y);

    v0_x = v1_x;
    v0_y = v1_y;
    s0_x = s1_x;
    s0_y = s1_y;
    checkStatus(s0_x, s0_y);

    if(landed === true && pauseAfterLanding === true){
      return;
    }
  }
}
//draw_vector(s0_x, s0_y, s0_x + aG_x*4E5, s0_y + aG_y*4E5);

function runVerlet() {
  let s1_x = 0;
  let s1_y = 0;
  for (let i = 0; i < n_steps; i++) {

    if (i == 0) {
      const [ aG_x, aG_y ] = getGravAccel(s0_x, s0_y);
      const [ aT_x, aT_y ] = getProgThrustAccel(v0_x, v0_y);
      s1_x = s0_x + v0_x * dt + (1/2) * (aG_x + aT_x) * dt**2;
      s1_y = s0_y + v0_y * dt + (1/2) * (aG_y + aT_y) * dt**2;
      draw_spaceship('rgb(240, 20, 20)', s1_x, s1_y);
    }

    const [ aG1_x, aG1_y ] = getGravAccel(s1_x, s1_y);
    const [ aT_x, aT_y ] = getProgThrustAccel(s1_x - s0_x, s1_y - s0_y);

    s2_x = 2 * s1_x - s0_x + (aG1_x + aT_x) * dt**2;
    s2_y = 2 * s1_y - s0_y + (aG1_y + aT_y) * dt**2;

    draw_spaceship('rgb(240, 20, 20)', s2_x, s2_y);

    s0_x = s1_x;
    s0_y = s1_y;
    s1_x = s2_x;
    s1_y = s2_y;
    checkStatus(s2_x, s2_y);

    if(landed === true && pauseAfterLanding === true){
      return;
    }
  }
}

function get_data() {
  dt = parseFloat(document.getElementById('in-dt').value);
  n_steps = parseFloat(document.getElementById('in-nsteps').value);
  zoom = parseFloat(document.getElementById('in-zoom').value);
  method = document.querySelector(".method:checked").value;

  r_pl = parseFloat(document.getElementById('in-rpl').value);
  dens_pl = parseFloat(document.getElementById('in-dens').value);
  m_pl = 4/3 * Math.PI * r_pl**3 * dens_pl;
  //console.log(dt);
  s0_x = parseFloat(document.getElementById('in-s0x').value);
  s0_y = parseFloat(document.getElementById('in-s0y').value);
  v0_x = parseFloat(document.getElementById('in-v0x').value);
  v0_y = parseFloat(document.getElementById('in-v0y').value);
  aT_prog = parseFloat(document.getElementById('in-aprog').value);
  //console.log(method);
}

function makeCircVx() {
  get_data();
  const vx_circ = Math.sqrt((G*m_pl)/s0_y);
  document.getElementById('in-v0x').value = vx_circ;
}

function makeEscapeVx() {
  get_data();
  const vx_esc = Math.sqrt((2*G*m_pl)/s0_y);
  document.getElementById('in-v0x').value = vx_esc;
}

function clear() {
  get_data();
  draw_fixed();
  draw_spaceship('rgb(220, 120, 20)', s0_x, s0_y);
  landed = false;
}
clear();

function run() {
  clear();
  get_data();

  if (method === "euler") {
    runEuler();
  } else if (method === "verlet") {
    runVerlet();
  } else {
    runEuler();
    get_data();
    runVerlet();
  }
}
