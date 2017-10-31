/////////////////////////////////////////////////////////////////////
// Objects
/////////////////////////////////////////////////////////////////////
function Obj() {
    this.chunk = 0;
    this.active = [];
    this.ptr = 0;
    this.base_type = "object";
    this.red_light = new THREE.PointLight(0xFF00AA, 2, 10);
    this.yellow_light = new THREE.PointLight(0xFFAA00, 2, 80);
    this.green_light = new THREE.PointLight(0x00FF00, 2, 10);
    this.streetlight = new THREE.SpotLight(0xFFAA00);
    this.max = 20;

    Obj.prototype.create = function(model, size) {
        this.chunk = game.modelLoader.getModel(model, size, this);
        this.chunk.mesh.visible = false;
        this.chunk.mesh.rotation.set(Math.PI, 0, 0);
    };

    Obj.prototype.update = function(time, delta) {
    };

    Obj.prototype.destroy = function() {
      //  this.chunk.explode();
    };
}

function FFChunk() {
    Obj.call(this);
    this.base_type = "";
    this.type = "ff_chunk";

    FFChunk.prototype.hit = function(dmg, dir, type, pos) {
        dir.x += (1-get_rand()*2);
        dir.y += (1-get_rand()*2);
        dir.z += (1-get_rand()*2);
        this.chunk.explode(dir, dmg);
        this.alive = false;
        game.removeFromCD(this.chunk.mesh);
    };

    FFChunk.prototype.create = function(chunk) {
        this.chunk = chunk;
        this.base_type = chunk.owner.base_type;
        this.chunk.owner = this;
        this.chunk.build();
        game.maps.loaded.push(this);
        game.addToCD(this.chunk.mesh);
        //game.addToCD(this.chunk.bb);

    };
};
FFChunk.prototype = new Obj; 
FFChunk.prototype.constructor = FFChunk;

function Portal() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "portal";
    this.alive = true;
    this.x = 0;
    this.y = 0;
    this.z = 0;

    Portal.prototype.create = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Portal.prototype.update = function(time, delta) {
        var x = 0; 
        var r = 10;
        for(var a = 0; a < Math.PI*2; a+=Math.PI/4) {
            x = this.x + r * Math.cos(a)
            z = this.z + r * Math.sin(a)
            game.particles.portalMagic(x, game.maps.ground, z);
        }
    };
}
Portal.prototype = new Obj; 
Portal.prototype.constructor = Portal;

// Painkillers
function PainKillers() {
    Obj.call(this);
    this.base_type = "object";
    this.obj_type = "painkillers";
    this.alive = true;
    this.light = 0;
    this.taken = false;

    PainKillers.prototype.grab = function (mesh_id) {
        if(!this.taken) {
            game.sounds.PlaySound("painkillers", this.chunk.mesh.position, 250);
            game.removeFromCD(this.chunk.mesh);
            game.player.bleed_timer += 60; // add 60 sec.
            this.taken = true;
        }
    };

    PainKillers.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("painkillers", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+1, z);
        game.addToCD(this.chunk.mesh);
    };

    PainKillers.prototype.update = function(time, delta) {
        Obj.prototype.update.call();
        if(!this.taken) {
            this.chunk.mesh.rotation.y += Math.sin(delta);
            this.chunk.mesh.position.y = game.maps.ground+6 + Math.sin(time * 2.5);
        } else {
            this.chunk.mesh.position.y += 0.5;
            if(this.chunk.mesh.position.y > game.maps.ground + 30) {
                this.chunk.virtual_explode(this.chunk.mesh.position);
                this.chunk.destroy();
                this.alive = false;
            }
        }
    };
}
PainKillers.prototype = new Obj; 
PainKillers.prototype.constructor = PainKillers;

function PaperPoliceCar() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "paperpolicecar";
    this.alive = true;

    PaperPoliceCar.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    PaperPoliceCar.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("paperpolicecar", 0.6, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize)/2, z);
    };
}
PaperPoliceCar.prototype = new Obj; 
PaperPoliceCar.prototype.constructor = PaperPoliceCar;

function PaperAgent() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "paperagent";
    this.alive = true;

    PaperAgent.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    PaperAgent.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("paperagent", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize)/2, z);
    };
}
PaperAgent.prototype = new Obj; 
PaperAgent.prototype.constructor = PaperAgent;

function Tree() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "tree";
    this.alive = true;
    this.light = 0;

    Tree.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    Tree.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("tree", 0.5, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize)/2, z);
    };
}
Tree.prototype = new Obj; 
Tree.prototype.constructor = Tree;

function StreetLamp() {
    Obj.call(this);
    this.base_type = "object";
    this.obj_type = "street_lamp";
    this.alive = true;
    this.light = 0;

    StreetLamp.prototype.hit = function(dmg, dir, type, pos) {
        if(this.chunk.hit(dir, dmg, pos)) {
            if(type != "missile" && type != "grenade") {
                game.sounds.PlaySound("bullet_metal", pos, 300);
            }
           // if(this.light.intensity > 0) {
           //     this.light.intensity -= 0.5*dmg;
           //     if(this.light.intensity < 0) {
           //         this.light.intensity = 0;
           //     }
           // }
            if (this.chunk.health < 60) {
                this.alive = false;
            }
            return true;
        }
        return false;
    };

    StreetLamp.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("streetlamp", 0.4, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
      //  this.light = this.streetlight.clone();
      //  var targetObject = new THREE.Object3D();
      //  targetObject.position.set(0, 0, 0);
      //  game.scene.add(targetObject);
      //  this.light.target = targetObject;
      //  this.light.decay = 1;
      //  this.light.intensity = 2.4;
      //  this.light.distance = 80;
      //  this.light.angle = Math.PI;
       // this.chunk.mesh.add(targetObject);
       // this.chunk.mesh.add(this.light);
        // DEBUG
      //  var m = new THREE.Mesh(new THREE.BoxGeometry(2,2,2),
      //                         new THREE.MeshBasicMaterial({color: 0xFF0000}));
      //  this.light.add(m);

       // this.light.position.set(0, 15, 0);
   //     this.chunk.mesh.rotation.x = -Math.PI;
        // Check rotation depending on wall
        this.chunk.mesh.position.set(x, game.maps.ground+10, z);
        //this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
        var res = game.world.checkExists(new THREE.Vector3(x-1,game.maps.ground+10,z));
        if(res.length > 0) {
       //     this.chunk.mesh.rotation.y = -Math.PI*2;
            this.chunk.mesh.position.x += 10;
        //    this.light.position.set(7, 18, 0);
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z-1));
        //if(res.length > 0) {
        //    this.chunk.mesh.rotation.y = -Math.PI;
        //}
        //res = game.world.checkExists(new THREE.Vector3(x+1,game.maps.ground+10,z+2));
        //if(res.length > 0) {
        //    this.chunk.mesh.rotation.y = -Math.PI;
        //   // this.chunk.mesh.position.x -= 10;
        //}
        for(var i = 0; i < 10; i++) {
            res = game.world.checkExists(new THREE.Vector3(x+i,game.maps.ground+10,z));
            if(res.length > 0) {
        //        this.chunk.mesh.rotation.y = Math.PI;
                this.chunk.mesh.position.x -= 10;
                //this.light.position.set(7, 18, 0);
                break;
            }
        }
    };

    StreetLamp.prototype.update = function(time, delta) {
      //  if (get_rand() < this.light.intensity) {
      //      game.particles_box.fire(
      //          this.chunk.mesh.position.x,
      //          this.chunk.mesh.position.y + 15,
      //          this.chunk.mesh.position.z
      //      );
      //  }
    };
}
StreetLamp.prototype = new Obj; 
StreetLamp.prototype.constructor = StreetLamp;

// UfoSign
function UfoSign() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "radiation_sign";
    this.alive = true;
    this.light = 0;

    UfoSign.prototype.hit = function(dmg, dir, type, pos) {
       return this.chunk.hit(dir, dmg, pos);
    };

    UfoSign.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("ufo_sign", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.rotation.y = Math.PI/2;
   //     this.chunk.mesh.rotation.x = -Math.PI;
        // Check rotation depending on wall
        var res = game.world.checkExists(new THREE.Vector3(x-1,game.maps.ground+10,z));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = -Math.PI/2;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z-1));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = 2*Math.PI;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z+2));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = -Math.PI;
        }

        this.chunk.mesh.position.set(x, game.maps.ground+10, z);
    };
}
UfoSign.prototype = new Obj; 
UfoSign.prototype.constructor = UfoSign;

// RadiationSign
function RadiationSign() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "radiation_sign";
    this.alive = true;
    this.light = 0;

    RadiationSign.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    RadiationSign.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("radiation_sign", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.rotation.y = Math.PI/2;
        this.chunk.mesh.rotation.x = -Math.PI;
        // Check rotation depending on wall
        var res = game.world.checkExists(new THREE.Vector3(x-1,game.maps.ground+10,z));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = -Math.PI/2;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z-1));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = 2*Math.PI;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z+2));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = Math.PI;
        }

        this.chunk.mesh.position.set(x, game.maps.ground+10, z);
    };
}
RadiationSign.prototype = new Obj; 
RadiationSign.prototype.constructor = RadiationSign;

// Dead hearty
function DeadHearty() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "dead_hearty";
    this.alive = true;
    this.light = 0;
    this.radioactive = true;
    this.radioactive_leak = true;

    DeadHearty.prototype.hit = function(dmg, dir, type, pos) {
        //this.chunk.explode(dir, dmg);
        this.chunk.hit(dir, dmg, pos);
        this.alive = false;
    };

    DeadHearty.prototype.update = function(time, delta) {
        var pos = this.chunk.mesh.position;
        game.particles.radiation(pos.x+(2-get_rand()*4), pos.y, pos.z+(2-get_rand()*4));
        if(get_rand() > 0.9) {
            this.light.intensity = (2-get_rand());
        }
    };

    DeadHearty.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("dead_hearty", 1, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.rotation.y = Math.random()*Math.PI*2;
        this.chunk.mesh.position.set(x, game.maps.ground+1, z);
        this.light = this.green_light.clone();
        this.light.position.set(0, 3, 0);
        this.chunk.mesh.add(this.light);
    };
}
DeadHearty.prototype = new Obj; 
DeadHearty.prototype.constructor = DeadHearty;

function BarrelFire() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "barrel_fire";
    this.alive = true;
    this.light = 0;

    BarrelFire.prototype.hit = function(dmg, dir, type, pos) {
        if(this.chunk.hit(dir, dmg, pos)) {
            if(type != "missile" && type != "grenade") {
                game.sounds.PlaySound("bullet_metal", pos, 300);
            }
            this.alive = false;
            return true;
        } 
        return false;
    };

    BarrelFire.prototype.update = function(time, delta) {
        var pos = this.chunk.mesh.position;
        game.particles.fire(pos.x+(4-get_rand()*8), game.maps.ground+6+this.chunk.to_y*2, pos.z+(4-get_rand()*8));
        if(get_rand() > 0.9) {
            this.light.intensity = 2-get_rand()*0.1;
            this.light.distance = (20+get_rand()*5);
        }
    };

    BarrelFire.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("barrel_fire", 0.5, this);
        this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
        this.light = this.yellow_light.clone();
        this.light.position.set(0, 10, 0);
        this.chunk.mesh.add(this.light);
    };
}
BarrelFire.prototype = new Obj; 
BarrelFire.prototype.constructor = BarrelFire;

function Barrel() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "barrel";
    this.alive = true;
    this.light = 0;
    this.radioactive = true;
    this.radioactive_leak = true;

    Barrel.prototype.hit = function(dmg, dir, type, pos) {
        //this.chunk.explode(dir, dmg);
        if(this.chunk.hit(dir, dmg, pos)) {
            if(type != "missile" && type != "grenade") {
                game.sounds.PlaySound("bullet_metal", pos, 300);
            }
            this.alive = false;
            return true;
        } 
        return false;
    };

    Barrel.prototype.update = function(time, delta) {
        var pos = this.chunk.mesh.position;
        game.particles.radiation(pos.x+(1-get_rand()*2), game.maps.ground+4+this.chunk.to_y*2, pos.z+(1-get_rand()*2));
        if(get_rand() > 0.9) {
            this.light.intensity = 2-get_rand()*0.1;
            this.light.distance = (20+get_rand()*5);
        }
    };

    Barrel.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("barrel", 0.5, this);
        //this.chunk.owner = this;
        //this.chunk.mesh.visible = true;
      //  this.chunk.mesh.rotation.y = Math.random()*Math.PI*2;
       // this.chunk.mesh.rotation.y = -Math.PI;
        this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
        this.light = this.green_light.clone();
        this.light.position.set(0, 10, 0);
        this.chunk.mesh.add(this.light);
    };
}
Barrel.prototype = new Obj; 
Barrel.prototype.constructor = Barrel;

function FBIHQ() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "fbihq";
    this.alive = true;

    FBIHQ.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    FBIHQ.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("fbihq", 1, this);
        //this.chunk.mesh.rotation.y = -Math.PI;
        this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.chunk_size_y*this.chunk.blockSize/2, z);
    };
}
FBIHQ.prototype = new Obj; 
FBIHQ.prototype.constructor = FBIHQ;

// Spiderweb
function SpiderWeb() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "spiderweb";
    this.alive = true;
    this.light = 0;

    SpiderWeb.prototype.hit = function(dmg, dir, type) {
        this.chunk.explode(dir, dmg);
        this.alive = false;
    };

    SpiderWeb.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("spiderweb", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+1, z);
    };
}
SpiderWeb.prototype = new Obj; 
SpiderWeb.prototype.constructor = SpiderWeb;

// Ammo crate 
function Lamp1() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "lamp1";
    this.alive = true;
    this.light = 0;

    Lamp1.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos)
        if(this.light.intensity > 0) {
            this.light.intensity -= 0.5*dmg;
            if(this.light.intensity < 0) {
                this.light.intensity = 0;
            }
        }
        if (this.chunk.health < 60) {
            this.alive = false;
        }
    };

    Lamp1.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("lamp1", 1, this);
        this.chunk.type = "object";
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+7, z);
        this.light = this.yellow_light.clone();
        this.light.position.set(0, 12, 0);
        this.chunk.mesh.add(this.light);
    };

    Lamp1.prototype.update = function(time, delta) {
        if (get_rand() < this.light.intensity) {
            game.particles_box.fire(
                this.chunk.mesh.position.x,
                this.chunk.mesh.position.y + 8,
                this.chunk.mesh.position.z
            );
        }
    };
}
Lamp1.prototype = new Obj; 
Lamp1.prototype.constructor = Lamp1;

// Ammo crate 
function AmmoCrate() {
    Obj.call(this);
    this.sides = [];

    AmmoCrate.prototype.create = function() {
        var up = game.modelLoader.getModel("crate", 1, this);
        up.mesh.visible = false;
        up.mesh.rotation.set(Math.PI, 0, 0);
        up.mesh.position.set(200, 8, 300);

    };
}
AmmoCrate.prototype = new Obj; 
AmmoCrate.prototype.constructor = AmmoCrate;

// Ammo shell 
function AmmoSniper() {
    Obj.call(this);

    AmmoSniper.prototype.create = function() {
        Obj.prototype.create.call(this, "ammo", 0.02);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);

        }
    };

    AmmoSniper.prototype.add = function(x,y,z) {
        if(this.ptr++ >= this.max - 1) {
            this.ptr = 0;
        }
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
AmmoSniper.prototype = new Obj; 
AmmoSniper.prototype.constructor = AmmoSniper;

// Ammo shell
function AmmoP90() {
    Obj.call(this);

    AmmoP90.prototype.create = function() {
        Obj.prototype.create.call(this, "ammo", 0.009);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);

        }
    };

    AmmoP90.prototype.add = function(x,y,z) {
        if(this.ptr == this.max - 1) {
            this.ptr = 0;
        }
        this.ptr++;
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
AmmoP90.prototype = new Obj; 
AmmoP90.prototype.constructor = AmmoP90;

// Ammo shell
function Ammo() {
    Obj.call(this);

    Ammo.prototype.create = function() {
        Obj.prototype.create.call(this, "ammo", 0.015);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);
        }
    };

    Ammo.prototype.add = function(x,y,z) {
        if(this.ptr == this.max - 1) {
            this.ptr = 0;
        }
        this.ptr++;
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
Ammo.prototype = new Obj; 
Ammo.prototype.constructor = Ammo;

// Shotgun shell
function Shell() {
    Obj.call(this);

    Shell.prototype.create = function() {
        Obj.prototype.create.call(this, "shell", 0.025);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);
        }
    };

    Shell.prototype.add = function(x,y,z) {
//        game.particles.empty_shell(x,y,z, this.chunk);
        if(this.ptr++ >= this.max - 1) {
            this.ptr = 0;
        }
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
Shell.prototype = new Obj; 
Shell.prototype.constructor = Shell;

// Heart
function Heart() {
    Obj.call(this);
    this.obj_type = "heart";

    Heart.prototype.create = function() {
        Obj.prototype.create.call(this, "heart", 0.2);
    };

    Heart.prototype.grab = function (mesh_id) {
        for(var i = 0; i < this.active.length; i++) {
            if(this.active[i].id == mesh_id) {
                game.sounds.PlaySound("take_heart", this.active[i].position, 250);
                game.removeFromCD(this.active[i]);
                this.active[i].alive = false;
            }
        }
    };

    Heart.prototype.update = function(time, delta) {
        Obj.prototype.update.call();
        for(var i = 0; i < this.active.length; i++) {
            if (this.active[i].alive) {
                this.active[i].rotation.y += Math.sin(delta);
                this.active[i].position.y = game.maps.ground+6 + Math.sin(time * 2.5);
                if(get_rand() > 0.5) {
                    game.particles.blueMagic(
                                             this.active[i].position.x,
                                             this.active[i].position.y,
                                             this.active[i].position.z
                    );
                }
            } else {
                if (this.active[i].position.y < game.maps.ground+20) {
                    //this.active[i].rotation.y += time*10;
                    this.active[i].position.y += 0.3;
                } else {
                    this.active[i].rotation.y = 0;
                    this.chunk.virtual_explode(this.active[i].position);
                    game.scene.remove(this.active[i]);
                    this.active.splice(i, 1);
                }
            }
        }
    };

    Heart.prototype.add = function(x,y,z) {
        var m = this.chunk.mesh.clone();
        game.scene.add(m);
        m.position.set(x,y,z);
        m.visible = true;
        this.active.push(m);
        m.alive = true;
        m.owner = this;
        var l1 = this.red_light.clone();
        var l2 = this.red_light.clone();
        m.add(l1);
        m.add(l2);
        l1.position.y = 2;
        l1.position.z = -2;
        l2.position.y = 2;
        l2.position.z = 2;
        game.addToCD(m);
      //  var light1 = new THREE.PointLight( 0xFF00AA, 2, 20 );
      //  m.add( light1 );
    };
}
Heart.prototype = new Obj; 
Heart.prototype.constructor = Heart;
