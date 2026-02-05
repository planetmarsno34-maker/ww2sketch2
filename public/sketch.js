const socket = io();

let me;

// Mirror of experience state on client side
let experienceState = {
  users: {},
  partyradius: 0,
  party: false,
};

// throttle mouse updates
let lastSent = 0;
const SEND_RATE = 30; // ms (~33 fps)

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textAlign(CENTER);

  dustColor = color(218, 165, 32);
  growthColor = color(50, 200, 32);
  waterColor = color(72, 61, 255);
}

function draw() {
  background(200);

  if (experienceState.party) {
    fill(random(255), random(255), random(255));
  } else {
    stroke(0);
    noFill();
  }
  circle(width / 2, height / 2, width * experienceState.partyradius);

  // draw all users
  for (let id in experienceState.users) {
    const u = experienceState.users[id];

    if (id === me) {
      fill(u.color, 0, 0);
      circle(mouseX, mouseY, 30);
    } else {
      fill(u.color, 0, 0);
      circle(u.x * width, u.y * height, 15);
    }
  }
}

// SEND MOVEMENT (throttled, i.e. send less often)
function mouseMoved() {
  let now = millis();
  if (now - lastSent < SEND_RATE) {
    return;
  }

  lastSent = now;

  socket.emit("move", {
    x: mouseX / width,
    y: mouseY / height,
    inRadius: checkMyDistance(),
  });
}

function checkMyDistance() {
  let distanceFromCenter = dist(mouseX, mouseY, width / 2, height / 2);
  if (distanceFromCenter < (experienceState.partyradius * width) / 2) {
    return true;
  } else {
    return false;
  }
}

// SOCKET EVENTS

// initial full state
socket.on("init", (data) => {
  me = data.id;
  experienceState = data.state;
  console.log(experienceState);
});

// someone joined
socket.on("userJoined", (data) => {
  experienceState.users[data.id] = data.user;
});

// someone left
socket.on("userLeft", (id) => {
  delete experienceState.users[id];
});

// someone moved
socket.on("userMoved", (data) => {
  let id = data.id;
  if (experienceState.users[id]) {
    experienceState.users[id].x = data.x;
    experienceState.users[id].y = data.y;
  }
});

// update to farm grid
socket.on("partyTime", (value) => {
  // console.log(data);
  experienceState.party = value;
});

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
