const db = firebase.firestore();
const afs = firebase.auth();
const cvs = document.getElementById("snake");
const ctx = cvs.getContext("2d");
let provider = new firebase.default.auth.GoogleAuthProvider();
let userProfile = document.getElementById("user-profile");
let isLogged = false;
let userInfo;

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

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

function checkAccount(){
  afs.onAuthStateChanged((user) => {
    if(user){
      userInfo = user;
      isLogged = true;
      userProfile.innerHTML = '<div class="user-photo"><img src="' + user.photoURL + '"></div>';
      userProfile.innerHTML += '<div class="user-desc">' + user.displayName + '<br/><a onclick="logOut()">Cerrar sesión<a></div>';
      $("#user-profile").show('fast');
      $("#login-google").hide('fast');
    }else{
      isLogged = false
      userProfile.innertHTML = "";
      $("#user-profile").hide('fast');
      $("#login-google").show('fast');
    }
  });
}

function googleSignIn(){
  firebase
  .default.auth()
    .signInWithPopup(provider)
    .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;
      // This gives you a Google Access Token. You can use it to access the Google & FB API.
      //var token = credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      var userName = user.displayName.split(" ");
      var iud = user.uid;
      var userData;
      if (result.additionalUserInfo.isNewUser) {
        if(user){
          Toast.fire({
            icon: 'success',
            title: '¡Te damos la bienvenida a SnakeMix ' + userName[0] + '!'
          })
        }
      } else {
        if (user) {
          Toast.fire({
            icon: 'success',
            title: '¡Bienvenido de vuelta :D!'
          })
        }
      }
    })
    .catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
          Toast.fire({
            icon: 'error',
            title: '¡Ha ocurrido un error, intentalo en unos momentos!'
          })
    });
}

function logOut(){
  afs.signOut().then(() => {
    Toast.fire({
      icon: 'success',
      title: 'Esperamos que regreses pronto :)'
    })
  }).catch((error) => {
    console.error(error);
  });
}

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
  if(isLogged){
    db.collection('puntuaciones').add({username: userInfo.displayName, score: score, email: userInfo.email, id: userInfo.uid});
    Swal.fire({
      title: 'Obtuviste un total de <b>' + score + '</b>', 
      text: 'La información se ha guardado con éxito, en caso de que tengas una puntuación alta, podrás observarla en la tabla de puntuaciones.', 
      icon: 'success',
      confirmButtonText: 'Volver a jugar'
    });
  }else{
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Obtuviste un total de ' + score + ' puntos, si quieres registrar tu puntaje deberás registrarte para la próxima!',
      confirmButtonText: "Volver a jugar"
    })
  }
  reloadGame();
}

// draw everything to the canvas
function upKey(){
  direction({keyCode: 87})
}
function downKey(){
  direction({keyCode: 83})
}
function leftKey(){
  direction({keyCode: 65})
}

function rightKey(){
  direction({keyCode: 68})
}

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
          if(snake.findIndex((snakeTemp) => {snakeTemp.x === food.x && snakeTemp.y === food.y}) > -1)
            onBody = true;
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
        clearInterval(snakeGrow);
        dead.play();
        ctx.fillStyle = "white";
        ctx.font = "50px Pixel Emulator";
        var gradient = ctx.createLinearGradient(0, 0, cvs.width, 0);
        gradient.addColorStop("1.0", "red");
        ctx.fillStyle = gradient;
        ctx.fillText("Game Over!", cvs.width / 5, cvs.height / 2);
        saveScore();
    }else
      snake .unshift(newHead);
    
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

function reloadGame(){
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  start = false;
  onBody = false;
  snake = [];
  speed = 1;
  snake[0] = {
      x : 9 * box,
      y : 10 * box
  };

  food = {
      x : Math.floor(Math.random()*17+1) * box,
      y : Math.floor(Math.random()*15+3) * box
  }
  score = 0;
  newTime = 0;

  //control the snake
  d = "";

  game = setInterval(draw, 150 / speed);
  snakeGrow = setInterval(grow, 1000);
}

let game = setInterval(draw, 150 / speed);
let snakeGrow = setInterval(grow, 1000);

checkAccount();
loadLeaderBoard();