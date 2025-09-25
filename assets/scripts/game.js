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
        default: 'matter',
        matter: {
            gravity: { y: 0 },
            debug: false
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


    //SFX
    this.load.audio('sfx_countdown', '../sfx/COMPUTER_Starfleet Database_single.wav');
    this.load.audio('sfx_bridge_01', '../sfx/Bridge Sound 01.wav');
    this.load.audio('sfx_bridge_02', '../sfx/Bridge Sound 02.wav');
    this.load.audio('sfx_bridge_03', '../sfx/Bridge Sound 03.wav');
    this.load.audio('sfx_bridge_04', '../sfx/Bridge Sound 04.wav');

    this.load.audio('sfx_readout', '../sfx/Computer Read-Out.wav');

    this.load.audio('sfx_blip_01', '../sfx/blip_01.wav');
    this.load.audio('sfx_blip_02', '../sfx/blip_02.wav');
    this.load.audio('sfx_blip_03', '../sfx/blip_03.wav');
    this.load.audio('sfx_blip_04', '../sfx/blip_04.wav');


    
}

function create () {
    scene.DEPTH = depthSettings

    //Add 2 additional pointers, for a total of 3 (this allows for multiple touch inputs)
    scene.input.addPointer(2);


    //Create the bounds for the game
    scene.matter.world.setBounds(
            0,                // x
            0,                // y
            scene.sys.game.config.width,   // width
            scene.sys.game.config.height,  // height
            64,               // thickness of the walls
            true, true, true, true  // enable left, right, top, bottom
    );

    //Handle collisions between objects and boundaries
    scene.matter.world.on('collisionstart', (event) => {
        handleBounceCollision(event)
    });

    
    //Create the scoring zone
    scene.scoringZone = this.add.rectangle(zoneX, zoneY, zoneWidth, zoneHeight, 0x00ff00, 0);
    scene.matter.add.gameObject(scene.scoringZone, { isStatic: true });


    //Init the sfx
    sfx_countdown = scene.sound.add('sfx_countdown');
    sfx_bridge_01 = scene.sound.add('sfx_bridge_01');
    sfx_bridge_02 = scene.sound.add('sfx_bridge_02');
    sfx_bridge_03 = scene.sound.add('sfx_bridge_03');
    sfx_bridge_04 = scene.sound.add('sfx_bridge_04');
    sfx_readout =   scene.sound.add('sfx_readout');

    sfx_blip_01 = scene.sound.add('sfx_blip_01');
    sfx_blip_02 = scene.sound.add('sfx_blip_02');
    sfx_blip_03 = scene.sound.add('sfx_blip_03');
    sfx_blip_04 = scene.sound.add('sfx_blip_04');

 
    //Setup timer for spawning new icons 
    spawnTimer = scene.time.addEvent({
        delay: iconSpawnTime,  
        callback: spawnIcon,   
        callbackScope: this,   
        loop: true             
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

       if ( timerStart ) { 
        updateTimer() 
        handleInput()
        handleCollisions()
        
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

  //If were less than the timer cutoff time, make the time red
  if ( msElapsed > gameLength - timerWarningTime ) {    
    $('.gameTimer').addClass('warning')
  }

 
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
    updatePlantLevel() 
    playFrames(0)

    startTime = new Date()
   
    currentGameScreen = 'game'
    gameOver = false
    
    for (let i = 0; i < initialIconCount; i++) {
       spawnIcon()
    }

    
}  







function spawnIcon() {
  // Limit number of icons
  if (iconsGroup.length >= maxIcons) return;


  // Decide whether to spawn good or bad
  const isGood = lastIconWasGood

  // Pick a random texture from the chosen pool
  const pool = isGood ? goodIcons : badIcons;
  const textureKey = Phaser.Utils.Array.GetRandom(pool);

  // Create the sprite
  const x = Phaser.Math.Between(100, 1400);
  const y = Phaser.Math.Between(100, 900);
  let icon = scene.matter.add.image(x, y, textureKey);

  
  icon.setAlpha(0);
  icon.setScale(iconScale * 0.9);
  icon.isGood = isGood;
  icon.scored = false;
  icon.setBounce(0.4);
  
  icon.setInteractive({ draggable: true });
  scene.input.setDraggable(icon);

  icon.setFrictionAir(0.02); 

  //Fade the icon in
  scene.tweens.add({
        targets: icon,
        alpha: 1,
        scale: iconScale,
        duration: 500,   // fade in over 0.5s
        ease: 'Back.Out'
  });

  //Add velocity if this is toggled on
  if (iconsSpawnWithMovement) {
    const velX = Phaser.Math.Between(-10, 10);
    const velY = Phaser.Math.Between(-10, 10);
    icon.setVelocity(velX, velY);

    icon.setBounce(0.9);
    icon.setFrictionAir(0.003); 
  }



  // Automatically despawn after 15 seconds
  icon.despawnTimer = scene.time.delayedCall(maxIconLife, () => {
    fadeOutIcon(icon);
  });

  //Add the icon to the icon group
  iconsGroup.push(icon)
  
  //Flip the icon type flag
  lastIconWasGood = !lastIconWasGood
 
  return icon;
}


function fadeOutIcon(icon) {
    if (!icon.active) return;

    scene.tweens.add({
        targets: icon,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
            deleteIcon(icon, iconsGroup)
        }
    });
}



function deleteIcon(icon, iconsArray) {
    if (!icon || !icon.scene) return; // already destroyed

    // 🔹 Remove drag constraint if it exists
    if (icon.dragConstraint) {
        try {
            scene.matter.world.remove(icon.dragConstraint);
        } catch (e) {}
        icon.dragConstraint = null;
    }

    // 🔹 Remove pointer body if it exists
    if (icon.pointerBody) {
        try {
            scene.matter.world.remove(icon.pointerBody);
        } catch (e) {}
        icon.pointerBody = null;
    }

    // 🔹 Kill any tweens targeting this icon
    scene.tweens.killTweensOf(icon);

    // 🔹 Kill any delayed despawn timers
    if (icon.fadeTimer) {
        icon.fadeTimer.remove(false);
        icon.fadeTimer = null;
    }

    // 🔹 Remove from array
    if (iconsArray) {
        const idx = iconsArray.indexOf(icon);
        if (idx !== -1) iconsArray.splice(idx, 1);
    }

    // 🔹 Finally destroy the game object (removes Matter body too)
    icon.destroy();
}





function updatePlantLevel() {
    $('.growthLevel-Icons').attr('data-stage',currentPlantStage)
    $('.plantWrapper').attr('data-stage',currentPlantStage)
    $('.gameOver-Score').text(currentPlantStage + 1)

    if ( currentFrame != plantStageFrames[currentPlantStage] && !animatingPlant) {
        playFrames(plantStageFrames[currentPlantStage]);
    }
    
}







function drawGameOver() {
    gameOver = true   

    $('.gameTimer').text('00:00:00')
    spawnTimer.remove()
    spawnTimer = null

    showGameOver()    
}









function handleCollisions() {

    const zoneBounds = scene.scoringZone.getBounds();

    // Iterate backwards to safely remove items while looping
    for (let i = iconsGroup.length - 1; i >= 0; i--) {
        const icon = iconsGroup[i];

        // skip if icon is null, undefined, or already destroyed
        if (!icon || !icon.scene || !icon.active) {
            //deleteIcon(icon, iconsGroup)
            continue;
        }
        const iconBounds = icon.getBounds();

        if (Phaser.Geom.Intersects.RectangleToRectangle(iconBounds, zoneBounds)) {            
            handleScore(icon, i)
        }
    }

}








function animateScore(isGood) {
    if (isGood) {
        $('#plantFrameGlow, .plantWrapper').addClass('good').removeClass('bad')
        sfx_blip_03.play()
    } else {
        $('#plantFrameGlow, .plantWrapper').removeClass('good').addClass('bad')
        sfx_blip_04.play()
    }


    $('#plantFrameGlow, .plantGraphicBG, .plantWrapper').addClass('active')
    setTimeout(function() {
        $('#plantFrameGlow, .plantGraphicBG, .plantWrapper').removeClass('active')
    }, glowAnimTime)
}






function handleScore(icon, i) {

    //console.log(icon)

    if (!icon.scored) {
       if (icon.isGood) {
            currentScore = currentScore + 1
        } else if ( currentScore > 0) {
            currentScore = currentScore - 1
        }           

        animateScore(icon.isGood) 
        icon.scored = true;
    }

    deleteIcon(icon, iconsGroup)

    //Spawn a new icon to replace this
    spawnIcon() 

    //Check current score to see if the plant level should change
    let stage = 0;
    for (let i = 0; i < scorePerStage.length; i++) {        
        if (currentScore >= scorePerStage[i]) {
            stage = i;
        }
    }

    if (stage > maxPlantStage) { stage = maxPlantStage }

    currentPlantStage = stage      
    updatePlantLevel()

}



function handleBounceCollision(event) {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const gameObjectA = bodyA.gameObject;
        const gameObjectB = bodyB.gameObject;

        // Case 1: icon vs. icon
        if (currentGameScreen == 'game' && playCollisionSFX) {
            if (gameObjectA && gameObjectB &&
                iconsGroup.includes(gameObjectA) &&
                iconsGroup.includes(gameObjectB)) {
                
                scene.sound.play('sfx_blip_01', {
                    volume: Phaser.Math.FloatBetween(0.05, 0.1),
                    rate: Phaser.Math.FloatBetween(0.9, 1.1)
                });
            }

            // Case 2: icon vs. world bounds (no gameObject on bounds)
            if ((gameObjectA && iconsGroup.includes(gameObjectA) && !gameObjectB) ||
                (gameObjectB && iconsGroup.includes(gameObjectB) && !gameObjectA)) {

                scene.sound.play('sfx_blip_02', {
                    volume: Phaser.Math.FloatBetween(0.05, 0.1),
                    rate: Phaser.Math.FloatBetween(0.9, 1.1)
                });
            }
        }

    });
}


//-----------------------------------------------------------------------------------------------------
//--------------Input Functions------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------
function handleInput() {
    
    scene.input.on('dragstart', (pointer, icon) => {
        if (icon.isDragging) return;

        icon.pointerBody = scene.matter.add.circle(icon.x, icon.y, 1, { 
            isStatic: true, 
            collisionFilter: { mask: 0 } 
        });

        icon.dragConstraint = scene.matter.add.constraint(icon.pointerBody, icon.body, 0, 0.9);

        icon.isDragging = true;
        icon.activePointer = pointer; // store which pointer is dragging this icon

        //Cancel the despawn timer
        if (icon.despawnTimer) icon.despawnTimer.remove(false);
    });


    scene.input.on('drag', (pointer, icon, dragX, dragY) => {
        if (icon.pointerBody && icon.activePointer === pointer) {
            scene.matter.body.setPosition(icon.pointerBody, { x: dragX, y: dragY });
        }
    });



    scene.input.on('dragend', (pointer, icon) => {
        if (icon.activePointer !== pointer) return; // only the pointer that started can release

        if (icon.dragConstraint) {
            scene.matter.world.remove(icon.dragConstraint);
            icon.dragConstraint = null;
        }
        if (icon.pointerBody) {
            scene.matter.world.remove(icon.pointerBody);
            icon.pointerBody = null;
        }
        icon.isDragging = false;
        icon.activePointer = null;

        //Reinit the despawn timer
        icon.despawnTimer = scene.time.delayedCall(maxIconLife, () => {
            fadeOutIcon(icon);
        });
    });





    // Drag events
    //    scene.input.on('dragstart', (pointer, gameObject) => {
    //        gameObject.setIgnoreGravity(true);
    //    });

    //    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    //        gameObject.setPosition(dragX, dragY);
    //    });

    //    scene.input.on('dragend', (pointer, gameObject) => {
    //        gameObject.setIgnoreGravity(false);
    //        // Matter handles inertia automatically
    //    });
   
}




function getChildById(group,id) {
    return group.getChildren().find(child => child.id === id);
}


function groupLength(group) {
    return scene[group].children.entries.length
}








