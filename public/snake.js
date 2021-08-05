const db = firebase.firestore();
const cvs = document.getElementById("snake");
const ctx = cvs.getContext("2d");

const box = 32;

const ground = new Image();
ground.src = "img/bg.png";

const foodImg = new Image();
foodImg.src = "img/food.png";


let dead = new Audio();
let eat = new Audio();
let up = new Audio();
let right = new Audio();
let left = new Audio();
let down = new Audio();
let start = false;
let onBody = false;

dead.src = "audio/dead.mp3";
eat.src = "audio/eat.mp3";
up.src = "audio/up.mp3";
right.src = "audio/right.mp3";
left.src = "audio/left.mp3";
down.src = "audio/down.mp3";

// create the snake

let snake = [];
let speed = 1;

snake[0] = {
    x : 9 * box,
    y : 10 * box
};

// create the food

let food = {
    x : Math.floor(Math.random()*17+1) * box,
    y : Math.floor(Math.random()*15+3) * box
}

// create the score var

let score = 0;
let newTime = 0;

//control the snake

let d;

document.addEventListener("keydown", direction);

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
  
function direction(event){
    let key = event.keyCode;
    if( key == 65 && d != "RIGHT"){
        if (!start) start = true;
        left.play();
        d = "LEFT";
    }else if(key == 87 && d != "DOWN"){
        if (!start) start = true;
        d = "UP";
        up.play();
    }else if(key == 68 && d != "LEFT"){
        if (!start) start = true;
        d = "RIGHT";
        right.play();
    }else if(key == 83 && d != "UP"){
        if (!start) start = true;
        d = "DOWN";
        down.play();
    }
}

// cheack collision function
function collision(head,array){
    for(let i = 0; i < array.length; i++){
        if(head.x == array[i].x && head.y == array[i].y){
            return true;
        }
    }
    return false;
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

// draw everything to the canvas

function draw(){
    
    ctx.drawImage(ground,0,0);
    for( let i = 0; i < snake.length ; i++){
        ctx.fillStyle = "#00ff4e";
        ctx.fillRect(snake[i].x,snake[i].y,box,box);
        
        ctx.strokeStyle = "#4f00ff";
        ctx.strokeRect(snake[i].x,snake[i].y,box,box)
    }

    ctx.drawImage(foodImg, food.x, food.y);
    
    // old head position
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;
    
    // which direction
    if( d == "LEFT") snakeX -= box;
    if( d == "UP") snakeY -= box;
    if( d == "RIGHT") snakeX += box;
    if( d == "DOWN") snakeY += box;
    
    console.log(snake);
    // if the snake eats the food
    if(snakeX == food.x && snakeY == food.y){
        if(newTime > 0){
          ctx.fillStyle = "red";
          ctx.font = "25px Pixel Emulator";
          ctx.fillText("-" + newTime,food.x,food.y);
        }
        for(var i = 0; i < newTime; i++){
            snake.pop();
        }
        score++;
        eat.play();
        do {
          food = {
              x : Math.floor(Math.random()*17+1) * box,
              y : Math.floor(Math.random()*15+3) * box
          }
          if(snake.findIndex((snake) => snake.x === food.x && snake.y === food.y) > 0){
            console.log("yikes")
            onBody = true;
          }
          else
            onBody = false;

        }while(onBody)
        if(newTime == 0){
            newTime = Math.round(5 + ((snake.length + 1)/4));
            timer();
        }else{
            newTime = Math.round(5 + ((snake.length + 1)/4));
        }
    }else{
        // remove the tail
        snake.pop();
    }
    
    // add new Head
    
    let newHead = {
        x : snakeX,
        y : snakeY
    }
    
    // game over
    
    if(snakeX < box || snakeX > 17 * box || snakeY < 3*box || snakeY > 17*box || collision(newHead,snake)){
        clearInterval(game);
        dead.play();
        ctx.fillStyle = "white";
        ctx.font = "50px Pixel Emulator";
        var gradient = ctx.createLinearGradient(0, 0, cvs.width, 0);
        gradient.addColorStop("1.0", "red");
        ctx.fillStyle = gradient;
        ctx.fillText("Game Over!", cvs.width / 5, cvs.height / 2);
        saveScore();
    }
    snake.unshift(newHead);
    
    ctx.fillStyle = "white";
    ctx.font = "38px Pixel Emulator";
    ctx.fillText(score,2*box,1.6*box);

    if (score > 5) {
      speed = 1.25;
    }
    else if (score > 10) {
      speed = 1.5;
    }
    else if (score > 15) {
      speed = 1.75;
    }
    else if (score > 20) {
      speed = 2;
    }

    ctx.fillStyle = "white";
    ctx.font = "38px Pixel Emulator";
    ctx.fillText(newTime, 17*box,1.6*box);
}

function timer(){
    if(newTime > 0){
        newTime--;
        setTimeout(timer, 1000);
    }
}

// call draw function every 100 ms
function grow(){
    if(start){
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;
        let newHead = {
            x : snakeX,
            y : snakeY
        }
        snake.unshift(newHead);
    }
}
let game = setInterval(draw, 150 / speed);
let g = setInterval(grow, 1000);


loadLeaderBoard();