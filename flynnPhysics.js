var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

// Add ApplyAngularImpulse to Bod2d
b2Body.prototype.ApplyAngularImpulse = function (impulse) {
      if (this.m_type != b2Body.b2_dynamicBody) {
         return;
      }
      if (this.IsAwake() === false) {
         this.SetAwake(true);
      }
      this.m_angularVelocity += impulse;
};

b2Body.prototype.setHome = function () {
    var pos = this.GetPosition();
    this.home_pos = new b2Vec2(pos.x, pos.y);
};

b2Body.prototype.resetToHome = function () {
    this.SetPosition(this.home_pos);
    this.SetAngle(0);
    this.SetLinearVelocity(new b2Vec2(0,0));
    this.SetAngularVelocity(0);
};

var FlynnPhysics= Class.extend({
	init: function(ctx, gravity_x, gravity_y, render_scale){

		var gravity = new b2Vec2(gravity_x, gravity_y);
		this.world = new b2World(gravity, true);
		this.context = ctx;
		this.scale = render_scale;
		this.dtRemaining = 0;
		this.stepAmount = 1/60;

		//this.enableDebugDraw();
	},

	enableDebugDraw: function() {
		this.debugDraw = new b2DebugDraw();
		this.debugDraw.SetSprite(this.context);
		this.debugDraw.SetDrawScale(this.scale);
		this.debugDraw.SetFillAlpha(0.3);
		this.debugDraw.SetLineThickness(1.0);
		this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		this.world.SetDebugDraw(this.debugDraw);
	},

	update: function(paceFactor){
		this.dtRemaining += paceFactor * 1/60;
		while (this.dtRemaining > this.stepAmount) {
			this.dtRemaining -= this.stepAmount;
			this.world.Step(this.stepAmount,
				8, // velocity iterations
				3); // position iterations
		}
	},

	render: function(ctx){
		if (this.debugDraw) {
			this.world.DrawDebugData();
		} else{
            //ctx.clearAll();
        }

        var obj = this.world.GetBodyList();
 
        this.context.save();
        //this.context.scale(this.scale, this.scale);
        while (obj) {
            var body = obj.GetUserData();
            if (body) {
                body.draw(this.context, this.scale);
            }
     
            obj = obj.GetNext();
        }
        this.context.restore();
	}
});


FlynnPhysics.prototype.collision = function () {
    this.listener = new Box2D.Dynamics.b2ContactListener();
    this.listener.PostSolve = function (contact, impulse) {
        var bodyA = contact.GetFixtureA().GetBody().GetUserData(),
            bodyB = contact.GetFixtureB().GetBody().GetUserData();
 
        if (bodyA.contact) {
            bodyA.contact(contact, impulse, true);
        }
        if (bodyB.contact) {
            bodyB.contact(contact, impulse, false);
        }
 
    };
    this.world.SetContactListener(this.listener);
};

var FlynnBody = function (physics, details) {
    this.details = details = details || {};
 
    // Create the definition
    this.definition = new b2BodyDef();
 
    // Set up the definition
    for (var k in this.definitionDefaults) {
        this.definition[k] = details[k] || this.definitionDefaults[k];
    }
    this.definition.position = new b2Vec2(details.x || 0, details.y || 0);
    this.definition.linearVelocity = new b2Vec2(details.vx || 0, details.vy || 0);
    this.definition.userData = this;
    this.definition.type = details.type == "static" ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;
 
    // Create the Body
    this.body = physics.world.CreateBody(this.definition);
 
    // Create the fixture
    this.fixtureDef = new b2FixtureDef();
    for (var l in this.fixtureDefaults) {
        this.fixtureDef[l] = details[l] || this.fixtureDefaults[l];
    }
 
 
    details.shape = details.shape || this.defaults.shape;
    //details.color = details.color || this.defaults.color;
 
    switch (details.shape) {
        case "circle":
            details.radius = details.radius || this.defaults.radius;
            this.fixtureDef.shape = new b2CircleShape(details.radius);
            break;
        case "polygon":
            this.fixtureDef.shape = new b2PolygonShape();
            this.fixtureDef.shape.SetAsArray(details.points, details.points.length);
            break;
        case "block":
        default:
            details.width = details.width || this.defaults.width;
            details.height = details.height || this.defaults.height;
 
            this.fixtureDef.shape = new b2PolygonShape();
            this.fixtureDef.shape.SetAsBox(details.width / 2,
            details.height / 2);
            break;
    }
 
    this.body.CreateFixture(this.fixtureDef);
};
 
 
FlynnBody.prototype.defaults = {
    shape: "block",
    width: 0.4,
    height: 0.4,
    radius: 0.4,
    //color: FlynnColors.WHITE,
};
 
FlynnBody.prototype.fixtureDefaults = {
    density: 2,
    friction: 1,
    // restitution: 0.2
    restitution: 0.7,
};
 
FlynnBody.prototype.definitionDefaults = {
    active: true,
    allowSleep: true,
    angle: 0,
    angularVelocity: 0,
    awake: true,
    bullet: false,
    fixedRotation: false,
};

// FlynnBody.prototype.resetToHome = function(){
//     this.SetPosition(new b2Vec2(this.details.x, this.details.y));
//     this.SetAngle(0);
//     this.SetLinearVelocity(new b2Vec2(0,0));
//     this.SetAngularVelocity(0);
// };

FlynnBody.prototype.draw = function (context, scale) {
    var pos = this.body.GetPosition();
    var angle = this.body.GetAngle();
 
    // Save the context
    context.save();
 
    // Translate and rotate
    context.translate(pos.x * scale, pos.y * scale);
    context.rotate(angle);
 
 
    // Draw the shape outline if the shape has a color
    if (this.details.color) {
        context.fillStyle = this.details.color;
 
        switch (this.details.shape) {
            case "circle":
                context.vectorStart(this.details.color);
                var first = true;
                for(var a=0, stop=Math.PI*2, step = Math.PI*2/6; a<=stop; a += step ){
                    if(first){
                        context.vectorMoveTo(Math.cos(a)*this.details.radius*scale, Math.sin(a)*this.details.radius*scale);
                        first = false;
                    } else {
                        context.vectorLineTo(Math.cos(a)*this.details.radius*scale, Math.sin(a)*this.details.radius*scale);
                    }
                }
                context.vectorEnd();


                // context.beginPath();
                // context.arc(0, 0, this.details.radius, 0, Math.PI * 2);
                // context.fill();
                break;
            case "polygon":
                var points = this.details.points;
                context.beginPath();
                context.moveTo(points[0].x, points[0].y);
                for (var i = 1; i < points.length; i++) {
                    context.lineTo(points[i].x, points[i].y);
                }
                context.fill();
                break;
            case "block":
                context.vectorRect(-this.details.width / 2 * scale, -this.details.height / 2 * scale,
                this.details.width * scale,
                this.details.height * scale,
                this.details.color
                );

                // context.vectorStart(this.details.color);
                // context.vectorMoveTo(-this.details.width / 2, -this.details.height / 2);
                // context.vectorLineTo( this.details.width / 2, -this.details.height / 2);
                // context.vectorLineTo( this.details.width / 2,  this.details.height / 2);
                // context.vectorLineTo(-this.details.width / 2,  this.details.height / 2);
                // context.vectorLineTo(-this.details.width / 2, -this.details.height / 2);
                // context.vectorEnd();

                // context.fillRect(-this.details.width / 2, -this.details.height / 2,
                // this.details.width,
                // this.details.height
                // );
                break;
            default:
                break;
        }
    }
    context.restore();
};
