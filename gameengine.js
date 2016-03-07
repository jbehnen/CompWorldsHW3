// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


var friction = 1;
var acceleration = 1000000;
var maxSpeed = 200;

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Taken from the Zombies code from A.I.
function direction(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) return { x: dx / dist, y: dy / dist }; else return { x: 0, y: 0 };
}

// This function was originally written for my Zombies assignment for A.I.
// Adapted to Javascript from http://jaran.de/goodbits/2011/07/17/calculating-an-intercept-course-to-a-target-with-constant-direction-and-velocity-in-a-2-dimensional-plane/
/**
 * Calculates the point of interception for one object starting at point
 * <code>a</code> with speed vector <code>v</code> and another object
 * starting at point <code>b</code> with a speed of <code>s</code>.
 *
 * @see <a
 *      href="http://jaran.de/goodbits/2011/07/17/calculating-an-intercept-course-to-a-target-with-constant-direction-and-velocity-in-a-2-dimensional-plane/">Calculating
 *      an intercept course to a target with constant direction and velocity
 *      (in a 2-dimensional plane)</a>
 *
 * @param a
 *            start vector of the object to be intercepted
 * @param v
 *            speed vector of the object to be intercepted
 * @param b
 *            start vector of the intercepting object
 * @param s
 *            speed of the intercepting object
 * @return vector of interception or <code>null</code> if object cannot be
 *         intercepted or calculation fails
 *
 * @author Jens Seiler, adapted to Javascript and renamed by Julia Behnen
 */
function mrSuluPlotAnInterceptCourse(a, v, b, s) {
    var ox = a.x - b.x;
    var oy = a.y - b.y;

    var h1 = v.x * v.x + v.y * v.y - s * s;
    var h2 = ox * v.x + oy * v.y;
    var t;
    if (h1 == 0) { // problem collapses into a simple linear equation
        t = -(ox * ox + oy * oy) / 2 * h2;
    } else { // solve the quadratic equation
        var minusPHalf = -h2 / h1;

        var discriminant = minusPHalf * minusPHalf - (ox * ox + oy * oy) / h1; // term in brackets is h3
        if (discriminant < 0) { // no (real) solution then...
            return null;
        }

        var root = Math.sqrt(discriminant);

        var t1 = minusPHalf + root;
        var t2 = minusPHalf - root;

        var tMin = Math.min(t1, t2);
        var tMax = Math.max(t1, t2);

        t = tMin > 0 ? tMin : tMax; // get the smaller of the two times, unless it's negative
        if (t < 0) { // we don't want a solution in the past
            return null;
        }
    }

    // calculate the point of interception using the found intercept time and return it
    var targetX = a.x + t * v.x;
    var targetY = a.y + t * v.y;
    return { x: targetX, y: targetY };
}


function Circle(game, index, sunIndex, cloudIndex, x, y, velocity) {
    this.player = 1;
    this.radius = 20;
    this.visualRadius = 500;
    this.colors = ["Red", "Green", "Blue", "White"];
    this.color = 3;
    this.index = index;
    this.sunIndex = sunIndex;
    this.cloudIndex = cloudIndex;
    if (x && y) {
        Entity.call(this, game, x, y);
    } else {
        Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (800 - this.radius * 2));
    }
    if (velocity) {
        this.velocity = velocity;
    } else {
        this.velocity = { x: Math.random() * 1000, y: Math.random() * 1000 };
    }
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
};

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.setSunAndCloud = function () {
    this.sun = this.game.circles[this.sunIndex];
    this.cloud = this.game.circles[this.cloudIndex];
};

Circle.prototype.saveCircle = function () {
    return { index: this.index, x: this.x, y: this.y, velocity: this.velocity, sunIndex: this.sunIndex, cloudIndex: this.cloudIndex };
}

Circle.prototype.collide = function (other) {
    if (!other) {
        console.log(this.game)
        console.log(other);
    }
    return distance(this, other) < this.radius + other.radius;
};

Circle.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

Circle.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

Circle.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

Circle.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);
    //  console.log(this.velocity);

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * friction;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * friction;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent)) {
            var temp = { x: this.velocity.x, y: this.velocity.y };

            if (!ent) {
                console.log(this.game)
                console.log(ent);
            }

            var dist = distance(this, ent);
            var delta = this.radius + ent.radius - dist;
            var difX = (this.x - ent.x) / dist;
            var difY = (this.y - ent.y) / dist;

            this.x += difX * delta / 2;
            this.y += difY * delta / 2;
            ent.x -= difX * delta / 2;
            ent.y -= difY * delta / 2;

            this.velocity.x = ent.velocity.x * friction;
            this.velocity.y = ent.velocity.y * friction;
            ent.velocity.x = temp.x * friction;
            ent.velocity.y = temp.y * friction;
            this.x += this.velocity.x * this.game.clockTick;
            this.y += this.velocity.y * this.game.clockTick;
            ent.x += ent.velocity.x * this.game.clockTick;
            ent.y += ent.velocity.y * this.game.clockTick;
        }
    }

    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;

    var that = this;
    // "Good" is the circle that this wants between itself and "Bad"
    function interceptVelocity(good, bad) {
        var directionVectorToIntercept = direction(good, bad);
        var speed = Math.sqrt(that.velocity.x * that.velocity.x + that.velocity.y * that.velocity.y);
        var target = mrSuluPlotAnInterceptCourse(good, directionVectorToIntercept, that, speed);
        if (target) {
            var dist = distance(that, target);
            var difX = (target.x - that.x) / dist;
            var difY = (target.y - that.y) / dist;
            var velocity = {};
            velocity.x = difX * 10;
            velocity.y = difY * 10;
            //console.log("velocity", velocity);
            return velocity;
        } else {
            return { x: 0, y: 0 };
        }
    }

    var interceptVelocity = interceptVelocity(this.sun, this.cloud);
    this.velocity.x += interceptVelocity.x;
    this.velocity.y += interceptVelocity.y;

    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
};

Circle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(this.index + 1, this.x - 5, this.y + 5);
};


function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.entities = [];
    this.circles = [];
    this.showOutlines = false;
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
    this.startNewSimulation();
    console.log('game initialized');
}

GameEngine.prototype.startNewSimulation = function (loadedCircles) {
    for (var i = 0; i < this.circles.length; i++) {
        this.circles[i].removeFromWorld = true;
    }

    this.circles = [];

    if (loadedCircles) {
        this.circles = loadedCircles;
    } else {

        var gameType = document.getElementById('gameType');
        var quantity = document.getElementById('quantity');
        var selectedQuantity = quantity.options[quantity.selectedIndex].value;
        var circle, sun, cloud;
        var getOtherCircle = function (bad1, bad2) {
            var i = bad1;
            while (i === bad1 || i === bad2) {
                i = Math.floor(Math.random() * selectedQuantity);
            }
            return i;
        }

        console.log("Circle\tSun\tCloud");
        for (var i = 0; i < selectedQuantity; i++) {
            if (gameType.selectedIndex == 0) { // random
                sun = getOtherCircle(i, i);
                cloud = getOtherCircle(i, sun);
                circle = new Circle(this, i, sun, cloud);
            } else {
                circle = new Circle(this, i, (i + 1) % selectedQuantity, (i + 2) % selectedQuantity);
            }
            this.circles[i] = circle;
            console.log((i + 1) + "\t\t" + (circle.sunIndex + 1) + "\t" + (circle.cloudIndex + 1));
        }  
    }
    for (var i = 0; i < this.circles.length; i++) {
        circle = this.circles[i];
        circle.setSunAndCloud();
        this.addEntity(circle);
    }
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');
    var that = this;
    var gameType = document.getElementById('gameType');
    var quantity = document.getElementById('quantity');
	var filename = document.getElementById('filename');

    document.getElementById("start").addEventListener("click", function () {
        that.startNewSimulation();
    });

    document.getElementById("save").onclick = function (e) {
        var selectedGameTypeIndex = gameType.selectedIndex;
        var selectedQuantity = quantity.options[quantity.selectedIndex].value;
        var savedCircles = [];
        for (var i = 0; i < that.circles.length; i++) {
            savedCircles.push(that.circles[i].saveCircle());
        }
        var file = filename.value;
		var dataBlock = {
                
                gameTypeIndex: selectedGameTypeIndex,
                circles: savedCircles
            };
        socket.emit('save', {
			studentname: "Julia Behnen",
			statename: file,
            gameTypeIndex: selectedGameTypeIndex,
            circles: savedCircles
        });
    };

    document.getElementById("load").onclick = function (data) {
        var file = filename.value;
        socket.emit('load', {
			studentname: "Julia Behnen",
			statename: file
        })
    }

    socket.on("load", function (data) {
        gameType.selectedIndex = data.gameTypeIndex;
        var circles = data.circles;
        quantity.text = circles.length;
        quantity.value = circles.length;
        var loadedCircles = [];
        for (var i = 0; i < circles.length; i++) {
            var circle = circles[i];
            loadedCircles.push(new Circle(that, circle.index,
                circle.sunIndex, circle.cloudIndex, circle.x, circle.y, circle.velocity));
        }
        that.startNewSimulation(loadedCircles);
    });

    this.ctx.canvas.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    this.entities.push(entity);
}

GameEngine.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.click = null;
    this.rightclick = null;
    this.wheel = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        this.game.ctx.beginPath();
        this.game.ctx.strokeStyle = "green";
        this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.game.ctx.stroke();
        this.game.ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}
