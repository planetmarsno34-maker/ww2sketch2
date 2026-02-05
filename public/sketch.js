const socket = io();

let me;

let balls = [];
let num = 20;

class Ball {
  constructor(x, y, r) {
    this.x = random(width);
    this.y = random(height);
    this.r = random(width / 20, width / 10);

    this.speedX = random(-5, 5);
    this.speedY = random(-5, 5);
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > width) {
      this.speedX *= -1;
    }
    if (this.y < 0 || this.y > height) {
      this.speedY *= -1;
    }
  }

  display() {
    ellipse(this.x, this.y, this.r, this.r);
    line(this.x, 0, this.x, height);
  }
}

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
  textAlign(CENTER);

  dustColor = color(218, 165, 32);
  growthColor = color(50, 200, 32);
  waterColor = color(72, 61, 255);

  for (let i = 0; i < num; i++) {
    balls[i] = new Ball();
  }
}

function draw() {
  background(0);

  if (experienceState.party) {
    stroke(random(255), random(255), random(255));
    fill(random(255), random(255), random(255));
  } else {
    fill(0);
  }
  for (let i = 0; i < num; i++) {
    balls[i].update();
    balls[i].display();
  }

  // draw all users
  for (let id in experienceState.users) {
    const u = experienceState.users[id];

    if (id === me) {
      textSize(30);
      text("⭐", mouseX, mouseY);
    } else {
      textSize(30);
      text("👻", mouseX, mouseY);
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
  // console.log("Checking... balls.length:", balls.length);
  // let distanceFromCenter = dist(mouseX, mouseY, width / 2, height / 2);
  for (let i = 0; i < balls.length; i++) {
    let d = dist(mouseX, mouseY, balls[i].x, balls[i].y);

    if (d < balls[i].r / 2) {
      console.log("inside");
      return true;
    }
  }
  console.log("outside");
  return false;
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
