//////////////////////////////////////////////////////////////////////
// Weapon base class
//////////////////////////////////////////////////////////////////////
function Weapon() {
    this.ammo = 0;
    this.base_type = "weapon";
    this.chunk = 0;
    this.name = "";
    this.fire_rate = 0; // in ms between each
    this.reloading = 0;
    this.attached = false;
    this.attached_id = 0;
    this.alive = true;
    this.timeout = 0;
    this.relative_speed = 0;
    this.shoot_light = new THREE.PointLight( 0xFFAA00, 3, 10 );
    this.damage = 1;

    Weapon.prototype.create = function(model, size) {
        game.scene.add(this.shoot_light);
        this.chunk = game.modelLoader.getModel(model, size, this, true);
        game.removeFromCD(this.chunk.mesh);
        game.addObject(this);
    };

    Weapon.prototype.destroy = function() {
        game.scene.remove(this.chunk.mesh);
        game.removeFromCD(this.chunk.mesh);
       // this.chunk.mesh.geometry.dispose();
       // this.chunk.mesh.material.dispose();
       // this.chunk.bb.geometry.dispose();
       // this.chunk.bb.material.dispose();
        this.alive = false;
    };

    Weapon.prototype.setPosition = function(x, y, z) {
        this.chunk.mesh.position.set(x, y, z);
    };

    Weapon.prototype.setRotation = function(x, y, z) {
        this.chunk.mesh.rotation.set(x, y, z);
    };

    Weapon.prototype.detach = function(mesh, pos) {
        if (this.attached && mesh.id == this.attached_id) {
            this.chunk.mesh.visible = true;
            mesh.remove(this.chunk.mesh);
            game.scene.add(this.chunk.mesh);
            game.addToCD(this.chunk.mesh);
            this.setRotation(Math.PI, Math.PI, 0);
            this.setPosition(pos.x+(6-get_rand()*12), 6, pos.z+(6-get_rand()*12));
            this.attached = false;
            this.attached_id = 0;
        }
    };

    Weapon.prototype.attach = function(mesh) {
        if(!this.attached) {
            game.sounds.PlaySound("reload", this.chunk.mesh.position, 800);
            this.timeout = 0;
            mesh.add(this.chunk.mesh);
            game.removeFromCD(this.chunk.mesh);
            this.attached = true;
            this.attached_id = mesh.id;
            return true;
        }
        return false;
    };

    Weapon.prototype.shoot = function(dir, id, mesh, speed) {
        if(this.reloading <= 0) {
            this.fire(dir, id, mesh, speed);
            this.reloading = this.fire_rate;
            //var light = this.shoot_light.clone();
            var draw_light = false;
            // Keep fps higher
            if(this.obj_type == "minigun" && get_rand() > 0.5) {
            //    draw_light = false;
            }
            if (draw_light) {
                var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
                this.shoot_light.position.set(
                    point.x,
                    point.y,
                    point.z
                );
                this.shoot_light.visible = true;
            }
            //game.scene.add( light );
            //setTimeout(function() { game.scene.remove(light);}, 10);
            //this.lights.push(light);
        }
    };

    Weapon.prototype.update = function(time, delta) {
        if(!this.attached) {
            if(this.timeout > 60) { // Remove after 1min.
                this.destroy();
            }
            this.timeout += delta;
        }
        // Update reload time
        if(this.reloading >= 0) {
            this.reloading -= delta;
        }
        // Animate dropped weapon
        if(!this.attached) {
            this.chunk.mesh.position.y = game.maps.ground+6+Math.sin(time*2.5);
            this.chunk.mesh.rotation.y += Math.sin(delta);
        }
        if (this.shoot_light.visible) {
            this.shoot_light.visible = false;
        }
    };
}

//////////////////////////////////////////////////////////////////////
// Shotgun class
//////////////////////////////////////////////////////////////////////
function Shotgun() {
    Weapon.call(this);
    this.obj_type = "shotgun";
    this.fire_rate = 0.5;
    this.create("shotgun", 0.1);
    this.recoil = 1;
    this.damage = 1;

    Shotgun.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Shotgun.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("shotgun", game.player.chunk.mesh.position, 250);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for (var i = 0; i < 10; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x + (1 - get_rand() * 2), point.y + (1 - get_rand() * 2), point.z + (1 - get_rand() * 2), 0.5);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoShell(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["shell"].add(point.x, point.y, point.z);
        game.sounds.PlaySound("shotgun_reload", game.player.chunk.mesh.position, 300);
    };

}
Shotgun.prototype = new Weapon;
Shotgun.prototype.constructor = Shotgun;

//////////////////////////////////////////////////////////////////////
// Sniper class
//////////////////////////////////////////////////////////////////////
function Sniper() {
    Weapon.call(this);
    this.obj_type = "sniper";
    this.fire_rate = 1.5;
    this.create("sniper", 0.1);
    this.recoil = 5;
    this.damage = 5;

    Sniper.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Sniper.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("sniper", game.player.chunk.mesh.position, 300);

        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoSniper(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo_sniper"].add(point.x, point.y, point.z);
    };

}
Sniper.prototype = new Weapon;
Sniper.prototype.constructor = Sniper;

//////////////////////////////////////////////////////////////////////
// Pistol class
//////////////////////////////////////////////////////////////////////
function Pistol() {
    Weapon.call(this);
    this.obj_type = "pistol";
    this.fire_rate = 0.5;
    this.create("pistol", 0.1);
    this.recoil = 0.2;
    this.damage = 1;

    Pistol.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Pistol.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("pistol", game.player.chunk.mesh.position, 450);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoP90(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo_p90"].add(point.x, point.y, point.z);
    };

}
Pistol.prototype = new Weapon;
Pistol.prototype.constructor = Pistol;

//////////////////////////////////////////////////////////////////////
// Grenade Launcher class
//////////////////////////////////////////////////////////////////////
function GrenadeLauncher() {
    Weapon.call(this);
    this.obj_type = "grenadelauncher";
    this.fire_rate = 1;
    this.create("grenadelauncher", 0.1);
    this.recoil = 0.2;
    this.damage = 8;

    GrenadeLauncher.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    GrenadeLauncher.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("grenadelauncher", game.player.chunk.mesh.position, 450);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoGrenadeLauncher(point.x, point.y, point.z, dir.x, dir.y, dir.z, speed, this.damage);
    };

}
GrenadeLauncher.prototype = new Weapon;
GrenadeLauncher.prototype.constructor = GrenadeLauncher;

//////////////////////////////////////////////////////////////////////
// P90 class
//////////////////////////////////////////////////////////////////////
function P90() {
    Weapon.call(this);
    this.obj_type = "p90";
    this.fire_rate = 0.07;
    this.create("p90", 0.1);
    this.recoil = 0.2;
    this.damage = 1;

    P90.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    P90.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("p90", game.player.chunk.mesh.position, 350);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoP90(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo_p90"].add(point.x, point.y, point.z);
    };

}
P90.prototype = new Weapon;
P90.prototype.constructor = P90;

//////////////////////////////////////////////////////////////////////
// Minigun class
//////////////////////////////////////////////////////////////////////
function Minigun() {
    Weapon.call(this);
    this.obj_type = "minigun";
    this.fire_rate = 0.1;
    this.create("minigun", 0.1);
    this.recoil = 0.2;
    this.damage = 2;

    Minigun.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Minigun.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("minigun", game.player.chunk.mesh.position, 250);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 5; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoMinigun(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo"].add(point.x, point.y, point.z);
    };

}
Minigun.prototype = new Weapon;
Minigun.prototype.constructor = Minigun;


//////////////////////////////////////////////////////////////////////
// Ak47 class
//////////////////////////////////////////////////////////////////////
function Ak47() {
    Weapon.call(this);
    this.obj_type = "ak47";
    this.fire_rate = 0.15;
    this.create("ak47", 0.1);
    this.recoil = 1;
    this.damage = 2;

    Ak47.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Ak47.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("ak47", game.player.chunk.mesh.position, 350);

        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 5; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoAk47(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo"].add(point.x, point.y, point.z);
    };

}
Ak47.prototype = new Weapon;
Ak47.prototype.constructor = Ak47;

//////////////////////////////////////////////////////////////////////
// RocketLauncher class
//////////////////////////////////////////////////////////////////////
function RocketLauncher() {
    Weapon.call(this);
    this.obj_type = "rocketlauncher";
    this.fire_rate = 1;
    this.create("rocketlauncher", 0.1);
    this.recoil = 4;
    this.damage = 6;

    RocketLauncher.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    RocketLauncher.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("rocket", game.player.chunk.mesh.position, 350);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);
        game.particles.ammoMissile(point.x, point.y, point.z, dir.x, dir.y, dir.z, this, null, speed, this.damage);

        for(var i = 0; i < 50; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x+(1-get_rand()*2), point.y + (1-get_rand()*2), point.z+(1-get_rand()*2), 0.5);
        }
//        shooter.translateZ(-this.recoil);
    };

}
RocketLauncher.prototype = new Weapon;
RocketLauncher.prototype.constructor = RocketLauncher;
