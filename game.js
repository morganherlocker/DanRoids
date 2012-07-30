$(document).ready(function() {
	//init Crafty with FPS of 50 and create the canvas element
	Crafty.init();
	Crafty.canvas.init();

	//preload the needed assets
	Crafty.load(["images/sprite.png", "images/bg.png"], function() {
		//splice the spritemap
		Crafty.sprite(64  , "images/sprite.png", {
			ship: [1,0],
			shipMoving: [2,0],
			explosion: [3,0],
			big: [0,0],
			medium: [0,0],
			small: [0,0],
			extrasmall: [0,0],
			blood: [4,0]
		});

		Crafty.audio.add("Blaster", ["space-blaster.wav", "space-blaster.mp3"])

		//start the main scene when loaded
		Crafty.scene("main");
	});

	highScoreVal = 0;
		
	Crafty.scene("main", function() {
		Crafty.background("url('images/bg.png')");

		//score display
		var score = Crafty.e("2D, DOM, Text")
			.text("Score: 0")
			.attr({x: Crafty.viewport.width - 300, y: Crafty.viewport.height - 250, w: 200, h:50})
			.css({color: "#fff"});
			
		//high score display
		var highScore = Crafty.e("2D, DOM, Text")
			.text(" High Score: 0")
			.attr({x: Crafty.viewport.width - 300, y: Crafty.viewport.height - 225, w: 200, h:50})
			.css({color: "#fff"});
		highScore.text("High Score: "+highScoreVal);
		
		var isExploding = false;
		
		//player entity
		var player = Crafty.e("2D, Canvas, ship, Controls, Collision")
			.attr({move: {left: false, right: false, up: false, down: false}, xspeed: 0, yspeed: 0, decay: 0.98, 
				x: Crafty.viewport.width / 2, y: Crafty.viewport.height / 2, score: 0})
			.origin("center")
			.bind("KeyDown", function(e) {
				//on keydown, set the move booleans
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = true;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = true;
				} else if(e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.up = true;
				} else if (e.keyCode === Crafty.keys.SPACE) {
					console.log("Blast");
					Crafty.audio.play("Blaster");
					//create a bullet entity
					Crafty.e("2D, DOM, Color, bullet")
						.attr({
							x: this._x + 32, 
							y: this._y + 32, 
							w: 2, 
							h: 5, 
							rotation: this._rotation, 
							xspeed: 20 * Math.sin(this._rotation / 57.3), 
							yspeed: 20 * Math.cos(this._rotation / 57.3)
						})
						.color("rgb(255, 0, 0)")
						.bind("EnterFrame", function() {
							this.x += this.xspeed;
							this.y -= this.yspeed;

							//destroy if it goes out of bounds
							if(this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
								this.destroy();
							}
						});
				}
			}).bind("KeyUp", function(e) {
				//on key up, set the move booleans to false
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = false;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = false;
				} else if(e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.up = false;
				}
			}).bind("EnterFrame", function() {
				if(this.move.right) this.rotation += 5;
				if(this.move.left) this.rotation -= 5;

				//spin if exploding
				if(isExploding){
					this.rotation += 15;
				}
				
				//acceleration and movement vector
				var vx = Math.sin(this._rotation * Math.PI / 180) * 0.3,
					vy = Math.cos(this._rotation * Math.PI / 180) * 0.3;

				//if the move up is true, increment the y/xspeeds
				if(!isExploding){
					if(this.move.up) {
						//change to shipMoving sprite
						this.removeComponent("ship").addComponent("shipMoving");
						this.yspeed -= vy;
						this.xspeed += vx;
					} else {
						//change back to the ship sprite
						this.removeComponent("shipMoving").addComponent("ship");
						//if released, slow down the ship
						this.xspeed *= this.decay;
						this.yspeed *= this.decay;
					}
				}

				//move the ship by the x and y speeds or movement vector
				this.x += this.xspeed;
				this.y += this.yspeed;

				//if ship goes out of bounds, put him back
				if(this._x > Crafty.viewport.width) {
					this.x = -64;
				}
				if(this._x < -64) {
					this.x =  Crafty.viewport.width;
				}
				if(this._y > Crafty.viewport.height) {
					this.y = -64;
				}
				if(this._y < -64) {
					this.y = Crafty.viewport.height;
				}

				//if all asteroids are gone, start again with more
				if(asteroidCount <= 0) {
					initRocks(lastCount, lastCount * 2);
				}
			}).collision()
			.onHit("asteroid", function(e) {
				//if player gets hit, restart the game
				if(!isExploding && !e[0].obj.has("blood")){
					isExploding = true;
					this.removeComponent("ship").addComponent("explosion");
					setTimeout(function() {
						Crafty.scene("main");
						Crafty.scene("main");
					},2500);
				}
			});

		//keep a count of asteroids
		var asteroidCount,
			lastCount;

		//Asteroid component
		Crafty.c("asteroid", {   
			init: function() {
				this.origin("center");
				this.attr({
					x: Crafty.math.randomInt(0, Crafty.viewport.width), //give it random positions, rotation and speed
					y: Crafty.math.randomInt(0, Crafty.viewport.height),
					xspeed: Crafty.math.randomInt(1, 5), 
					yspeed: Crafty.math.randomInt(1, 5), 
					rspeed: Crafty.math.randomInt(-10, 10)
				}).bind("EnterFrame", function() {
					this.x += this.xspeed;
					this.y += this.yspeed;
					this.rotation += this.rspeed;

					if(this._x > Crafty.viewport.width) {
						this.x = -64;
					}
					if(this._x < -64) {
						this.x =  Crafty.viewport.width;
					}
					if(this._y > Crafty.viewport.height) {
						this.y = -64;
					}
					if(this._y < -64) {
						this.y = Crafty.viewport.height;
					}
				}).collision()
				.onHit("bullet", function(e) {
					if(this.has("blood")) {
						this.destroy();
					}
				
					//if hit by a bullet increment the score
					player.score += 5;
					if(player.score > highScoreVal){
						highScoreVal = player.score;
					}
					score.text("Score: "+player.score);
					highScore.text("High Score: "+highScoreVal)
					
					e[0].obj.destroy(); //destroy the bullet

					var size;
					//decide what size to make the asteroid
					if(this.has("big")) {
						this.removeComponent("big").addComponent("medium");
						size = "medium";
					} else if(this.has("medium")) {
						this.removeComponent("medium").addComponent("small");
						size = "small";
					} else if(this.has("small")) {
						this.removeComponent("small").addComponent("extrasmall");
						size = "extrasmall";
					} else if(this.has("extrasmall")) { //if the lowest size, delete self
						asteroidCount--;
						this.removeComponent("extrasmall").addComponent("blood");
						var that = this;
						setTimeout(function() {that.destroy();}, 200);
						return;
					}
					
					//move heads that are not destroyed
					if(this.has("blood")) {
						this.xspeed = 0;
						this.yspeed = 0;
					}
					else {
						var oldxspeed = this.xspeed;
						this.xspeed = -this.yspeed;
						this.yspeed = oldxspeed;
					}
					if(!this.has("blood")) {
						asteroidCount++;
					}
					
					//split into two asteroids by creating another asteroid
					Crafty.e("2D, DOM, "+size+", Collision, asteroid").attr({x: this._x, y: this._y});
				});

			}
		});

		//function to fill the screen with asteroids by a random amount
		function initRocks(lower, upper) {
			var rocks = Crafty.math.randomInt(lower, upper);
			asteroidCount = rocks;
			lastCount = rocks;

			for(var i = 0; i < rocks; i++) {
				Crafty.e("2D, DOM, big, Collision, asteroid");
			}
		}
		//first level has between 1 and 5 asteroids
		initRocks(1, 1);
	});

});