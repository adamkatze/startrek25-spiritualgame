var config = {
    type: Phaser.AUTO,
    transparent: true,
    parent: 'gameContainer',
    scale: {
        mode: Phaser.Scale.NONE, // Let us handle scaling
        autoCenter: Phaser.Scale.NO_CENTER, // We'll center manually
        width: gameWidth,
        height: gameHeight,       
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            fps: 60 
        },
    },
    fps: { 
        max: 60,
        min: 20,
        target: 60,
    },
    dom: {
        createContainer: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};



//--------------------------------------Game Functions-------------------------------------------------------
function initGame() {
    game = new Phaser.Game(config);
    window.game = game;
}

function preload () {
    scene = this;
    gameW = scene.game.renderer.width
    gameH = scene.game.renderer.height       

    this.load.image('icon_good01', '../images/icon_Sun.png');
    this.load.image('icon_good02', '../images/icon_Water.png');
    this.load.image('icon_good03', '../images/icon_Positive words-1.png');
    this.load.image('icon_good04', '../images/icon_postive words-2.png');
    this.load.image('icon_good05', '../images/icon_positive words-3.png');

    this.load.image('icon_bad01', '../images/icon_no sun.png');
    this.load.image('icon_bad02', '../images/icon_no water.png');
    this.load.image('icon_bad03', '../images/icon_negative words-1.png');
    this.load.image('icon_bad04', '../images/icon_negative words-2.png');
    this.load.image('icon_bad05', '../images/icon_negative words-3.png');

    goodIcons = ["icon_good01", "icon_good02", "icon_good03", "icon_good04", "icon_good05"];
    badIcons  = ["icon_bad01", "icon_bad02", "icon_bad03", "icon_bad04", "icon_bad05"];
    
}

function create () {
    scene.DEPTH = depthSettings

    //Init groups for game objects
    scene.iconsGroup = scene.physics.add.group();

    //Create the scoring zone
    scene.scoringZone = scene.add.zone(zoneX, zoneY, zoneWidth, zoneHeight);
    scene.physics.world.enable(scene.scoringZone);
    scene.scoringZone.body.setAllowGravity(false);
    scene.scoringZone.body.setImmovable(true);

    //Debug box for score zone
    const debugZone = this.add.graphics();
    debugZone.fillStyle(0x00ff00, 0.3); // green, 30% opacity
    debugZone.fillRect(zoneX - zoneWidth / 2, zoneY - zoneHeight / 2, zoneWidth, zoneHeight);
    debugZone.lineStyle(2, 0x00ff00, 1); // 2px green border
    debugZone.strokeRect(zoneX - zoneWidth / 2, zoneY - zoneHeight / 2, zoneWidth, zoneHeight);


    //Watch for icons to hit the scoring zone
    scene.physics.add.overlap(scene.iconsGroup, scene.scoringZone, handleScore)

    //Make icons collide with each other
    scene.physics.add.collider(this.iconsGroup, this.iconsGroup);


    scene.time.addEvent({
        delay: iconSpawnTime,  // 4000 ms = 4 seconds
        callback: spawnIcon,   // function to call
        callbackScope: this,   // ensure 'this' refers to the scene
        loop: true             // repeat indefinitely
    });

    if (gameStart) {
        drawGame()
    }

}



//----------------------------------------------------Update -------------------------------------------------
function update (time, delta) {
    now = this.time.now; // Current time in ms

    gameTick++
    if (gameTick > 100) {
      gameTick = 0
    }    

    //Update the game elements while game is active
    if (  gameOver == false) {
       updatePlantLevel()

       if ( timerStart ) { 
        updateTimer() 
        handleInput()
        
      }
    }

}




//--------------------------------------Update Timer----------------------------------------
function updateTimer() {  

  //Elapsed time since game start in ms 
  let curT = new Date();
  let msElapsed = curT.getTime() -  startTime.getTime() 

  let timerText = formatTime(msElapsed, 'remaining')
  $('.gameTimer').html(timerText)

 
  if ( msElapsed > gameLength ) {    
    drawGameOver()
  } 

}



function formatTime(time, format) {   

    let ms = time
    if (format == 'remaining') {
        ms = gameLength - time
    }

    let hours   = Math.floor(ms / 3600000);
    let minutes = Math.floor((ms % 3600000) / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);
    let millis  = Math.floor((ms % 1000) / 10); // 0–99 instead of 0–999

    // Pad with leading zeros
    hours   = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');
    millis  = String(millis).padStart(2, '0'); // 2 digits

    return `<div class="mm">${minutes}</div>:<div class="ss">${seconds}</div>:<div class="ms">${millis}</div>`;
    //return `${hours}:${minutes}:${seconds}:${millis}`;
 
}



//-----------------------------------------------------------------------------------------------------
function drawGame() {

    currentPlantStage = 0

    startTime = new Date()
   
    currentGameScreen = 'game'
    gameOver = false
    
    for (let i = 0; i < initialIconCount; i++) {
       spawnIcon()
    }
    
}  







function spawnIcon() {
  // Limit number of icons
  if (scene.iconsGroup.getLength() >= maxIcons) return;


  // Decide whether to spawn good or bad
  const isGood = Phaser.Math.Between(0, 1) === 1;

  // Pick a random texture from the chosen pool
  const pool = isGood ? goodIcons : badIcons;
  const textureKey = Phaser.Utils.Array.GetRandom(pool);

  // Create the sprite
  const x = Phaser.Math.Between(100, 1400);
  const y = Phaser.Math.Between(100, 900);
  let icon = scene.physics.add.sprite(x, y, textureKey);

  //Add the icon to the icon group
  scene.iconsGroup.add(icon)

  icon.setScale(iconScale);
  icon.isGood = isGood;
  icon.setCollideWorldBounds(true);
  icon.setBounce(0.4);
  
  icon.setInteractive({ draggable: true });
  scene.input.setDraggable(icon);

  //icon.body.setDamping(true);
  icon.body.setDrag(iconInertiaDecay, iconInertiaDecay); // controls inertia fall-off

  // Automatically despawn after 15 seconds
  icon.despawnTimer = scene.time.delayedCall(maxIconLife, () => {
    fadeOutIcon(icon);
  });
 
  
 
  return icon;
}


function fadeOutIcon(icon) {
    if (!icon.active) return;

    scene.tweens.add({
        targets: icon,
        alpha: 0,
        duration: 1000,
        onComplete: () => icon.destroy()
    });
}


function handleScore(zone, icon) {

    if (!icon.scored) {
       if (icon.isGood) {
            currentScore = currentScore + 1
        } else if ( currentScore > 0) {
            currentScore = currentScore - 1
        }           
        
        icon.scored = true;
    }

    icon.removeInteractive()
    icon.destroy();

    //Spawn a new icon to replace this
    spawnIcon() 

    //Check current score to see if the plant level should change
    let stage = 0;
    for (let i = 0; i < scorePerStage.length; i++) {        
        if (currentScore >= scorePerStage[i]) {
            stage = i + 1;
        }
    }

    if (stage !== currentPlantStage) {
        currentPlantStage = stage;
        updatePlantLevel()
    }


}





function updatePlantLevel() {
    $('.growthLevel-Icons').attr('data-stage',currentPlantStage)
    $('.plantWrapper').attr('data-stage',currentPlantStage)
}



function drawGameOver() {
    gameOver = true   
    showGameOver()    
}









//-----------------------------------------------------------------------------------------------------
//--------------Input Functions------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------
function handleInput() {

    //Removes and readds despawn timers to the icons 
    scene.input.on('dragstart', (pointer, obj) => {
        obj.body.setVelocity(0, 0); 
        obj.body.setDrag(0, 0);

        console.log(obj)

        if (obj.despawnTimer) obj.despawnTimer.remove(false);
    });


const MAX_DRAG_SPEED = 1000;
const DEADZONE = 20; 
    scene.input.on('drag', function (pointer, icon, dragX, dragY) {
        

        // vector from icon to pointer
        const dx = dragX - icon.x;
        const dy = dragY - icon.y;

        // normalize vector and scale by MAX_DRAG_SPEED
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < DEADZONE) {
            icon.body.setVelocity(0, 0);
            return;
        }

        const vx = (dx / distance) * Math.min(distance * 20, MAX_DRAG_SPEED);
        const vy = (dy / distance) * Math.min(distance * 20, MAX_DRAG_SPEED);

        icon.body.setVelocity(vx, vy);
    });
    


    scene.input.on('dragend', (pointer, obj) => {
        obj.despawnTimer = scene.time.delayedCall(maxIconLife, () => {
            fadeOutIcon(obj);
        });

        

        obj.body.setDrag(iconInertiaDecay, iconInertiaDecay);
    });
}




function getChildById(group,id) {
    return group.getChildren().find(child => child.id === id);
}


function groupLength(group) {
    return scene[group].children.entries.length
}
















