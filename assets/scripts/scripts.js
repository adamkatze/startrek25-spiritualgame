

const menuAnimSpeed = 500

var animatingMenu = false
var gameData = {}







function initApp() {
    currentGameScreen = 'holding'
    initSockets()

    endless = getUrlParameter('endless')
    
    $('body').attr('data-orientation',gameOrientation)

    let appw = gameOrientation == 'landscape' ? gameWidth : gameHeight;
    let apph = gameOrientation == 'landscape' ? gameHeight : gameWidth;    

    $('#app-wrapper').css('width',appw).css('height',apph)

    initFrames() 
    initGame()

    window.addEventListener('resize', scaleToFit);
    window.addEventListener('load', scaleToFit);

    initHoldingScreen()

    typeWriter('.holdingCopy', holdingCopy, 50, 50);
}



function initFrames() {   

    for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        img.src = `../images/plant_frames/frame${String(i).padStart(3, '0')}.png`;
        frames.push(img);
    }
}


function initHoldingScreen() {

    holdingRefresh = setInterval(function() {

        $(".holdingCopy").addClass('transition')
        $(".holdingCopy").addClass('fadeOut')

        setTimeout(function() {
            $(".holdingCopy").text('')
            $(".holdingCopy").removeClass('transition')
            $(".holdingCopy").removeClass('fadeOut')

        }, menuAnimSpeed)

        setTimeout(function() {
            if (currentGameScreen == 'holding') {
                sfx_readout.play()
            }            
            typeWriter('.holdingCopy', holdingCopy, 50, 50);
        }, menuAnimSpeed * 2)
        

    }, holdingTextRefreshRate)

}



//animateSwap(tar, '#gameWrapper', menuAnimSpeed, 0, animatingMenu)


/*----------------------------------------------------------------------------------------- */
/*------------------------------Game Functions--------------------------------------------*/
/*----------------------------------------------------------------------------------------- */

function begin(userName = '') {

    //Prevent new scans from starting games until this one is over
    if (!gameInProgress) {
        gameInProgress = true

        sfx_bridge_01.play()

        $('.playerName').html(`Cadet<br>${userName}`)

        if (showInstructionsScreen) {
            showInstructions()
        } else {
            startGame() 
        }
    } else {
        console.log('game in progress')
    }
}


function showInstructions() {

    currentGameScreen = 'instructions'

    animateSwap('#holding', '#instructions', menuAnimSpeed, 0, animatingMenu)


    //Draw the instruction text
    typeWriter('.insTextGood',   insCopyGood, 30, 50);
    typeWriter('.insTextBad',    insCopyBad, 30, 50);
    typeWriter('.insTextBottom', insCopyBottom, 30, 50);


    let instructionsTimeout = setTimeout(function() {
        if (gameOver) {
            startGame()
        }        
    }, instructionsScreenTimeout)

}







function startGame() {   
    //Hide menu
    let tar = showInstructionsScreen ? '#instructions' : '#holding'
    animateSwap(tar, '#gameWrapper', menuAnimSpeed, 0, animatingMenu)

    gameStart = true
    if (game == undefined) {
        initGame()
    } else {
        scene.scene.restart()
    }

    sfx_bridge_02.play()
    startCountdown()
}





function startCountdown() {
    console.log('starting countdown')
    let cur = countDownLength
    $('.countDown-Value').text(cur)

    let timerText = formatTime(0, 'remaining')
    $('.gameTimer').html(timerText)

    sfx_countdown.play()

    let countdownInterval = setInterval(function() {
        if (cur <= 0) {
            startTime = new Date()            
            timerStart = true
            clearInterval(countdownInterval)
            $('.countDown').addClass('fadeOut')
        } else {
            sfx_countdown.play()
        }

        cur = cur - 1
        if ( cur > 0 ) {
           $('.countDown-Value').text(cur)
        } else{
            $('.countDown-Value').text('GO')
        }        

        
    }, 1000)
}








function showGameOver() {
    currentGameScreen = 'gameover'
    animateSwap('#gameWrapper', '#score', menuAnimSpeed, 0, animatingMenu)

    setTimeout(function() {
        typeWriter('.gameOverText', gameOverCopy, 50, 50);
    }, menuAnimSpeed)
}







function resetGame() {   
    currentGameScreen = 'holding'

    iconsGroup.length = 0
    timerStart = false
    lastIconWasGood = true

    $('.countDown').removeClass('fadeOut')
    $('.gameTimer').removeClass('warning')

    animateSwap('#score', '#holding', menuAnimSpeed, 0, animatingMenu)

    sfx_bridge_01.play()

    setTimeout(function() {
        currentScore = 0
        currentPlantStage = 0
        updatePlantLevel()

        gameInProgress = false
    }, menuAnimSpeed)
    
}















/*----------------------------------------------------------------------------------------- */
/*------------------------------Helper Functions--------------------------------------------*/
/*----------------------------------------------------------------------------------------- */

//Animates the swap between two elements that are in the same position
function animateSwap(el_hide, el_show, speed, delay, animFlag) {

    animFlag = true

    setTimeout(function() {
        $(el_hide).removeClass('animIn') 
  
        setTimeout(function() {
          $(el_hide).addClass('hide')
          $(el_show).removeClass('hide')
        }, speed)
  
        setTimeout(function() {
          $(el_show).addClass('animIn')
        }, speed + 1)

        setTimeout(function() {
          animFlag = false
        }, speed * 2)
      }, delay)
  
  }


function randomInRange(min, max, action) {
    let rand = Math.random() * (max - min) + min;

    if (action == 'floor') {
        return Math.floor(rand);
    } else if (action == 'round') {
        return Math.round(rand);
    } else {
        return rand
    }
    
}


function scaleToFit() {
    const baseWidth = gameOrientation == 'landscape' ? gameWidth : gameHeight;
    const baseHeight = gameOrientation == 'landscape' ? gameHeight : gameWidth;

    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);

    const wrapper = document.getElementById('app-wrapper');
    wrapper.style.transform = `scale(${scale})`;

    // Center the scaled content manually
    const offsetX = (window.innerWidth - baseWidth * scale) / 2;
    const offsetY = (window.innerHeight - baseHeight * scale) / 2;
    wrapper.style.left = `${offsetX}px`;
    wrapper.style.top = `${offsetY}px`;

    // 🧠 Notify Phaser about size (if game is already loaded)
    if (window.game && window.game.scale) {
        window.game.scale.resize(baseWidth, baseHeight);
    }
    
}



function getDatabase(action, url) {

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const responseData = JSON.parse(xhr.responseText);
            if (action == 'log') {
                console.log(responseData);
            }
            if ( action == 'drawLeaderboard' ) {
               drawLeaderboard(responseData)
            }       
            if ( action == 'drawLBTool' ) {
                drawLeaderboardTool(responseData, url)
            }
        } else {  console.error('Request failed. Status:', xhr.status); }
    };
    xhr.onerror = function() { console.error('Request failed. Network error.'); };
    xhr.send();
  }


  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(name);
    return param !== null ? param : false;
}


/*----------------------------------------------------------------------------------------- */
/*-----------------------------WebSockets---------------------------------------------------*/
/*----------------------------------------------------------------------------------------- */

const socket = io();


function sendCommand(command,data) {
   let message = {
      "action":command,
      "id": socket.id,
      "data":data
   }
   socket.emit('message', message);     
}


function initSockets() {

        //Handle socket messages
        socket.on('message', (data) => {        
            console.log('Received message:', data);  
            
            if (data.action == "newGame") {
                let rawData = data.data
                let dataJSON = JSON.parse(rawData);
                let userName = dataJSON.text

                console.log(userName)
                begin(userName)
            }
            
        })
    
        //On page load, request current game data from server
        let message = {
          "action":"reload",
        }
        socket.emit('message', message);     
}




//---------------LB Tool----------------------------------

function initLBTool() {
    console.log('init')
}

function drawLeaderboardTool(data,table) {

    console.log(data)

    $('.lbTable-Wrapper').html('')

    //Save all this data to tables array
    let index = tables.length
    tables[index] = data


    const allKeys = [...new Set(data.flatMap(obj => Object.keys(obj)))];

    let header = `<tr class="lbTable-Row lbTable-Header">`
    for (let i = 0; i < allKeys.length; i++) {
        header = header + `<td class="lbTable-Col" data-key="${allKeys[i]}">${allKeys[i]}</td>`
    }
    header = header + `<td class="lbTable-Col-Update" data-key="update">update</div></tr>`

    let rows = `<div class="lbTable-Wrapper" data-table-id="${index}">
                    <div class="lbTable-Conrtols">
                        <button class="export" onclick="exportAsCSV(${index})">Export</button>
                    </div>
                    <table class="lbTable" data-table="${table}"> 
                    ${header}`
    for (let i = 0; i < data.length; i++) {

        let cur = data[i]
        let newRow = `<tr class="lbTable-Row">`

        Object.entries(cur).forEach(([key, value]) => {
            newRow = newRow + `<td class="lbTable-Col" data-key="${key}">
                                    <input type="text" value="${value}">                                   
                                </td>`
        });

        newRow = newRow + `<td class="lbTable-Col-Update" data-key="update"><button type="" onclick="updateRow(this)">Update Row</button></tr>`

        rows = rows + newRow

    }
    rows = rows + `</table></div>`

    $('.lbOutput').append(rows)

    $('td.lbTable-Col[data-key="id"] input').attr('disabled',true)

    $('body').removeClass('updateBeforeExport')
}




function exportAsCSV(index) {

    const jsonArray = tables[index]

    // Convert to CSV
    const keys = Object.keys(jsonArray[0]);
    const csvRows = [
    keys.join(','), // header row
    ...jsonArray.map(obj => keys.map(key => JSON.stringify(obj[key] ?? '')).join(','))
    ];

    const csvString = csvRows.join('\n');

    // Trigger download in browser
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
    URL.revokeObjectURL(url); // Clean up

}

function updateRow(el) {

    $('body').addClass('updateBeforeExport')

    let fields = ``
    let values = []
    let table = $('table.lbTable').attr('data-table')

    $(el).closest('tr.lbTable-Row').find('td.lbTable-Col').each(function() {

        fields = fields + $(this).attr('data-key') + ','
        values.push($(this).find('input').val())

    })
    fields = fields.slice(0, -1)

    
    let playerData = {
        "table": table,
        "fields": fields,
        "values": values
    }
    console.log(playerData)
    sendCommand('addToTable', playerData)

}



/*----------------Plant Video Helper Functions-------------------- */

function showFrame(frameNumber) {
    currentFrame = frameNumber;
    document.getElementById('plantFrame').src = frames[frameNumber].src;
}

function playFrames(end, direction = 'forward') {
    animatingPlant = true
    $('.plantWrapper').attr('data-animating','true')
    cancelAnimationFrame(animationId);

    if (end < currentFrame) { direction = 'backward'}

    function step() {
        showFrame(currentFrame);

        if(direction === 'forward') {
            if(currentFrame >= end) {
                playFramesFinished()
                return;
            }
            currentFrame++;
        } else {
            if(currentFrame <= end) {
                playFramesFinished()
                return;
            }
            currentFrame--;
        }

        animationId = setTimeout(step, 1000 / fps);
    }

    //currentFrame = start;
    step();
}


function playFramesFinished() {
    animatingPlant = false
    $('.plantWrapper').attr('data-animating','false')
    
    updatePlantLevel() 
}





function typeWriter(target, lines, charDelay = 80, lineDelay = 500) {
    $(target).empty();
    const $cursor = $('<span class="typewriter-cursor"></span>');
    $(target).append($cursor);

    let lineIndex = 0;

    function typeLine() {
        let i = 0;
        const currentLine = lines[lineIndex];

        const interval = setInterval(() => {
            $cursor.before(currentLine[i]);
            i++;
            if (i >= currentLine.length) {
                clearInterval(interval);
                lineIndex++;
                if (lineIndex < lines.length) {
                    $cursor.before('<br>'); // add line break
                    setTimeout(typeLine, lineDelay); // wait before next line
                }
            }
        }, charDelay);
    }

    typeLine();
}
