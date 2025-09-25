//---------------Configurable Options------------------------

const showInstructionsScreen = true         //Shows the instruction screen if true, otherwise goes directly to game
const instructionsScreenTimeout = 8000      //Timeout in ms for before the instruction screen goes away and game begins
const gameLength = 30000;                   //Length of gameplay in ms
const scorePerStage = [0,1,4,9,16]          //Breakpoints for total score vs plant's growth stage

const iconsSpawnWithMovement = true         //If true, icons will spawn with some velocity
const initialIconCount = 5                  //How many icons are spawned at the start of the game
const maxIcons = 13                         //Maximum amount of icons on screen at any given time
const maxIconLife = 12000                   //How long an untouched icon will stay on screen before being despawned
const iconSpawnTime = 3000                  //How frequently a new icon will spawn

const playCollisionSFX = true               //If true, plays a sound effect on all icon and world boundray collisions
const gameOverTimeout = 10000               //How long to wait after game over before automatically restarting the game




//------------------------------Game Settings------------------------------------
const gameWidth = 1920          
const gameHeight = 1080
const gameOrientation = 'landscape'
const gameAspectRatio = '16x9'

const gameScale = 0.3
const iconScale = 0.6


const countDownLength = 3;
const growByStages = true


const typeOutGameText = true
var holdingRefresh
const holdingTextRefreshRate = 10000

const holdingCopy = [
    "Welcome, Cadet.",
    " ",
    "In this assignment, you will",
    "cultivate and sustain",
    "a living specimen.",
    " ",
    "How you nurture it will",
    "shape its growth."
]

const insCopyGood = [
    "Drag and drop essential",
    "resources toward the specimen",
    "to make it grow."
]
const insCopyBad = [
    "Avoid any harmful elements",
    "that threaten its survival."
]
const insCopyBottom = [
    "The stronger the growth,",
    "the higher your score."
]

const gameOverCopy = [
    "Every decision",
    "shapes your future.",
    "",
    "Growth begins within."
]

const timerWarningTime = 10000




//------------------Scoring Zone-----------------
const zoneX = 1700;
const zoneY = 940;
const zoneWidth = 400;
const zoneHeight = 400;


var depthSettings = {
    bg_sub: 10,
    bg : 20,
    enemies: 30,
    player : 40,
    explosions: 45,
    ui : 50,
    overlay: 60,
}







//--------------------------------------Global Variables-------------------------------------------------------
//------------------Do not change these--------------------------------
var game
var gameTick
var now

var gameInProgress = false
var currentGameScreen = 'loading'
var gameOver = true
var startTime

var gameStart = false
var timerStart = false

var currentScore = 0
var currentPlantStage = 0
const maxPlantStage = 4  // (max - 1)

const plantStageFrames = [0,112,224,336,447]


var goodIcons
var badIcons

var glowAnimTime = 500

var dragSpeed = 1000
var iconInertiaDecay = 200


var iconsGroup = []
var spawnTimer

var lastIconWasGood = true


const totalFrames = 449; // change to your total frames
var frames = [];

var currentFrame = 0;
var animationId = null;
const fps = 60;

var animatingPlant = false




/*-----SFX------------*/

var sfx_countdown
var sfx_bridge_01
var sfx_bridge_02
var sfx_bridge_03
var sfx_bridge_04
var sfx_readout

var sfx_blip_01
var sfx_blip_02
var sfx_blip_03
var sfx_blip_04