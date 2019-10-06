// -------------------- Define Constants --------------------
const WKEY = 87;
const AKEY = 65;
const SKEY = 83;
const DKEY = 68;
const SPACE = 32;
const SHIFT = 16;

const DEGTORAD = Math.PI/180;

const TITLE = 0;
const HELP = 1;
const PLAINS = 2;
const MOUNTAINS = 3;
const SWAMP = 4;
const OVER =  5;

const PLAYERWALK = 5;
const PLAYERSPRINT = 10;
const PLAYERTURN = 0.17;
const PLAYERPOORTURN = 0.05;

const ENEMYSEEK = 0;
const ENEMYWAIT = 1;
const ENEMYCHARGE = 2;

const FOODEATEN = -1;
const FOODBUD = 0;
const FOODRIPE = 1;
const FOODROT = 2;



// -------------------- Main code --------------------

// ---------- Define global variables
var fps = 60;

var gameState = TITLE;

var wDown = false;
var aDown = false;
var sDown = false;
var dDown = false;

// global arrays to store references to game Objects
// these will be filled, emptied, and modified as new screens are loaded
var player;
var maxFoods = 30;
var foods = [];
var maxEnemies = 0;
var enemies = [];
var maxDecorations = 10;
var decorations = [];

// a reference to the spritesheet which will be updated as new screens are loaded
var sheet;

// global cycle used to change food objects
var foodProgress = Math.random() * 100;

// ---------- PIXI.js boiler plate code
var gameport = document.getElementById("gameport");

var renderer = PIXI.autoDetectRenderer({width: 600, height: 600, backgroundColor: 0xa66407});
gameport.appendChild(renderer.view);

var stage = new PIXI.Container();



// -------------------- Main PIXI Containers --------------------
// Create the main states of the game and add them to the stage

console.log("Start container definition");

// ---------- Start screen
var title = new PIXI.Container();
stage.addChild(title);

// Create title screen sprite
var titleSprite = new PIXI.Sprite( PIXI.Texture.fromFrame("GameTitle.png") );
titleSprite.anchor.set(0.5);
titleSprite.position.x = 300;
titleSprite.position.y = 300;

title.addChild(titleSprite);

// ---------- Help screen
var help = new PIXI.Container();
help.visible = false;
stage.addChild(help);

// ---------- Main game screen
var game = new PIXI.Container();
game.visible = false;
stage.addChild(game);

// ---------- Gameover screen
var gameover = new PIXI.Container();
gameover.visible = false;
stage.addChild(gameover);

// Create gameover screen sprite
var gameoverSprite = new PIXI.Sprite( PIXI.Texture.from("GameOver.png") );
gameoverSprite.anchor.set(0.5);
gameoverSprite.position.x = 300;
gameoverSprite.position.y = 300;

// Clicking on the game over page should return user to the title screen.
// Enable and attatch mouse handler
gameoverSprite.interactive = true;
gameoverSprite.on('click', loadTitle );

gameover.addChild(gameoverSprite);

// Create help screen sprite
var helpSprite = new PIXI.Sprite( PIXI.Texture.fromFrame("GameHelp.png") );
helpSprite.anchor.set(0.5);
helpSprite.position.x = 300;
helpSprite.position.y = 300;

// Clicking on the help page should return user to the title screen.
// Enable and attatch mouse handler
helpSprite.interactive = true;
helpSprite.on('click', loadTitle );

help.addChild(helpSprite);

console.log("Finish container definition");



// -------------------- Initialization --------------------

// Load sprite sheet with all game's sprites
PIXI.loader.add("Assets.json").load( initializeSprites );

// Create the sprites that will be used in every biome
function initializeSprites()
{
  sheet = PIXI.loader.resources["Assets.json"];

  // The main screen will always have the player and food, so add those now

  // populate decorations array with decorations that will be given a new texture
  // each time a level is loaded
  for( let index = 0; index < maxDecorations; index++ )
  {
    // create decoration sprite with a placeholder texture
    var dec = new PIXI.Sprite( sheet.textures["FoodBud.png"] );
    decorations.push( dec );
    game.addChild( dec );
  }

  // populate food array with food
  for( let index = 0; index < maxFoods; index++ )
  {
    // create a new sprite of sligthly variable size
    var food = new PIXI.Sprite( sheet.textures["FoodBud.png"] );
    food.anchor.set(0.5);
    food.scale.set(0.8 + Math.random() * 0.4);

    // scatter them
    food.x = Math.random() * renderer.width;
    food.y = Math.random() * renderer.height;

    // create object to store Sprite and lifecycle
    let foodObj = new Food( food );

    foods.push( foodObj );
    game.addChild( food );
  }

  player = new Player();
  player.player.position.x = 300;
  player.player.position.y = 300;
  game.addChild(player.player);

  // Add buttons to the title screen
  var startButton = new PIXI.Sprite( sheet.textures["StartButton.png"] );
  startButton.anchor.set(0.5);
  startButton.position.x = 300;
  startButton.position.y = 150;

  // Enable and attatch mouse handler
  startButton.interactive = true;
  startButton.buttonMode = true;

  startButton.on('click', loadRandom );

  title.addChild( startButton );

  var helpButton = new PIXI.Sprite( sheet.textures["HelpButton.png"] );
  helpButton.anchor.set(0.5);
  helpButton.position.x = 300;
  helpButton.position.y = 450;

  // Enable and attatch mouse handler
  helpButton.interactive = true;
  helpButton.buttonMode = true;

  helpButton.on('click', loadHelp );

  title.addChild( helpButton );
}



// -------------------- Objects --------------------

// ---------- Player
function Player() {
  // Create player scene graph
  this.player = new PIXI.Container();
  // Create sprites with textures from spritesheet
  this.playerBody = new PIXI.Sprite( sheet.textures["PlayerBody.png"] );
  this.playerBody.anchor.set(0.5);
  this.playerLegs = new PIXI.Sprite( sheet.textures["PlayerLegs.png"] );
  this.playerLegs.anchor.set(0.5);
  this.player.addChild( this.playerLegs );
  this.player.addChild( this.playerBody );

  this.sprinting = false;
  this.rotfactor = 1;
  this.belly = 600;
}

// ---------- Food
function Food( sprite ) {
  this.sprite = sprite;
  this.cycle = FOODBUD;
}

// ---------- PlainsEnemy
function PlainsEnemy() {
  // Create enemy scene graph
  this.enemy = new PIXI.Container();
  // Create sprites with textures from spritesheet
  this.enemyBody = new PIXI.Sprite( sheet.textures["EnemyBody.png"] );
  this.enemyBody.anchor.set(0.5);
  this.enemyTendrilsA = new PIXI.Sprite( sheet.textures["EnemyTendrils.png"] );
  this.enemyTendrilsA.anchor.set(0.5);
  this.enemyTendrilsB = new PIXI.Sprite( sheet.textures["EnemyTendrils.png"] );
  this.enemyTendrilsB.anchor.set(0.5);
  this.enemyTendrilsB.rotation = 45 * DEGTORAD;
  this.enemy.addChild( this.enemyTendrilsA );
  this.enemy.addChild( this.enemyTendrilsB );
  this.enemy.addChild( this.enemyBody );

  this.state = ENEMYSEEK;
  this.cycle = 0;
  this.targetx = null;
  this.targety = null;
  this.targetAngle = null;
}

// ---------- MountainEnemy
function MountainEnemy() {
  // Create enemy scene graph
  this.enemy = new PIXI.Container();
  // Create animation with textures from spritesheet
  var frames = [];
  for( let index = 1; index < 6; index++ )
  {
    frames.push( sheet.textures["Bug" + index + ".png"] );
  }
  this.enemyBody = new PIXI.AnimatedSprite( frames );
  this.enemyBody.anchor.set(0.5);
  this.enemyBody.animationSpeed = 0.5;
  this.enemyBody.play();
  this.enemy.addChild( this.enemyBody );

  this.state = ENEMYSEEK;
  this.cycle = 0;
  this.targetx = null;
  this.targety = null;
  this.tween = null;
}



// -------------------- Define Functions --------------------

// ---------- Helper functions

// Calculates the distance in pixles between two given points
function distance( x1, y1, x2, y2)
{
  return Math.sqrt( Math.pow( x1 - x2, 2 ) + Math.pow( y1 - y2, 2 ) );
}

// ---------- Screen loading functions
function loadTitle()
{
  console.log("Loading title");
  title.visible = true;
  help.visible = false;
  game.visible = false;
  gameover.visible = false;
  gameState = TITLE;
}

function loadHelp()
{
  console.log("Loading help");
  title.visible = false;
  help.visible = true;
  game.visible = false;
  gameover.visible = false;
  gameState = HELP;
}

function loadGameover()
{
  console.log("Loading gameover");
  title.visible = false;
  help.visible = false;
  game.visible = false;
  gameover.visible = true;
  gameState = OVER;
}

function loadRandom()
{
  console.log("Loading random stage");
  // Load one of the three biomes at random
  loadMountains();
  gameState = MOUNTAINS;

  title.visible = false;
  help.visible = false;
  game.visible = true;
  gameover.visible = false;
}

function loadPlains()
{
  console.log("Loading plains");
  // Load the plains biome

  renderer.backgroundColor = 0xa66407;

  // Add decorations
  addDecorations( PLAINS );

  // Scatter food
  scatterFood();

  // Center player
  centerPlayer();

  // Add enemeis
  addPlainsEnemies();
}

function loadMountains()
{
  console.log("Loading mountains");
  // Load the mountains biome

  renderer.backgroundColor = 0xad8349;

  // Add decorations
  addDecorations( MOUNTAINS );

  // Scatter food
  scatterFood();

  // Center player
  centerPlayer();

  // Add enemeis
  addMountainEnemies();
}

function loadSwamps()
{
  console.log("Loading plains");
  // Load the plains biome

  renderer.backgroundColor = 0x94611a;

  // Add decorations
  addDecorations( SWAMP );

  // Scatter food
  scatterFood();

  // Center player
  centerPlayer();

  // Add enemeis
  addPlainsEnemies();
}

// ---------- Loading helper functions
function scatterFood()
{
  // Rescatter the food every time a new screen is loaded
  for( let index = 0; index < maxFoods; index++)
  {
    // load the existing sprites
    var foodObj = foods[ index ];

    // reset them to buds
    foodObj.sprite.texture = sheet.textures["FoodBud.png"];
    foodObj.cycle = FOODBUD;

    // resize them
    foodObj.sprite.anchor.set(0.5);
    foodObj.sprite.scale.set(0.8 + Math.random() * 0.4);

    // scatter them
    foodObj.sprite.x = Math.random() * renderer.width;
    foodObj.sprite.y = Math.random() * renderer.height;
  }
}

function centerPlayer()
{
  // Recenter the player every time a new screen is loaded
  player.player.position.x = 300;
  player.player.position.y = 300;
}

function addPlainsEnemies()
{
  // Clear enemy array of all previous enemy sprites
  for( let index = 0; index < maxEnemies; index++ )
  {
    game.removeChild( enemies[ index ].enemy );
  }

  // Reinitialize global variables for plains
  enemies = [];
  maxEnemies = 2;

  for( let index = 0; index < maxEnemies; index++ )
  {
    var enemyObj = new PlainsEnemy();

    // Place the enemy at a random point on the screen
    enemyObj.enemy.x = Math.random() * renderer.width;
    enemyObj.enemy.y = Math.random() * renderer.height;

    enemyObj.cycle += Math.random() * 100;

    enemies.push( enemyObj );
    game.addChild( enemyObj.enemy );
  }
}

function addMountainEnemies()
{
  // Clear enemy array of all previous enemy sprites
  for( let index = 0; index < maxEnemies; index++ )
  {
    game.removeChild( enemies[ index ].enemy );
  }

  // Reinitialize global variables for mountains
  enemies = [];
  maxEnemies = 5;

  // Add hive

  for( let index = 0; index < maxEnemies; index++ )
  {
    var enemyObj = new MountainEnemy();

    // Place the enemy at a random point on the screen
    enemyObj.enemy.x = Math.random() * renderer.width;
    enemyObj.enemy.y = Math.random() * renderer.height;

    //enemyObj.cycle += Math.random() * 100;

    enemies.push( enemyObj );
    game.addChild( enemyObj.enemy );
  }
}

function addDecorations( biome )
{
  // Determine which type of decoration to use
  var decString;

  switch( biome )
  {
    case PLAINS:
      decString = "PlainsDecoration";
    break;
    case MOUNTAINS:
      decString = "MountainDecoration";
    break;
    case SWAMP:
      decString = "SwampDecoration";
    break;
  }

  for( let index = 0; index < maxDecorations; index++ )
  {
    // load the existing sprites
    var dec = decorations[ index ];

    // get a random number between 1 and 4
    var frame = Math.ceil( Math.random() * 4 );

    // pick a random frame of the decoration
    dec.texture = sheet.textures[decString +  frame  + ".png"];

    // resize them
    dec.anchor.set(0.5);
    dec.scale.set(0.8 + Math.random() * 0.4);

    // scatter them
    dec.x = Math.random() * renderer.width;
    dec.y = Math.random() * renderer.height;
  }
}

// ---------- Input handlers
function keydownEventHandler(e)
{
  if (e.keyCode == WKEY) {
    wDown = true;
  }
  if (e.keyCode == SKEY) {
    sDown = true;
  }
  if (e.keyCode == AKEY) {
    aDown = true;
  }
  if (e.keyCode == DKEY) {
    dDown = true;
  }
  if (e.keyCode == SHIFT) {
    player.sprinting = true;
  }
}

function keyupEventHandler(e)
{
  if (e.keyCode == WKEY) {
    wDown = false;
  }
  if (e.keyCode == SKEY) {
    sDown = false;
  }
  if (e.keyCode == AKEY) {
    aDown = false;
  }
  if (e.keyCode == DKEY) {
    dDown = false;
  }
  if (e.keyCode == SHIFT) {
    player.sprinting = false;
  }
}

document.addEventListener('keydown', keydownEventHandler);
document.addEventListener('keyup', keyupEventHandler);

// ---------- Player functions
function movePlayer()
{
  var moveSpd = PLAYERWALK
  var rotspd = PLAYERTURN

  if (player.sprinting) {
    moveSpd = PLAYERSPRINT;
    rotspd = PLAYERPOORTURN;
    // Belly drains twice as fast while sprinting
    player.belly -= 1;
  }

  if (wDown) { // W key
    player.player.position.x += moveSpd * Math.cos( player.player.rotation );
    player.player.position.y += moveSpd * Math.sin( player.player.rotation );
    animatePlayerLegs( moveSpd );
  }

  if (sDown) { // S key
    player.player.position.x -= moveSpd * 0.8 * Math.cos( player.player.rotation );
    player.player.position.y -= moveSpd * 0.8 * Math.sin( player.player.rotation );
    animatePlayerLegs( moveSpd * 0.8 );
  }

  if (aDown) { // A key
    player.player.rotation -= rotspd;
  }

  if (dDown) { // D key
    player.player.rotation += rotspd;
  }
}

function animatePlayerLegs( speedFactor )
{
  if( player.playerLegs.rotation >= 0.3 ) {
    player.rotfactor = -1;
  }

  else if( player.playerLegs.rotation <= -0.3 ) {
    player.rotfactor = 1;
  }

  player.playerLegs.rotation += player.rotfactor * 0.1 * speedFactor / 10;
}

function playerBelly()
{
  // Decrement player's belly. A full belly should last the player around 10 seconds
  player.belly -= 1;
  // If the player's belly is empty, the game is over
  if( player.belly <= 0 )
  {
    loadGameover();
  }

  // Scale player based on their belly.
  player.playerBody.scale.set( 0.8 + 0.4 * ( player.belly / 600 ) );
}

function progressFoods()
{
  // Randomly advance some of the foods to the next stage
  if( foodProgress >= 300 )
  {
    for( let index = 0; index < maxFoods; index++)
    {
      // Randomly select some foods to advance through their life-cycle
      if( Math.random() > 0.5 )
      {
        var sprite = foods[index].sprite
        switch( foods[index].cycle )
        {
          // Respawn eaten foods
          case FOODEATEN:
            // Recreate the sprite as a new bud and scatter
            sprite.texture = sheet.textures["FoodBud.png"];
            sprite.scale.set(0.8 + Math.random() * 0.4);
            sprite.x = Math.random() * renderer.width;
            sprite.y = Math.random() * renderer.height;
            foods[index].cycle = FOODBUD;
          break;

          // Bud to ripe
          case FOODBUD:
            sprite.texture = sheet.textures["FoodRipe.png"];
            foods[index].cycle += 1;
          break;

          // Ripe to rot
          case FOODRIPE:
            sprite.texture = sheet.textures["FoodRot.png"];
            foods[index].cycle += 1;
          break;

          // Remove rot, create new bud
          case FOODROT:
            // Recreate the sprite as a new bud and scatter
            sprite.texture = sheet.textures["FoodBud.png"];
            sprite.scale.set(0.8 + Math.random() * 0.4);
            sprite.x = Math.random() * renderer.width;
            sprite.y = Math.random() * renderer.height;
            foods[index].cycle = FOODBUD;
          break;
        }
      }
    }
    foodProgress = Math.random() * 100;
  }
  else
  {
    foodProgress += 1;
  }
}

// ---------- PlainsEnemy functions
function handlePlainsEnemy()
{
  for( let index = 0; index < maxEnemies; index++)
  {
    var enemyObj = enemies[index];

    // Continually update target
    if( enemyObj.state == ENEMYSEEK )
    {
      enemyObj.targetx = player.player.position.x;
      enemyObj.targety = player.player.position.y;
      enemyObj.targetAngle = Math.atan2( enemyObj.targety - enemyObj.enemy.y,
                                         enemyObj.targetx - enemyObj.enemy.x );
    }
    // If the enemy is seeking, eventually wait
    if( enemyObj.cycle >= 300 && enemyObj.state == ENEMYSEEK )
    {
      enemyObj.state = ENEMYWAIT;
    }

    // If enemy is waiting, eventually charge
    else if( enemyObj.cycle >= 360 && enemyObj.state == ENEMYWAIT )
    {
      enemyObj.state = ENEMYCHARGE;
    }

    // For the first part of the charge, continually update target
    else if( enemyObj.cycle < 375 && enemyObj.state == ENEMYCHARGE )
    {
      // Calculate angle to the target by taking the arc tangent of the two points
      enemyObj.targetx = player.player.position.x;
      enemyObj.targety = player.player.position.y;
      enemyObj.targetAngle = Math.atan2( enemyObj.targety - enemyObj.enemy.y,
                                         enemyObj.targetx - enemyObj.enemy.x );
    }

    // If the enemy is charging, eventually return ot seeking
    else if( enemyObj.cycle >= 390 && enemyObj.state == ENEMYCHARGE )
    {
      // Reset the cycle and set enemy to wait
      enemyObj.state = ENEMYSEEK;
      enemyObj.cycle = Math.random() * 100;
    }

    // Integrate cycle
    enemyObj.cycle += 1;
  }
}

function movePlainsEnemy()
{
  for( let index = 0; index < maxEnemies; index++)
  {
    var enemyObj = enemies[index];
    switch ( enemyObj.state )
    {
      case ENEMYSEEK:
        // Rotate the enemy
        enemyObj.enemy.rotation -= 0.01;
        enemyObj.enemyTendrilsA.rotation += 0.025;
        enemyObj.enemyTendrilsB.rotation += 0.025;
        // Move towards the target
        enemyObj.enemy.x += 1 * Math.cos( enemyObj.targetAngle );
        enemyObj.enemy.y += 1 * Math.sin( enemyObj.targetAngle );
      break;
      case ENEMYWAIT:
        // Rotate the enemy
        enemyObj.enemy.rotation -= 0.01;
        enemyObj.enemyTendrilsA.rotation += 0.025;
        enemyObj.enemyTendrilsB.rotation -= 0.025;
      break;
      case ENEMYCHARGE:
        // Move towards the target
        enemyObj.enemy.x += 12 * Math.cos( enemyObj.targetAngle );
        enemyObj.enemy.y += 12 * Math.sin( enemyObj.targetAngle );
      break;
    }
  }
}

// ---------- MountainEnemy functions
function handleMountainEnemy()
{
  for( let index = 0; index < maxEnemies; index++)
  {
    var enemyObj = enemies[index];

    switch ( enemyObj.state )
    {
      case ENEMYSEEK:
        // Calculate the distance to the player
        var dist = distance( enemyObj.enemy.position.x, enemyObj.enemy.position.y, player.player.position.x, player.player.position.y );

        // Get a new tween if not currently doing a tween
        if( enemyObj.tween == null || !createjs.Tween.hasActiveTweens( enemyObj.enemy.position ) )
        {

          // Target the player with a lot of variance
          enemyObj.targetx = player.player.position.x + ( Math.random() - 0.5 ) * 180;
          enemyObj.targety = player.player.position.y + ( Math.random() - 0.5 ) * 180;

          // Face the target
          enemyObj.enemy.rotation = Math.atan2( enemyObj.targety - enemyObj.enemy.y,
                                             enemyObj.targetx - enemyObj.enemy.x );

          // Tween towards the target
          // Calculate the duration of the tween from the distance to the player
          // so the enemy will move at a constant speed
          enemyObj.tween = createjs.Tween.get( enemyObj.enemy.position, {override:true} ).to(
                                  { x: enemyObj.targetx, y: enemyObj.targety }, dist * 10 );
        }

        // Check if the player is close
        if( dist < 80 )
        {
          // Set every mountain enemy to charge
          for( let index = 0; index < maxEnemies; index++)
          {
            var enemyObj = enemies[ index ];

            // Target the player with some variance
            enemyObj.targetx = player.player.position.x + ( Math.random() - 0.5 ) * 30;
            enemyObj.targety = player.player.position.y + ( Math.random() - 0.5 ) * 30;

            // Face the target
            enemyObj.enemy.rotation = Math.atan2( enemyObj.targety - enemyObj.enemy.y,
                                               enemyObj.targetx - enemyObj.enemy.x );

            // Tween towards the target
            // Multipy distance by a smaller number to cause enemy to move faster
            enemyObj.tween = createjs.Tween.get( enemyObj.enemy.position, {override:true} ).to(
                                    { x: enemyObj.targetx, y: enemyObj.targety },
                                    distance( enemyObj.enemy.position.x, enemyObj.enemy.position.y, player.player.position.x, player.player.position.y ) * 5 );

            enemyObj.state = ENEMYCHARGE;
          }
        }
      break;

      case ENEMYCHARGE:
        if( !createjs.Tween.hasActiveTweens( enemyObj.enemy.position ) )
        {
          console.log( "Enemy waiting" );
          // Once tween has finished, start waiting
          enemyObj.state = ENEMYWAIT;
        }
      break;

      case ENEMYWAIT:
        // Wait for a while
        if( enemyObj.cycle < 60 )
        {
          // Spin while waiting
          enemyObj.enemy.rotation += 0.34;

          enemyObj.cycle += 1;
        }
        else
        {
          console.log( "Enemy seeking" );
          // Done waiting, go back to seeking
          enemyObj.cycle = 0;
          enemyObj.state = ENEMYSEEK
        }
      break;
    }
  }
}

// ---------- Game control functions
function checkCollision( spriteA, spriteB )
{
  var a = spriteA.getBounds();
  var b = spriteB.getBounds();
  return a.x + a.width > b.x && a.x < b.x + b.width && a.y + a.height > b.y && a.y < b.y + b.height;
}

function handleCollision()
{
  // Check if player has collided with an enemy
  for( let index = 0; index < maxEnemies; index++)
  {
    // Player collided with an enemy, the game is over
    if( checkCollision( player.playerBody, enemies[ index ].enemyBody ) )
    {
      loadGameover();
    }
  }

  // Check if player has collided with a food
  for( let index = 0; index < maxFoods; index++)
  {
    if( checkCollision( player.playerBody, foods[ index ].sprite ) && foods[ index ].cycle != FOODEATEN )
    {
      // Player collided with the food, it should be eaten and increase the player's belly
      switch( foods[ index ].cycle )
      {
        case FOODBUD:
          player.belly += 20;
        break;
        case FOODRIPE:
          player.belly += 40;
        break;
        case FOODROT:
          player.belly -= 10;
        break;
      }

      // Handle belly increasing past max
      if( player.belly > 600 )
      {
        player.belly = 600;
      }

      foods[ index ].sprite.texture = sheet.textures["FoodEaten.png"];
      foods[ index ].cycle = FOODEATEN;
    }

  }
}

function bound( sprite )
{
  if( sprite.position.x < 0 )
  {
    sprite.position.x = 0;
  }
  else if( sprite.position.x > 600 )
  {
    sprite.position.x = 600;
  }
  if( sprite.position.y < 0 )
  {
    sprite.position.y = 0;
  }
  else if( sprite.position.y > 600 )
  {
    sprite.position.y = 600;
  }
}

function boundObjects()
{
  bound( player.player );
  for( let index = 0; index < maxEnemies; index++)
  {
    bound( enemies[ index ].enemy );
  }
}



// -------------------- Main game loop --------------------
function gameLoop()
{
  setTimeout( function()
  {
    requestAnimationFrame(gameLoop);

    if( game.visible == true )
    {
      playerBelly();

      switch( gameState )
      {
        case PLAINS:
          handlePlainsEnemy();
          movePlainsEnemy();
        break;
        case MOUNTAINS:
          handleMountainEnemy();
        break;
      }

      progressFoods();
      movePlayer();
      handleCollision();
      boundObjects();
    }

    renderer.render(stage);
  }, 1000 / fps );
}

gameLoop();
