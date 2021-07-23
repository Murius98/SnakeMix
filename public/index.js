const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const db = firebase.firestore();

var keys = [  { key: "w", code: [87] }, 
              { key: "s", code: [83] },
              { key: "a", code: [65] },
              { key: "d", code: [68] }]; //up, down, left, right
/*
var keys = [  { key: "w", code: [38, 87] }, 
              { key: "s", code: [40, 83] },
              { key: "a", code: [37, 65] },
              { key: "d", code: [39, 68] }]; //up, down, left, right
*/
var keyMap = [ "w", "s", "a", "d" ];

class SnakePart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

let speed = 5;

let tileCount = 20;
let tileSize = canvas.width / tileCount - 2;

let headX = 10;
let headY = 10;
const snakeParts = [];
let tailLength = 2;

let appleX = 5;
let appleY = 5;

let inputsXVelocity = 0;
let inputsYVelocity = 0;

let xVelocity = 0;
let yVelocity = 0;

let score = 0;

const gulpSound = new Audio("gulp.mp3");

loadLeaderBoard();

var top = [];

function loadLeaderBoard(){
  var html = "";
  var count = 1;
  db.collection('puntuaciones').orderBy('score', 'desc').limit(10).onSnapshot((snap) => {
    html = "";
    count = 1;
    snap.forEach((doc) => {
      if(doc.data()['username'] == "")
        html += '<div class="user"> <div class="user-info">' + count++ +'.- Sin nombre</div><div class="user-score">' + doc.data()['score'] + '</div></div>';
      else
        html += '<div class="user"> <div class="user-info">' + count++ +'.- ' + doc.data()['username'] + '</div><div class="user-score">' + doc.data()['score'] + '</div></div>';
    })
    document.getElementById("leaderboard").innerHTML = html;
  });
}

function saveScore(){
  Swal.fire({
    title: 'Registra tu puntuación (' + score + '):',
    input: 'text',
    inputPlaceholder: 'Ingresa tu nickname aquí',
    inputAttributes: {
      autocapitalize: 'off',
      color: "black"
    },
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    showLoaderOnConfirm: true,
    preConfirm: (nickname) => {
      return db.collection('puntuaciones').add({username: nickname, score: score});
    },
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire('¡Puntaje guardado!', 'La información se ha guardado con éxito, en caso de que tengas una puntuación alta, podrás observarla en la tabla de puntuaciones.', 'success');
    }
  })
}

//game loop
function drawGame() {
  xVelocity = inputsXVelocity;
  yVelocity = inputsYVelocity;

  changeSnakePosition();
  let result = isGameOver();
  if (result) {
    return;
  }

  clearScreen();

  checkAppleCollision();
  drawApple();
  drawSnake();

  drawScore();

  if (score > 5) {
    speed = 9;
  }
  if (score > 10) {
    speed = 11;
  }

  setTimeout(drawGame, 1000 / speed);
}

function isGameOver() {
  let gameOver = false;

  if (yVelocity === 0 && xVelocity === 0) {
    return false;
  }

  //walls
  if (headX < 0) {
    gameOver = true;
  } else if (headX === tileCount) {
    gameOver = true;
  } else if (headY < 0) {
    gameOver = true;
  } else if (headY === tileCount) {
    gameOver = true;
  }

  for (let i = 0; i < snakeParts.length; i++) {
    let part = snakeParts[i];
    if (part.x === headX && part.y === headY) {
      gameOver = true;
      break;
    }
  }

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "50px Pixel Emulator";
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop("1.0", "red");
    ctx.fillStyle = gradient;
    ctx.fillText("Game Over!", canvas.width / 24, canvas.height / 2);
    saveScore();
  }

  return gameOver;
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "10px Pixel Emulator";
  ctx.fillText("Puntuación " + score, 10, 20);
}

function clearScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
  ctx.fillStyle = "#00ff4e";
  for (let i = 0; i < snakeParts.length; i++) {
    let part = snakeParts[i];
    ctx.fillRect(part.x * tileCount, part.y * tileCount, tileSize, tileSize);
  }

  snakeParts.push(new SnakePart(headX, headY)); //put an item at the end of the list next to the head
  while (snakeParts.length > tailLength) {
    snakeParts.shift(); // remove the furthet item from the snake parts if have more than our tail size.
  }

  ctx.fillStyle = "#00d9ff";
  ctx.fillRect(headX * tileCount, headY * tileCount, tileSize, tileSize);
}

function changeSnakePosition() {
  headX = headX + xVelocity;
  headY = headY + yVelocity;
}

function drawApple() {
  if(score > 1 && (score + 1) % 3 == 0){
    ctx.fillStyle = "yellow";
  }else{
    ctx.fillStyle = "red";
  }
  ctx.fillRect(appleX * tileCount, appleY * tileCount, tileSize, tileSize);
}

function checkAppleCollision() {
  if (appleX === headX && appleY == headY) {
    appleX = Math.floor(Math.random() * tileCount);
    appleY = Math.floor(Math.random() * tileCount);
    tailLength++;
    score++;
    gulpSound.play();
    if(score > 2 && score % 3 == 0){
      suffle(keys);
    }
  }
}

function suffle(keys) {
  for (var i = keys.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = keys[i];
      keys[i] = keys[j];
      keys[j] = temp;
  }
  for( var i = 0; i < keys.length; i++) {
    document.getElementById(keyMap[i]).innerHTML = String(keys[i].key);
  }
}

document.body.addEventListener("keydown", keyDown);

function keyDown(event) {
  if (keys[0].code.findIndex((keyTemp) => keyTemp === event.keyCode) > -1){
    if (inputsYVelocity == 1) return;
    inputsYVelocity = -1;
    inputsXVelocity = 0;
  }

  //down
  if (keys[1].code.findIndex((keyTemp) => keyTemp === event.keyCode) > -1){
    if (inputsYVelocity == -1) return;
    inputsYVelocity = 1;
    inputsXVelocity = 0;
  }

  //left
  if (keys[2].code.findIndex((keyTemp) => keyTemp === event.keyCode) > -1){
    if (inputsXVelocity == 1) return;
    inputsYVelocity = 0;
    inputsXVelocity = -1;
  }

  //right
  if (keys[3].code.findIndex((keyTemp) => keyTemp === event.keyCode) > -1){
    if (inputsXVelocity == -1) return;
    inputsYVelocity = 0;
    inputsXVelocity = 1;
  }
}

drawGame();
