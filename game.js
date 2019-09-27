// Constants
const WKEY = 87;
const AKEY = 65;
const SKEY = 83;
const DKEY = 68;
const SPACE = 32;
const SHIFT = 16;

const DEGTORAD = Math.PI/180;

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

// Main code
var fps = 60;

var wDown = false;
var aDown = false;
var sDown = false;
var dDown = false;

var gameport = document.getElementById("gameport");

var renderer = PIXI.autoDetectRenderer({width: 600, height: 600, backgroundColor: 0xa66407});
gameport.appendChild(renderer.view);

var stage = new PIXI.Container();

// Textures
var player_body = new PIXI.Texture.from("PlayerBody.png");
var player_legs = new PIXI.Texture.from("PlayerLegs.png");
var enemy_body = new PIXI.Texture.from("EnemyBody.png");
var enemy_tendrils = new PIXI.Texture.from("EnemyTendrils.png");
var food_bud = new PIXI.Texture.from("FoodBud.png");
var food_ripe = new PIXI.Texture.from("FoodRipe.png");
var food_rot = new PIXI.Texture.from("FoodRot.png");
var food_eaten = new PIXI.Texture.from("FoodEaten.png");
var game_over = new PIXI.Texture.from("GameOver.png");

// Objects
function Player() {
  // Create player scene graph
  this.player = new PIXI.Container();
  this.player_body = new PIXI.Sprite( player_body );
  this.player_body.anchor.set(0.5);
  this.player_legs = new PIXI.Sprite( player_legs );
  this.player_legs.anchor.set(0.5);
  this.player.addChild( this.player_legs );
  this.player.addChild( this.player_body );

  this.sprinting = false;
  this.rotfactor = 1;
  this.belly = 600;
}

function Food( sprite ) {
  this.sprite = sprite;
  this.cycle = FOODBUD;
}

function Enemy() {
  // Create enemy scene graph
  this.enemy = new PIXI.Container();
  this.enemy_body = new PIXI.Sprite( enemy_body );
  this.enemy_body.anchor.set(0.5);
  this.enemy_tendrils_a = new PIXI.Sprite( enemy_tendrils );
  this.enemy_tendrils_a.anchor.set(0.5);
  this.enemy_tendrils_b = new PIXI.Sprite( enemy_tendrils );
  this.enemy_tendrils_b.anchor.set(0.5);
  this.enemy_tendrils_b.rotation = 45 * DEGTORAD;
  this.enemy.addChild( this.enemy_tendrils_a );
  this.enemy.addChild( this.enemy_tendrils_b );
  this.enemy.addChild( this.enemy_body );

  this.state = ENEMYSEEK;
  this.cycle = 0;
  this.targetx = null;
  this.targety = null;
  this.targetAngle = null;
}

// Create the main states of the game and add them to the stage
var game = new PIXI.Container();
stage.addChild(game);

var gameover = new PIXI.Container();
gameover.visible = false;
stage.addChild(gameover);

// Create gameover screen sprite
gameoverSprite = new PIXI.Sprite( game_over );
gameoverSprite.anchor.set(0.5);
gameoverSprite.position.x = 300;
gameoverSprite.position.y = 300;

gameover.addChild(gameoverSprite);

// create array to store food sprites
var foods = [];
var maxFoods = 30;
var foodProgress = Math.random() * 100;

for( let index = 0; index < maxFoods; index++)
{
  // create a new sprite of sligthly variable size
  var food = new PIXI.Sprite( food_bud );
  food.anchor.set(0.5);
  food.scale.set(0.8 + Math.random() * 0.4);

  // scatter them
  food.x = Math.random() * renderer.width;
  food.y = Math.random() * renderer.height;

  // create object to store Sprite and lifecycle
  let foodObj = new Food( food );

  foods.push( foodObj );
  game.addChild(food);
}

// Add the player to the center of the field
var player = new Player();
player.player.position.x = 300;
player.player.position.y = 300;
game.addChild(player.player);

// Add two enemies ot the field
var enemies = [];
var maxEnemies = 2;

for( let index = 0; index < maxEnemies; index++)
{
  var enemyObj = new Enemy();

  // Place the enemy at a random point on the screen
  enemyObj.enemy.x = Math.random() * renderer.width;
  enemyObj.enemy.y = Math.random() * renderer.height;

  enemyObj.cycle += Math.random() * 100;

  enemies.push( enemyObj );
  game.addChild( enemyObj.enemy );
}

function playerBelly()
{
  // Decrement player's belly. A full belly should last the player around 10 seconds
  player.belly -= 1;
  console.log( player.belly );
  // If the player's belly is empty, the game is over
  if( player.belly <= 0 )
  {
    game.visible = false;
    gameover.visible = true;
  }

  // Scale player based on their belly.
  player.player_body.scale.set( 0.8 + 0.4 * ( player.belly / 600 ) );
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
            sprite.texture = food_bud;
            sprite.scale.set(0.8 + Math.random() * 0.4);
            sprite.x = Math.random() * renderer.width;
            sprite.y = Math.random() * renderer.height;
            foods[index].cycle = FOODBUD;
          break;

          // Bud to ripe
          case FOODBUD:
            sprite.texture = food_ripe;
            foods[index].cycle += 1;
          break;

          // Ripe to rot
          case FOODRIPE:
            sprite.texture = food_rot;
            foods[index].cycle += 1;
          break;

          // Remove rot, create new bud
          case FOODROT:
            // Recreate the sprite as a new bud and scatter
            sprite.texture = food_bud;
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
  if( player.player_legs.rotation >= 0.3 ) {
    player.rotfactor = -1;
  }

  else if( player.player_legs.rotation <= -0.3 ) {
    player.rotfactor = 1;
  }

  player.player_legs.rotation += player.rotfactor * 0.1 * speedFactor / 10;
}

function handleEnemy()
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

function moveEnemy()
{
  for( let index = 0; index < maxEnemies; index++)
  {
    var enemyObj = enemies[index];
    switch ( enemyObj.state )
    {
      case ENEMYSEEK:
        // Rotate the enemy
        enemyObj.enemy.rotation -= 0.01;
        enemyObj.enemy_tendrils_a.rotation += 0.025;
        enemyObj.enemy_tendrils_b.rotation += 0.025;
        // Move towards the target
        enemyObj.enemy.x += 1 * Math.cos( enemyObj.targetAngle );
        enemyObj.enemy.y += 1 * Math.sin( enemyObj.targetAngle );
      break;
      case ENEMYWAIT:
        // Rotate the enemy
        enemyObj.enemy.rotation -= 0.01;
        enemyObj.enemy_tendrils_a.rotation += 0.025;
        enemyObj.enemy_tendrils_b.rotation -= 0.025;
      break;
      case ENEMYCHARGE:
        // Move towards the target
        enemyObj.enemy.x += 12 * Math.cos( enemyObj.targetAngle );
        enemyObj.enemy.y += 12 * Math.sin( enemyObj.targetAngle );
      break;
    }
  }
}

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
    if( checkCollision( player.player_body, enemies[ index ].enemy_body ) )
    {
      // Player collided with an enemy, the game is over
      game.visible = false;
      gameover.visible = true;
    }
  }

  // Check if player has collided with a food
  for( let index = 0; index < maxFoods; index++)
  {
    if( checkCollision( player.player_body, foods[ index ].sprite ) && foods[ index ].cycle != FOODEATEN )
    {
      // Player collided with the food, it should be eaten and increase the player's belly
      switch( foods[ index ].cycle )
      {
        case FOODBUD:
          player.belly += 20;
        break;
        case FOODRIPE:
          player.belly += 30;
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

      foods[ index ].sprite.texture = food_eaten;
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

function gameLoop()
{
  setTimeout( function()
  {
    requestAnimationFrame(gameLoop);

    if( game.visible )
    {
      playerBelly();
      handleEnemy();
      moveEnemy();
      progressFoods();
      movePlayer();
      handleCollision();
      boundObjects();
    }

    renderer.render(stage);
  }, 1000 / fps );
}

gameLoop();
