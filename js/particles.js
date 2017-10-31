function ParticlePool(size, type) {
    this.particles = [];
    this.queue = [];
    this.size = size;
    this.pos = 0;
    this.neg = 0;
    this.old_shells = [];
    this.clean_old_shells = 0;
    this.opts = 0;
    this.update_cnt = 0;
    this.lights = [];

    ParticlePool.prototype.init = function (size, type) {
        this.size = size;
        for (var i = 0; i < this.size; i++) {
            var p = new Particle();
            p.init(type);
            this.particles.push(p);
        }
    };

    ParticlePool.prototype.update = function (time, delta) {
        // Dim lights 
        for(var i = 0; i < this.lights.length; i++) {
            this.lights[i].intensity -= 0.5;
            if (this.lights[i].intensity <= 0) {
                if (this.lights[i].parent != null) {
                    this.lights[i].parent.remove(this.lights[i]);
                } else {
                    game.scene.remove(this.lights[i]);
                }
            }
        }

        // Clean up shells
        if (this.clean_old_shells > 0.2) {
            for (var i = 0; i < this.old_shells.length; i++) {
                if (this.old_shells[i] == null) {
                    continue;
                }
                this.old_shells[i].position.y -= 0.06;
                if (this.old_shells[i].position.y < game.maps.ground-1) {
                    //game.scene.remove(this.old_shells[i]);
                    this.old_shells[i].visible = false;
                    //   this.old_shells[i].geometry.dispose();
                    //   this.old_shells[i].material.dispose();
                    //this.old_shells.splice(i, 1);
                    this.old_shells[i] = null;
                }
            }
            this.clean_old_shells = 0;
        }
        this.clean_old_shells += delta;

        // Create max particles each frame
        for (var i = 0; i < 300; i++) {
            if (this.queue.length == 0) {
                break;
            }
            var p = this.queue.pop();
            if (this.create(p) == -1) {
                this.queue.push(p);
                break;
            }
        }

        var tot = 0;
        var ts = 0;
        for (var i = this.update_cnt; i < this.particles.length; i++) {
            this.update_cnt = i;
            if (this.particles[i].active) {
                if(this.particles[i].type == "grenade" || this.particles[i].type == "missile" || this.particles[i].type == "minigun" || this.particles[i].type == "shell") {
                    this.particles[i].update(time, delta);
                } else {
                    if(tot < 5) {
                        ts = Date.now();
                        this.particles[i].update(time, delta);
                        tot += (Date.now() - ts);
                    }
                }
            }
        }
        if(this.update_cnt == this.particles.length - 1) {
            this.update_cnt = 0;
        }
    };

    ParticlePool.prototype.create = function (opts) {
        for (var i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) {
                this.particles[i].set(opts);
                return this.particles[i];
            }
        }
        return -1;
    };

    ParticlePool.prototype.get = function (opts) {
        this.queue.push(opts);
    };

    //
    // Predefined types of particles
    //
    ParticlePool.prototype.fire = function (x, y, z) {
        this.get({
            size: 0.5,
            type: "smoke",
            r: 200 + get_rand() * 55 | 0,
            g: get_rand() * 180 | 0,
            b: get_rand() * 200 | 0,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 1,
            power: 0.01,
            gravity: 0,
            bounces: 0,
            mass: 10,
            fx_: 0.5,
            fz_: 0.5,
            vx: 0.5 - get_rand() * 1,
            vy: get_rand(),
            vz: 0.5 - get_rand() * 1
        });
    };

    ParticlePool.prototype.explosion = function (x, y, z, power, type) {
        var c = 0;
        for (var i = 0; i < power*10; i++) {
            c = 50+ get_rand()*205|0;
           // Add smoke
            this.get({
                size: 0.5,
                type: "smoke",
                x: x+2-get_rand()*4,
                y: y,
                z: z+2-get_rand()*4,
                r: c,
                g: c,
                b: c,
                life: get_rand()*3,
                power: get_rand() * 5,
                gravity: -0.5,
                bounces: 0,
                mass: 10,
                fx_: 0.1,
                fz_: 0.1,
                vx: get_rand(),
                vy: get_rand()*2,
                vz: get_rand()
            });
            // add fire
            this.get({
                size: 0.5,
                type: "smoke",
                r: 200+get_rand()*55|0,
                g: 180,
                b: get_rand()*50|0,
                x: x+2-get_rand()*4,
                y: y,
                z: z+2-get_rand()*4,
                life: get_rand()*3,
                power: 5 + get_rand() * 5,
                gravity: 5,
                bounces: 0,
                mass: 10,
                fx_: 0.5,
                fz_: 0.5,
                vx: 3 - get_rand() * 6,
                vy: get_rand() * 8,
                vz: 3 - get_rand() * 6
            });
        }
        if (type == "missile") {
            var p = game.p_light.clone();
            p.position.set(x, y, z);
            p.visible = true;
            p.intensity = 20;
            p.distance = 30;
            game.scene.add(p);
            game.particles.lights.push(p);
        } else {
           // var p = game.p_light.clone();
           // p.position.set(x, y, z);
           // p.visible = true;
           // p.intensity = 4;
           // p.distance = 10;
           // game.scene.add(p);
           // game.particles.lights.push(p);
        }
    };



    ParticlePool.prototype.chunkDebris = function (x, y, z, chunk, dirx, diry, dirz, power) {
        var vx, vy, vz, fx, fz;
        fz = get_rand(); //0.3;//+power/50;
        fx = get_rand(); // 0.3;//+power/50;
        vx = dirx + (1 - get_rand() * 2);
        vy = diry + get_rand() * 4;
        vz = dirz + (1 - get_rand() * 2);
        type = "chunk_debris";
     //   if(chunk.current_blocks > 0) {
     //       mass = 1/(chunk.current_blocks*0.01); 
     //       console.log(mass);
     //   }
     //   if(mass > 1) { 
     //       mass = 1;
     //   }

        this.get({
            chunk: chunk,
            chunk_mesh: chunk.mesh,
            size: chunk.blockSize,
            type: type,
            x: x,
            y: y,
            z: z,
            life: 5,
            power: (1 + get_rand() * 5),
            gravity: 9.82,
            bounces: 2 + get_rand() * 2 | 0,
            mass: 1,
            fx_: fx,
            fz_: fz,
            vx: vx,
            vy: vy,
            vz: vz
        });
     //   console.log("C:",chunk.current_blocks, "M:",mass, "VX:",vx, "VY:",vy*mass, "VZ:",vz, "FX:",fx, "FZ:",fz);
    };

    // Shell from a gun
    ParticlePool.prototype.empty_shell = function (x, y, z, mesh) {
        var vx, vy, vz, fx, fz;
        vx = get_rand();
        vy = get_rand();
        vz = get_rand();
        fx = 0.2 + get_rand();
        fz = 0.2 + get_rand();
        this.get({
            chunk_mesh: mesh,
            type: "empty_shell",
            size: 1,
            x: x,
            y: y,
            z: z,
            life: 2,
            power: 0.1,
            gravity: 9.82,
            bounces: 3,
            mass: 1,
            fx_: fx,
            fz_: fz,
            vx: vx,
            vy: vy,
            vz: vz
        });
        mesh.visible = true;
    };

    // Radioactive splats
    ParticlePool.prototype.radioactive_splat = function (x, y, z, size, dirx, diry, dirz) {
        this.get({
            type: "radioactive_splat",
            r: get_rand() * 50 | 0,
            g: 200 + get_rand() * 100 | 0,
            b: 50 + get_rand() * 55 | 0,
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 20,
            power: 2 + get_rand() * 2,
            gravity: get_rand()*2,
            bounces: 0,
            mass: 10,
            fx_: 1.5 - Math.random()*3,
            fz_: 1.5 - Math.random()*3,
            vx: 0.5 - get_rand() * 2,
            vy: 0.5 + get_rand() * 2,
            vz: 0.5 - get_rand() * 2
        });
    };

    // Radioactive leaks
    ParticlePool.prototype.radioactive_leak = function (x, y, z, size) {
        this.get({
            type: "radioactive_leak",
            r: get_rand() * 50 | 0,
            g: 200 + get_rand() * 55 | 0,
            b: 50 + get_rand() * 55 | 0,
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 3,
            power: 2 + get_rand() * 2,
            gravity: 9.82,
            bounces: 0,
            mass: 10,
            fx: 0.2 + (0.5 - get_rand() * 1),
            fz: 0.2 + (0.5 - get_rand() * 1),
            vx: 1-Math.random()*2,
            vy: get_rand()*2.5,
            vz: 1-Math.random()*2,
        });
    };

    // Blood
    ParticlePool.prototype.blood = function (x, y, z, size, dirx, diry, dirz) {
        this.get({
            type: "blood",
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 3,
            power: 3 + get_rand() * 3,
            gravity: 9.82,
            r: 138,
            g: get_rand() * 15 | 0,
            b: get_rand() * 15 | 0,
            bounces: 2,
            mass: 10,
            fx: 0.2 + (0.5 - get_rand() * 1),
            fz: 0.2 + (0.5 - get_rand() * 1),
            vx: dirx + (0.5 - get_rand() * 1),
            vy: diry + get_rand(),
            vz: dirz + (0.5 - get_rand() * 1)
        });
    };

    // World debris (with smoke and fire)
    ParticlePool.prototype.world_debris = function (x, y, z, size, r, g, b) {
        this.get({
            type: "world_debris",
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 4,
            power: 5 + get_rand() * 5,
            gravity: 9.82,
            r: r,
            g: g,
            b: b,
            bounces: 2 + get_rand() * 2 | 0,
            mass: 10,
            fx_: 0.5 - Math.random(),
            fz_: 0.5 - Math.random(),
            vx: 2 - get_rand() * 4,
            vy: 3 + get_rand() * 4,
            vz: 2 - get_rand() * 4
        });
    };


    // Debris 
    ParticlePool.prototype.debris = function (x, y, z, size, r, g, b, virtual, dirx, diry, dirz, stay) {
        if(stay == null) { stay = true; }
        var vx, vy, vz, fx, fz;
        var type;
        var gravity = 9.82;
        if (dirx != null) {
            vx = dirx;
            vy = diry + get_rand() * 4;
            vz = dirz;
            fx = 0.2;
            fz = 0.2;
        } else {
            if (virtual) {
                vx = 2 - Math.random() * 4;
                vy = 2 + Math.random() * 4;
                vz = 2 - Math.random() * 4;
                gravity = 12;
            } else {
                vx = 2 - get_rand() * 4;
                vy = 2 + get_rand() * 4;
                vz = 2 - get_rand() * 4;
            }
            fz = 0.4;
            fx = 0.4;
        }
        if (virtual) {
            type = "virtual_debris";
        } else {
            type = "debris";
            y += 2;
        }
        var bounces = 0;
        var life = 0;
        if(!stay) {
            bounces = 0;
            life = 0.8;
        } else {
            bounces = 2 + get_rand()*2|0;
            life = get_rand() * 4;
        }
        this.get({
            stay: stay,
            type: type,
            size: size,
            x: x,
            y: y,
            z: z,
            life: life,
            power: 5 + get_rand() * 5,
            gravity: gravity,
            r: r,
            g: g,
            b: b,
            bounces: bounces,
            mass: 10,
            fx_: fx,
            fz_: fz,
            vx: vx,
            vy: vy,
            vz: vz
        });
    };

    ParticlePool.prototype.rain = function () {
        var rand1 = Math.random() * game.maps.width;
        var rand2 = Math.random() * game.maps.height;
        this.get({
            type: "rain",
            size: 0.5,
            x: rand1,
            y: 200,
            z: rand2,
            life: get_rand() * 15,
            power: 0,
            gravity: 5.82,
            r: 79,
            g: 213,
            b: 214,
            fx_: 0,
            fz_: 0,
            vx: 0.1,
            vy: 0.1,
            vz: 0.1,
        });
    };

    ParticlePool.prototype.snow = function () {
        var rand1 = Math.random() * game.maps.width;
        var rand2 = Math.random() * game.maps.height;
        this.get({
            type: "snow",
            size: 0.8,
            x: rand1,
            y: 150,
            z: rand2,
            life: get_rand() * 25,
            power: 0,
            gravity: 0.8,
            r: 255,
            g: 245,
            b: 255,
            fx_: 0,
            fz_: 0,
            vx: 0.1,
            vy: 0.2,
            vz: 0.1,
        });
    };

    ParticlePool.prototype.walkSmoke = function (x, y, z) {
        var rand = -2 + get_rand() * 4;
        var rand_c = get_rand() * 100 | 0;
        this.get({
            size: 1,
            x: x + rand,
            y: y - 3,
            z: z + rand,
            life: get_rand(),
            power: 0.1,
            gravity: 0,
            r: 155 + rand_c,
            g: 155 + rand_c,
            b: 155 + rand_c,
            fx_: 0,
            fz_: 0,
            vx: 0.5,
            vy: 0.5,
            vz: 0.5,
        });
    };

    ParticlePool.prototype.portalMagic = function (x, y, z) {
        var r = 0; 
        var g = 0;
        var b = 0;
        if(get_rand() > 0.5) {
            r = get_rand() * 50 | 0;
            g = 100 + get_rand() * 100 | 0;
            b = 200 + get_rand() * 55 | 0;
        } else {
            r = 200 + get_rand() * 55 | 0;
            g = 0;
            b = 200 + get_rand() * 55 | 0; 
        }
        this.get({
            size: 0.5,
            x: 3 - get_rand() * 6 + x,
            y: 3 - get_rand() * 6 + y,
            z: 3 - get_rand() * 6 + z,
            life: get_rand() * 1.3,
            power: 0.5,
            gravity: -2,
            r: r,
            g: g,
            b: b,
        });
    };

    ParticlePool.prototype.radiation = function (x, y, z) {
        this.get({
            size: 0.3,
            x: 3 - get_rand() * 6 + x,
            y: 3 - get_rand() * 6 + y,
            z: 3 - get_rand() * 6 + z,
            life: get_rand() * 1.3,
            power: 0.5,
            gravity: -1,
            r: get_rand() * 50 | 0,
            g: 200 + get_rand() * 100 | 0,
            b: 50 + get_rand() * 55 | 0,
        });
    };

    ParticlePool.prototype.blueMagic = function (x, y, z) {
        this.get({
            size: 0.5,
            x: 3 - get_rand() * 6 + x,
            y: 3 - get_rand() * 6 + y,
            z: 3 - get_rand() * 6 + z,
            life: get_rand() * 1.3,
            power: 0.5,
            gravity: -2,
            r: get_rand() * 50 | 0,
            g: 100 + get_rand() * 100 | 0,
            b: 200 + get_rand() * 55 | 0,
        });
    };

    ParticlePool.prototype.debris_smoke = function (x, y, z, size) {
        // random black/white + fire
        var r, g, b;
        var v = get_rand();
        if (v < 0.3) {
            r = 200 + get_rand() * 55;
            g = 150 + get_rand() * 80;
            b = 20 + get_rand() * 20;
            // white 
            //          r = g = b = 200+get_rand()*55;
        } else if (v < 0.6) {
            // black
            //            r = g = b = 0+get_rand()*50;

            r = 200 + get_rand() * 55;
            g = 80 + get_rand() * 80;
            b = 20 + get_rand() * 20;
        } else {
            r = 150 + get_rand() * 105;
            g = 80 + get_rand() * 80;
            b = 20 + get_rand() * 20;
        }
        this.get({
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 0.5,
            power: 0.5,
            gravity: -2,
            r: r,
            g: g,
            b: b,
        });
    };

    ParticlePool.prototype.smoke = function (x, y, z, size) {
        this.get({
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand(),
            power: 0.5,
            gravity: -2,
            r: 255,
            g: 255,
            b: 255,
        });
    };

    ParticlePool.prototype.gunSmoke = function (x, y, z, dirx, diry, dirz) {
        var rand_c = get_rand() * 100 | 0;
        this.get({
            size: 0.5,
            x: x + (2 - get_rand() * 4),
            y: y,
            z: z + (2 - get_rand() * 4),
            life: get_rand() * 1,
            power: 5.5,
            gravity: get_rand() * 6,
            r: 200 + rand_c,
            g: 100 + rand_c,
            b: 0,
            fx_: 0.1,
            fz_: 0.1,
            vx: get_rand() + dirx,
            vy: get_rand() + diry,
            vz: get_rand() + dirz,
        });
    };

    //
    // Different types of ammo
    //
    ParticlePool.prototype.ammoGrenadeLauncher = function (x, y, z, dirx, diry, dirz, speed, dmg) {
        this.get({
            damage: dmg,
            type: 'grenade',
            size: 1,
            x: x,
            y: y,
            z: z,
            life: 4+get_rand()*2,
            gravity: 9.82,
            bounces: get_rand()*3|0,
            power: 2,
            fx_: 1.2,
            fz_: 1.2,
            vx: dirx,
            vz: dirz,
            vy: diry+(0.6-get_rand()*1) + 5,
            light: false,
        });
    };

    ParticlePool.prototype.ammoMissile = function (x, y, z, dirx, diry, dirz, owner, chunk, speed, dmg) {
        var p = this.get({
            damage: dmg,
            owner: owner,
            type: 'missile',
            size: 1,
            x: x,
            y: y,
            z: z,
            life: 2,
            gravity: 2,
            power: 6,
            fx_: 2.4 + speed,
            fz_: 2.4 + speed,
            vx: dirx+(0.1-get_rand()*0.2),
            vz: dirz+(0.1-get_rand()*0.2),
            vy: diry+(0.1-get_rand()*0.2),
            light: false,
        });
    };

    // Ammo for shotgun
    ParticlePool.prototype.ammoShell = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
        var shots = [];
        for (var i = 0; i < 10; i++) {
            shots.push(this.get({
                damage: dmg,
                owner: owner,
                type: 'shell',
                size: 0.5,
                r: 200,
                g: 200,
                b: 200,
                x: x,
                y: y,
                z: z,
                life: 0.7,
                gravity: 0,
                power: 6,
                fx_: 2.4 + speed,
                fz_: 2.4 + speed,
                vx: dirx + (1 - get_rand() * 2),
                vz: dirz + (1 - get_rand() * 2),
                vy: diry,
            }));
        }
    };

    // Ammo for Sniper
    ParticlePool.prototype.ammoSniper = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
        this.get({
            damage: dmg,
            owner: owner,
            type: 'shell',
            size: 0.5,
            r: 250,
            g: 250,
            b: 250,
            x: x,
            y: y,
            z: z,
            life: 1.5,
            gravity: 0,
            power: 10,
            fx_: 4.4 + speed,
            fz_: 4.4 + speed,
            vx: dirx,
            vz: dirz,
            vy: diry,
        });
    };

    // Ammo for p90
    ParticlePool.prototype.ammoP90 = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
        this.get({
            damage: dmg,
            owner: owner,
            type: 'shell',
            size: 0.2,
            r: 200,
            g: 200,
            b: 200,
            x: x,
            y: y,
            z: z,
            life: 0.7,
            gravity: 0,
            power: 7,
            fx_: 2.4 + speed,
            fz_: 2.4 + speed,
            vx: dirx+(0.1-get_rand()*0.2),
            vz: dirz+(0.1-get_rand()*0.2),
            vy: diry,
        });
    };

    // Ammo for minigun
    ParticlePool.prototype.ammoMinigun = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
        this.get({
            damage: dmg,
            owner: owner,
            type: 'minigun',
            size: 0.5,
            r: 200,
            g: 200,
            b: 200,
            x: x,
            y: y,
            z: z,
            life: 1,
            gravity: 0,
            power: 2,
            fx_: 2.4 + speed,
            fz_: 2.4 + speed,
            vx: dirx+(0.5-get_rand()),
            vz: dirz+(0.5-get_rand()),
            vy: diry+(0.5-get_rand()),
            light: false,
        });
    };

    // Ammo for ak47
    ParticlePool.prototype.ammoAk47 = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
        this.get({
            damage: dmg,
            owner: owner,
            type: 'shell',
            size: 0.4,
            r: 200,
            g: 200,
            b: 200,
            x: x,
            y: y,
            z: z,
            life: 1,
            gravity: 0,
            power: 6,
            fx_: 2.4 + speed,
            fz_: 2.4 + speed,
            vx: dirx+(0.1-get_rand()*0.2),
            vz: dirz+(0.1-get_rand()*0.2),
            vy: diry,
        });
    };
}

function Particle() {
    this.life = 0;
    this.active = 0;
    this.mesh = undefined;
    this.gravity = 9.82;
    this.e = -0.3; // restitution
    this.mass = 0.1; // kg
    this.airDensity = 1.2;
    this.area = 0.001;
    this.avg_ay = 0;

    this.vy = 0;
    this.vx = 0;
    this.vz = 0;
    this.avg_ax = 0;
    this.avg_az = 0;

    this.bounces = 0;
    this.bounces_orig = 0;
    this.fx_ = 0;
    this.fz_ = 0;
    this.ray = undefined;

    // Allocate once and reuse.
    this.new_ay = 0;
    this.new_ax = 0;
    this.new_az = 0;
    this.fx = 0;
    this.fy = 0;
    this.fz = 0;
    this.dx = 0;
    this.dy = 0;
    this.dz = 0;
    this.newPos = 0;
    this.ticks = 0;
    this.flip = 0.5;
    this.grav_mass = 0;
    this.air_area = 0;

    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.type = "regular";
    this.chunk = 0;
    this.damage = 0;
    this.cd_update = 0;
    this.old_mesh = 0;
    this.spin = 1;

    this.hit = false;
    this.size = 1;
    this.stay = true;

    Particle.prototype.set = function (opts) {
        if (!this.isVisible(new THREE.Vector3(opts.x, opts.y, opts.z))) {
            return;
        }
        for (var k in opts) {
            this[k] = opts[k];
        }
        this.grav_mass = this.gravity * this.mass;
        this.air_area = -0.5 * this.airDensity * this.area;

        if (this.type != "chunk_debris" && this.type != "empty_shell") {
            this.mesh.material.color.setRGB(opts.r / 255, opts.g / 255, opts.b / 255);
            this.mesh.material.needsUpdate = true;
            this.mesh.position.set(opts.x, opts.y, opts.z);
            this.mesh.visible = true;
            this.mesh.scale.set(this.size, this.size, this.size);
        } else {
            this.old_mesh = this.mesh;
            this.mesh.visible = false;
            // game.scene.remove(this.mesh);
            this.mesh = this.chunk_mesh;
            //            game.scene.add(this.mesh);
            this.mesh.visible = true;
            this.mesh.position.set(this.x, this.y, this.z);
        }
        if (this.light) {
            var p = game.p_light.clone();
            p.visible = true;
            p.intensity = 15;
            p.distance = 30;
            this.mesh.add(p);
            game.particles.lights.push(p);
            // var light = game.p_light.clone();
            // this.mesh.add(light);
            // TBD: Handle this better w/o setTimeout
            //setTimeout(function () { p.mesh.remove(light); }, p.life * 500);
        }
        this.active = 1;
    };

    Particle.prototype.reset = function () {
        if (this.type == "chunk_debris" || this.type == "empty_shell") {
            if (this.type == "empty_shell") {
                var found = -1;
                for (var i = 0; i < game.particles.old_shells.length; i++) {
                    if (game.particles.old_shells[i] == null) {
                        found = i;
                        break;
                    }
                }
                if (found == -1) {
                    game.particles.old_shells.push(this.mesh);
                } else {
                    game.particles.old_shells[found] = this.mesh;
                }
            }
            this.mesh = this.old_mesh;
            this.mesh.visible = true;
            //            game.scene.add(this.mesh);
        }
        this.mesh.visible = false;
        this.type = "regular";
        this.life = 0;
        this.active = 0;
        this.gravity = 9.82;
        this.e = -0.3; // restitution
        this.mass = 0.1; // kg
        this.airDensity = 1.2;
        this.area = 1 / 1000;
        this.vy = 0;
        this.avg_ay = 0;
        this.size = 1;

        this.vx = 0;
        this.vz = 0;
        this.avg_ax = 0;
        this.avg_az = 0;

        this.spin = 1;

        this.bounces = 0;
        this.bounces_orig = (1 + get_rand() * 2) | 0;
        this.fx_ = get_rand() * 2;
        this.fz_ = get_rand() * 2;

        this.newPos = 0;
        this.ticks = 0;
       // this.flip = 0.5;

        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.type = 0;
        this.chunk = null;
        this.light = false;
        this.hit = false;
        this.stay = true;
    };

    Particle.prototype.init = function (particle_type) {
        this.particle_type = particle_type;
        if (particle_type == 0) {
            this.mesh = new THREE.Sprite(game.sprite_material.clone());
        } else {
            this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), game.box_material.clone());
        }

        game.scene.add(this.mesh);
        this.mesh.visible = false;
        this.mesh.castShadow = false;
    };

    Particle.prototype.checkLife = function () {
        if (this.life <= 0 || this.mesh.position.y < 0) {
            this.active = 0;
            this.mesh.visible = false;
            return;
        }
    };

    Particle.prototype.isVisible = function (pos) {
        if (game.player != 0) {
            if (pos.distanceTo(game.player.chunk.mesh.position) > game.visible_distance) {
                return false;
            }
        }
        return true;
    };

    Particle.prototype.update = function (time, delta) {
        this.life -= delta;
        this.checkLife();

        if (this.life > 0 && this.active) { // || this.mesh.position.y < -5) {
            this.fy = this.grav_mass;
           // this.fx = this.grav_mass * this.flip;
           // this.fz = this.fx;
            //if (this.flip > 0) {
            //    this.flip = -0.5;
            //} else {
            //    this.flip = 0.5;
            //}

            //this.fy += this.air_area * this.vy * this.vy;
            //this.fx += this.air_area * this.vx * this.vx;
            //this.fz += this.air_area * this.vz * this.vz;
            this.fy += this.air_area * this.vy * this.vy;
            this.fx = this.air_area * this.vx * this.vx;
            this.fz = this.air_area * this.vz * this.vz;

            this.dy = this.vy * delta + (this.avg_ay * 0.0005);
            this.dx = this.vx * delta + (this.avg_ax * 0.0005);
            this.dz = this.vz * delta + (this.avg_az * 0.0005);

            // 10
            this.mesh.position.x += this.dx * 10 * this.fx_;
            this.mesh.position.z += this.dz * 10 * this.fz_;
            this.mesh.position.y += this.dy * 10;

            this.new_ay = this.fy / this.mass;
            this.avg_ay = 0.5 * (this.new_ay + this.avg_ay);
            this.vy -= this.avg_ay * delta;

            this.new_ax = this.fx / this.mass;
            this.avg_ax = 0.5 * (this.new_ax + this.avg_ax);
            this.vx -= this.avg_ax * delta;

            this.new_az = this.fz / this.mass;
            this.avg_az = 0.5 * (this.new_az + this.avg_az);
            this.vz -= this.avg_az * delta;


            switch (this.type) {
                case "world_debris":
                    if (get_rand() > 0.8) {
                        game.particles.debris_smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.5);
                    }
                    this.mesh.rotation.set(this.vx, this.vy, this.vz);
                    this.bounce();
                    break;
                case "debris":
                    this.mesh.rotation.set(this.vx, this.vy, this.vz);
                    this.bounce();
                break;
            case "chunk_debris":
                this.mesh.rotation.set(
                        this.vx/this.spin, 
                        this.vy/this.spin, 
                        this.vz/this.spin
                );
                if(this.chunk.owner.base_type == "enemy" || this.chunk.owner.base_type == "player") {
                    game.particles.blood(
                              this.mesh.position.x + (2 - get_rand() * 4),
                              this.mesh.position.y + (2 - get_rand() * 4),
                              this.mesh.position.z + (2 - get_rand() * 4),
                              0.5, this.vx/this.spin, this.vy/this.spin, this.vz/this.spin
                    );
                    this.bounce();
                }
                break;
                case "empty_shell":
                    this.mesh.rotation.set(this.vx, this.vy, this.vz);
                    if(get_rand() > 0.96) {
                        game.sounds.PlaySound("ammo_fall", this.mesh.position, 210);
                    }
                    this.bounce();
                    if (get_rand() > 0.9) {
                        game.particles.smoke(this.mesh.position.x + get_rand(), this.mesh.position.y, this.mesh.position.z, 0.3); // this.mesh.rotation);
                    }
                    break;
                case "radioactive_leak":
                    this.addRadiationToGround();
                    break;
                case "radioactive_splat":
                   // this.gravity = get_rand()*Math.sin(time);
                    break;
                case "blood":
                    this.addBloodToGround();
                    break;
                case "minigun":
                   // if (get_rand() > 0.9) {
                   //     game.particles.smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.3); //, this.mesh.rotation);
                   // }
                    this.cd(time, delta);
                    break;
                case "missile":
                    //game.particles.smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2); //, this.mesh.rotation);
                    this.cd(time, delta);
                    game.particles.smoke(
                        this.mesh.position.x - 0.5 + get_rand(),
                        this.mesh.position.y - 0.5 + get_rand(),
                        this.mesh.position.z - 0.5 + get_rand(),
                        0.3); //, this.mesh.rotation);
                    break;
                case "shell":
                    this.cd(time, delta);
                    break;
                case "grenade":
                    game.particles.smoke(
                        this.mesh.position.x - 0.5 + get_rand(),
                        this.mesh.position.y - 0.5 + get_rand(),
                        this.mesh.position.z - 0.5 + get_rand(),
                        0.3); //, this.mesh.rotation);
                    this.bounce();
                    this.cd(time, delta);
                    break;
                case "snow":
                    this.mesh.position.z += get_rand()*Math.cos(time/5);
                    this.mesh.position.x += get_rand()*Math.cos(time/5);
                    break;
                case "rain":
                    if(get_rand() > 0.5) {
                        this.splatterRain();
                    }
                    break;
            }

            // Add blocks to ground
            if ((this.type == "snow" || this.type == "virtual_debris" || this.type == "debris" || this.type == "world_debris") && this.stay == true) {
                if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
                    if ((this.type == "debris" && this.bounces == 0) || this.type == "world_debris") {
                        //if(this.size >= 1) {
                            game.world.addBlock(this.mesh.position.x, this.mesh.position.y + 1, this.mesh.position.z, this.r, this.g, this.b);
                        //}
                        this.active = 0;
                    }else if(this.type == "snow") {
                        game.world.addBlock(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.r, this.g, this.b);
                    }
                }
            } else if (this.type == "empty_shell" || this.type == "chunk_debris") {
                this.keepOnGround();
            }

            // rotate box particles to make them look more "alive".
            if (this.particle_type == 1) {
                this.mesh.rotation.set(this.vx, this.vy, this.vz);
            }
        } 

        if (!this.active) {
            switch (this.type) {
              //case "chunk_debris":
              //  break;
                case "empty_shell":
                    this.mesh.rotation.set(1.57, 0, Math.PI * get_rand());
                    //this.placeOnGround();
                    break;
                case "shell":
                    game.particles.smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.5);
                    break;
                case "grenade":
                    game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
                    game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
                    game.sounds.PlaySound("rocket_explode", this.mesh.position, 1000);
                    break;
                case "missile":
                    //game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
                    if(!this.hit) {
                        game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
                        game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
                    }
                    game.sounds.PlaySound("rocket_explode", this.mesh.position, 800);
                    break;
             //   case "minigun":
                    //game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
                    //game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
             //       break;
            }
            this.reset();
        }
    };

    Particle.prototype.bounce = function () {
        if (this.bounces > 0 && this.mesh.position.y <= game.maps.ground+1) {
            this.mesh.position.y += this.bounces;
            this.bounces--;
            this.vy *= this.e;
            this.spin++;
            return true;
        }
        return false;
    };

    Particle.prototype.keepOnGround = function () {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            this.active = 0;
            this.mesh.position.y = game.maps.ground;
        }
    };

    Particle.prototype.addRadiationToGround = function () {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z, this.r, this.g, this.b);
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x + 1, this.mesh.position.y-1, this.mesh.position.z + 1, this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z + 1,this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z + 1, this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z - 1, this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z - 1, this.r, this.g, this.b);
            }
            this.active = 0;
        }
    };

    Particle.prototype.addBloodToGround = function () {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z, 138, 7, 7);
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x + 1, this.mesh.position.y-1, this.mesh.position.z + 1, 128, 7, 7);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z + 1, 158, 7, 7);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z + 1, 158, 7, 7);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z - 1, 158, 20, 20);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z - 1, 128, 20, 20);
            }
            this.active = 0;
        }
    };

    Particle.prototype.splatterRain = function (time, delta) {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            game.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
            game.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
            this.active = 0;
        }
    };

    Particle.prototype.cd = function (time, delta) {
        var directionVector = new THREE.Vector3(this.vx, this.vy, this.vz);

        var o = 1;
        for(var idx = 0; idx < game.cdList.length; idx++) {
            if((game.cdList[idx].position.x - game.cdList[idx].owner.chunk.chunk_size_x*game.cdList[idx].owner.chunk.blockSize/2) <= this.mesh.position.x + o &&
               (game.cdList[idx].position.x + game.cdList[idx].owner.chunk.chunk_size_x*game.cdList[idx].owner.chunk.blockSize/2) >= this.mesh.position.x - o )
            {
                if((game.cdList[idx].position.z - game.cdList[idx].owner.chunk.chunk_size_z*game.cdList[idx].owner.chunk.blockSize/2) <= this.mesh.position.z + o &&
                   (game.cdList[idx].position.z + game.cdList[idx].owner.chunk.chunk_size_z*game.cdList[idx].owner.chunk.blockSize/2) >= this.mesh.position.z - o)
                {
                    if (game.cdList[idx].owner.base_type == "object") {
                        if(game.cdList[idx].owner.hit) {
                            if(game.cdList[idx].owner.hit(this.damage, directionVector, this.type, this.mesh.position)) {
                                this.active = 0;
                                this.hit = true;
                                return;
                            }
                        }
                    } else if (game.cdList[idx].owner.base_type == "player" || game.cdList[idx].owner.base_type == "enemy") {
                        if (game.cdList[idx].owner.chunk.mesh.id != this.owner) {
                            game.cdList[idx].owner.hit(this.damage, directionVector, this.type, this.mesh.position);
                            this.active = 0;
                            this.hit = true;
                            return;
                        }
                    }
                }
            }
        }
        if(game.world.checkExists(this.mesh.position.clone()).length > 0) {
            game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
            if(this.type == "missile") {
                game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
                game.sounds.PlaySound("rocket_explode", this.mesh.position, 800);
            }
            this.active = 0;
            return;
        }
    };
}
