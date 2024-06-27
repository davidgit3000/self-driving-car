const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;
const verticalButtons = document.getElementById("verticalButtons");

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

let road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

const maxSpeed = document.getElementById("maxSpeedField");
const startGame = document.getElementById("startGame");
const instruction = document.getElementById("instruction");

const getMaxSpeed = () => {
  let maxSpeedVal = parseInt(maxSpeed.value, 10);
  if (isNaN(maxSpeedVal) || maxSpeedVal < 3 || maxSpeedVal > 10) {
    maxSpeedVal = 3; // Default max speed
  }
  console.log(maxSpeedVal);
  return maxSpeedVal;
};

const N = 1;
let cars = [];
let bestCar;
let controlType = "KEYS";

startGame.addEventListener("click", () => {
  networkCanvas.style.display = "none";
  verticalButtons.style.display = "none";

  instruction.innerHTML =
    "You can adjust the speed while playing too. Input the speed and select Start";
  const maxSpeed = getMaxSpeed();
  cars = generateCars(N, maxSpeed);

  start();
});

let aiPlay = document.getElementById("ai_play");

aiPlay.addEventListener("click", () => {
  startGame.disabled = true;
  maxSpeed.disabled = true;
  instruction.style.display = "none";
  networkCanvas.style.display = "block";
  verticalButtons.style.display = "flex";
  controlType = "AI";
  const currMaxSpeed = getMaxSpeed();
  cars = generateCars(N, currMaxSpeed);
  bestCar = cars[0];

  if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
      if (i != 0) {
        NeuralNetwork.mutate(cars[i].brain, 0.1);
      }
    }
  }
  start();
});

const traffic = [];
const getRandomLane = () => Math.floor(Math.random() * 3); // Random number between 0 and 2 inclusive

const generatePositions = (count, min, max, laneCount, minDistance) => {
  const positions = [];
  for (let lane = 0; lane < laneCount; lane++) {
    let currentPos = min;
    for (let i = 0; i < count / laneCount; i++) {
      const position1 = currentPos;
      const position2 =
        currentPos - minDistance - Math.floor(Math.random() * 100); // Randomize the distance a bit
      positions.push({ lane, position: position1 });
      positions.push({ lane, position: position2 });
      currentPos = position2 - minDistance;
    }
  }
  return positions;
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const MIN_POSITION = -100;
const MAX_POSITION = -1000;
const NUM_CARS = 100;
const MIN_DISTANCE = 250; // Minimum distance between pairs of cars
const LANE_COUNT = 2; // Number of lanes

const positions = generatePositions(
  NUM_CARS,
  MIN_POSITION,
  MAX_POSITION,
  LANE_COUNT,
  MIN_DISTANCE
);
shuffleArray(positions);

for (const pos of positions) {
  traffic.push(
    new Car(
      road.getLaneCenter(getRandomLane()),
      pos.position,
      30,
      50,
      "DUMMY",
      2,
      getRandomColor()
    )
  );
}

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
  localStorage.removeItem("bestBrain");
}

function start() {
  if (cars.length > 0) {
    animate();
  } else {
    console.error("No cars to animate.");
  }
}

function generateCars(N, maxSpeed) {
  const cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(
      new Car(road.getLaneCenter(1), 100, 30, 50, controlType, maxSpeed)
    );
  }
  return cars;
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }

  for (i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }

  bestCar = cars.find((c) => c.y == Math.min(...cars.map((c) => c.y)));
  if (!bestCar) {
    console.error("No best car found.");
    return;
  }

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx);
  }

  carCtx.globalAlpha = 0.2;
  for (i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx);
  }
  carCtx.globalAlpha = 1;
  if (bestCar.brain) {
    bestCar.draw(carCtx, true);
  } else {
    bestCar.draw(carCtx);
  }

  carCtx.restore();

  if (bestCar.brain) {
    networkCtx.lineDashOffset = -time / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
  }

  requestAnimationFrame(animate);
}
