//////////////////////////////////////////////////////////////////////
// Char base class
//////////////////////////////////////////////////////////////////////
function Char() {
    this.hp = 0;
    this.chunk = 0;
    this.init_pos = new THREE.Vector3(0, 0, 0);
    this.weapon = 0;
    this.obj_type = "char";
    this.loaded = false;
    this.alive = true;
    this.y_offset = 0;
    this.cd_check = 0;
    this.moving = false;
    this.flee = false;
    this.add_blood = 0;
    this.add_radioactive = 0;
    this.speed = 0;
    this.bleed_timer = 0;
    this.can_shoot = false;
    this.cd_list = [];
    this.dying = false;
    this.radiation_poisoned = 0;
    this.dying_counter = 0;
    this.green_light = new THREE.PointLight(0x00FF00, 2, 10);
    this.radiation_light = 0;

    Char.prototype.sound_hit = function() {
        var r = get_rand();
        if(r < 0.4) {
            r = "blood1";
        } else if (r > 0.4 && r < 0.7) {
            r = "blood2";
        } else {
            r = "blood3";
        }
        game.sounds.PlaySound(r, this.chunk.mesh.position, 300);
        if(this.alive) {
            if(get_rand() > 0.8) {
                game.sounds.PlaySound("hit"+(1+Math.random()*2|0), 
                                      this.chunk.mesh.position,
                                      500);
            }
        }
    };

    Char.prototype.create = function (model, x, y, z, size) {
        if(!size) { size = 1; }
        // Load model.
        this.chunk = game.modelLoader.getModel(model, size, this);

        // Set initial position
        this.init_pos.x = x;
        this.init_pos.y = y;
        this.init_pos.z = z;
        this.chunk.mesh.position.set(x, y, z);
    };

    Char.prototype.addWeapon = function (weapon) {
        if (this.weapon == 0 && !this.flee) {
            if (weapon.attach(this.chunk.mesh)) {
                this.weapon = weapon;
                this.loadWeapon();
            }
        }
    };

    Char.prototype.dropWeapon = function () {
        if (this.weapon != 0) {
            this.unloadWeapon();
            this.weapon.detach(this.chunk.mesh, this.chunk.mesh.position);
            // Wait a while to not pick up same weapon again.
            var that = this;
            //setTimeout(function() {
            that.weapon = 0;
            //}, 500);
        }
    };

    Char.prototype.unloadWeapon = function () {
        var that = this;
        this.can_shoot = false;
        setTimeout(function () {
            that.loaded = false;
        }, 200);
    };

    Char.prototype.loadWeapon = function () {
        var that = this;
        this.can_shoot = true;
        setTimeout(function () {
            that.loaded = true;
        }, 200);
    };

    Char.prototype.shoot = function () {
        if (this.weapon != 0 && this.loaded && this.can_shoot) {
            //var light1 = new THREE.PointLight( 0xFFAA00, 3, 10 );
            //light1.position.set(
            //    this.weapon.position.x,
            //    this.weapon.position.y,
            //    this.weapon.position.z
            //);
            //game.scene.add( light1 );
            //setTimeout(function() { game.scene.remove(light1);}, 100);
            this.weapon.shoot(this.chunk.mesh.quaternion, this.chunk.mesh.id, this.chunk.mesh, this.speed / 30);
        }
    };

    Char.prototype.update = function (time, delta) {
        // open wound.
        if(this.dying != 0) {
            this.dying_counter++;
            var max = 5;
            var step = 0.05;
            if(this.dying == 1) {
                if(this.chunk.mesh.rotation.z < Math.PI/2) {
                    this.chunk.mesh.rotation.z += step;
                } else if(this.chunk.mesh.rotation.z > Math.PI/2) {
                    this.chunk.mesh.rotation.z -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.z = Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            } else if(this.dying == 2) {
                if(this.chunk.mesh.rotation.z < -Math.PI/2) {
                    this.chunk.mesh.rotation.z += step;
                } else if(this.chunk.mesh.rotation.z > -Math.PI/2) {
                    this.chunk.mesh.rotation.z -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.z = -Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            } else if(this.dying == 3) {
                if(this.chunk.mesh.rotation.x < -Math.PI/2) {
                    this.chunk.mesh.rotation.x += step;
                } else if(this.chunk.mesh.rotation.x > -Math.PI/2) {
                    this.chunk.mesh.rotation.x -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.x = -Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            } else if(this.dying == 4) {
                if(this.chunk.mesh.rotation.x < Math.PI/2) {
                    this.chunk.mesh.rotation.x += step;
                } else if(this.chunk.mesh.rotation.x > Math.PI/2) {
                    this.chunk.mesh.rotation.x -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.x = Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            }
        }

        if (this.alive) {
            if (this.chunk.blood_positions.length > 0) {
                this.bleed_timer -= delta;
            }

            if (this.bleed_timer < 0) {
                this.hit(4, new THREE.Vector3(0, -3, 0), null);
                this.bleed_timer = 10;
                return;
            }

            if(this.bleed_timer < 10 && this.bleed_timer != 0) {
                if(this.base_type == "player") {
                    if(!game.sounds.isPlaying("heartbeat")){
                        game.sounds.PlaySound("heartbeat", this.chunk.mesh.position, 500);
                    }
                }
                for (var i = 0; i < this.chunk.blood_positions.length; i++) {
                    if (get_rand() > 0.99) {
                        game.particles.blood(
                            this.chunk.blockSize*this.chunk.blood_positions[i].x + this.chunk.mesh.position.x,
                            this.chunk.blockSize*this.chunk.blood_positions[i].y + this.chunk.mesh.position.y,
                            this.chunk.blockSize*this.chunk.blood_positions[i].z + this.chunk.mesh.position.z,
                            0.5, 0, 0, 0
                        );
                    }
                }
            }
            if (this.add_blood > 0 && this.moving) {
                this.add_blood--;
                // Add blood footsteps
                game.world.addColorBlock(
                    this.chunk.mesh.position.x + (2 - get_rand() * 4),
                    game.maps.ground-1,
                    this.chunk.mesh.position.z + (2 - get_rand() * 4),
                    138 + get_rand() * 20,
                    8 + get_rand() * 10,
                    8 + get_rand() * 10
                );
            }
            if (this.add_radioactive > 0 && this.moving) {
                this.add_radioactive--;
                // Add radioactive footsteps
                game.world.addColorBlock(
                                    this.chunk.mesh.position.x + (2 - get_rand() * 4),
                                    game.maps.ground-1,
                                    this.chunk.mesh.position.z + (2 - get_rand() * 4),
                                    get_rand() * 50 | 0,
                                    200 + get_rand() * 55 | 0,
                                    50 + get_rand() * 55 | 0
                );
            }
            if(this.radiation_poisoned > 0 && get_rand() > 0.9) {
                for(var q = 0; q < this.radiation_poisoned; q++) {
                    game.particles.radiation(
                             this.chunk.mesh.position.x + (2 - get_rand() * 4),
                             this.chunk.to_y + 1,
                             this.chunk.mesh.position.z + (2 - get_rand() * 4)
                    );
                    if(this.radiation_poisoned > 5) {
                        this.chunk.hit(new THREE.Vector3(0,0,0), 1, null);
                    }
                }
            }
            if (!this.moving) {
                this.speed = 0;
            }
        }
    };

    // 4 directions based on chunk-size.
    // Move mesh -> check if any of directions are in a position.
    // If OK -> move mesh, otherwise move back mesh same amount.
    Char.prototype.cd = function() {
        var pos = this.chunk.mesh.position;
        var points = [];
        points[0] = new THREE.Vector3(
            pos.x+this.chunk.chunk_size_x/2,
            pos.y,
            pos.z
        );
        points[1] = new THREE.Vector3(
            pos.x,
            pos.y,
            pos.z+this.chunk.chunk_size_z/2
        );
        points[2] = new THREE.Vector3(
            pos.x,
            pos.y,
            pos.z-this.chunk.chunk_size_z/2
        );
        points[3] = new THREE.Vector3(
            pos.x-this.chunk.chunk_size_x/2,
            pos.y,
            pos.z
        );

        var res = true;
        for(var i = 0; i < points.length; i++) {
            if(game.world.checkExists(points[i]).length > 0) {
                res = false;
            }
        }
        for(var idx = 0; idx < game.cdList.length; idx++) {
            if(this.chunk.mesh.id != game.cdList[idx].id && game.cdList[idx].owner.alive && game.cdList[idx].owner.base_type != "weapon" && game.cdList[idx].owner.obj_type != "painkillers") {
                if(this.chunk.checkCD(game.cdList[idx].position, 6)) {
                    res = false;
                }
            }
        }
        return res;
    };

    Char.prototype.hit = function (damage, direction, type, pos) {
        this.bleed_timer = this.chunk.health / 100 * 10;

        var die = false;
        
        this.sound_hit();

        this.chunk.hit(direction, damage, pos);
        die = this.chunk.health < 90? true: false;
        if (die && this.alive) {
            this.dropWeapon();
           // this.alive = false; 
            if(this.base_type == "player") {
                this.chunk.mesh.remove(game.camera);
                var pos = this.chunk.mesh.position.clone();
                pos.y = game.maps.ground;
                game.scene.add(game.camera);
                game.camera.position.z = pos.z;
                game.camera.position.x = pos.x;
                game.camera.position.y = 150; //120; 150
                game.camera.rotation.x = -Math.PI/2;
                setTimeout(function() {
                    game.reset();
                }, 3000);
            }
            this.dying = 0;
            var r = get_rand();
            if(r > 0.8) {
                //this.chunk.mesh.rotation.z = Math.PI/2;
                this.dying = 1;
            } else if(r > 0.5) {
               // this.chunk.mesh.rotation.z = -Math.PI/2;
                this.dying = 2;
            } else if(r > 0.3) {
              //  this.chunk.mesh.rotation.x = -Math.PI/2;
                this.dying = 3;
            } else {
                //this.chunk.mesh.rotation.x = Math.PI/2;
                this.dying = 4;
            }
        }
        return die;
    };
}

//////////////////////////////////////////////////////////////////////
// Enemy base class
//
//////////////////////////////////////////////////////////////////////
function Enemy() {
    Char.call(this);
    this.base_type = "enemy";
    this.view_range = 50;
    this.view_range_current = 50;
    this.run_speed = 20;
    this.walk_speed = 10;
    this.view = 0;
    this.target = 0;
    this.flee = false; // run!
    this.range_from_player = 30;
    this.follow_timer = 0;
    this.shoot_ability = 0.5;

    Enemy.prototype.die = function () {
        this.chunk.mesh.position.y = game.maps.ground+1;
    };

    Enemy.prototype.hit = function (damage, dir, type, pos) {
        var die = Char.prototype.hit.call(this, damage, dir, type, pos);
        if (die == true & this.moving) {
            //   game.removeFromCD(this.view);
            this.moving = false;
            //game.objects["heart"].add(this.chunk.mesh.position.x, this.chunk.mesh.position.y, this.chunk.mesh.position.z);
            this.die();
        } else {
            if (this.chunk.health > 95) {
                if (this.weapon != 0) {
                    this.target = game.player;
                }
            } else {
                if(get_rand() > 0.5) {
                    this.target = 0;
                    this.flee = true;
                    this.moving = true;
                } else {
                    this.range_from_player = 10;
                }
            }
        }
        return die;
    };

    Enemy.prototype.create = function (model, x, y, z, size) {
        if(!size) { size = 1; }
        Char.prototype.create.call(this, model, x, y, z, size);

        this.run_speed = 20; //+get_rand()*50;
        this.moving = true;
       // setTimeout(function () { that.moving = true; }, 3000);
    };

    Enemy.prototype.update = function (time, delta) {
        Char.prototype.update.call(this, time, delta);
        if (!this.alive) { return; }
        this.speed = this.walk_speed;
        if (this.flee) {
            this.speed = this.run_speed;
            this.dropWeapon();
        }

        if (this.chunk.mesh.position.distanceTo(game.player.chunk.mesh.position) > game.visible_distance) {
            //this.chunk.mesh.visible = false;
            return;
        }
        if (this.target != 0) {
            if(this.follow_timer > 0) {
                this.follow_timer -= delta;
                if(this.follow_timer <= 0) {
                    this.target = 0;
                    this.follow_timer = 0;
                }
            }
            if (this.target.alive || this.target.base_type == "weapon") { //&& this.chunk.mesh.position.distanceTo(this.target.chunk.mesh.position) > 5) {
                // this.view.material.color.setRGB(1,0,0);
                // this.view.material.needsUpdate = true;
                var p = this.target.chunk.mesh.position.clone();
                p.y = this.chunk.mesh.position.y;
                this.chunk.mesh.lookAt(p);

                var dist = this.chunk.mesh.position.distanceTo(game.player.chunk.mesh.position);
                if (dist > this.range_from_player && this.weapon != 0) {
                    if(dist > game.visible_distance/2) {
                        this.target = 0;
                    } else {
                        this.moving = true;
                    }
                } else {
                    if (this.target.base_type == "player") {
                        this.moving = false;
                        this.shoot();
                    }
                }
            } else {
                this.target = 0;
                this.moving = true;
                this.unloadWeapon();
            }
        } else {
            this.unloadWeapon();
        }

        if (this.moving) {
            // Spare FPS by not checking CD every frame.
            if (this.cd_check > 0.1) { // 10 fps
                this.cd_check = 0;

                for(var idx = 0; idx < game.cdList.length; idx++) {
                    if(this.chunk.checkCD(game.cdList[idx].position, this.view_range_current)) {
                        if (this.chunk.mesh.id != game.cdList[idx].id) {
                            if (game.cdList[idx].owner.obj_type != this.obj_type && (game.cdList[idx].owner.base_type == "player")) { // TBD //|| game.cdList[idx].object.owner.base_type == "enemy")) {
                                if (this.target == 0 && this.weapon != 0) {
                                    if(game.cdList[idx].owner.alive) {
                                        this.target = game.cdList[idx].owner;
                                        this.follow_timer = get_rand()*10;
                                      //  game.sounds.PlaySound("hunt"+(1+Math.random()*2|0), 
                                      //                        this.chunk.mesh.position,
                                      //                        500);
                                        this.loadWeapon();
                                    }
                                }
                                if (this.target != 0 && this.target.base_type == "player") {
                                    this.loadWeapon();
                                    this.shoot();
                                }
                            } else if (game.cdList[idx].owner.base_type == "weapon") {
                                // walk to weapon
                                if ((this.weapon == 0 || this.weapon.damage < game.cdList[idx].owner.damage) && !this.flee) {
                                    this.target = game.cdList[idx].owner;
                                }
                            }
                        }
                    } 
                    if(this.chunk.checkCD(game.cdList[idx].position, 5)) {
                        if (game.cdList[idx].owner.base_type == "weapon") {
                            if (this.weapon == 0) {
                                this.addWeapon(game.cdList[idx].owner);
                                this.loadWeapon();
                                this.target = 0;
                            } else {
                                if(this.weapon.damage < game.cdList[idx].owner.damage) {
                                    this.dropWeapon();
                                    this.addWeapon(game.cdList[idx].owner);
                                    this.target = 0;
                                    this.loadWeapon();
                                }
                            }
                        }
                    }
                }
            }
            this.cd_check += delta;

            //if (res.length > 0) {
            this.chunk.mesh.rotation.y -= (1-get_rand()*2)*Math.sin(delta*3); 
            var pos = this.chunk.mesh.position.clone();
            pos.y = game.maps.ground;
            var res = game.world.checkExists(pos);
            if(res.length != 0) {
                this.chunk.mesh.translateZ(delta * this.speed);
                if(!this.cd()) {
                    this.chunk.mesh.translateZ(-delta * this.speed);
                    this.chunk.mesh.rotation.y -= Math.sin(time / this.speed);
                    this.target = 0;
                    //this.chunk.mesh.rotation.y -= Math.PI;
                }
            } else {
                this.chunk.mesh.translateZ(-delta * this.speed - 1);
                this.chunk.mesh.rotation.y -= Math.sin(time / this.speed);
                this.chunk.mesh.rotation.y -= Math.PI;
                this.target = 0;
            }
            
            this.chunk.mesh.rotation.z = 0.2 * Math.sin(time * this.speed);
            for (var i = 0; i < res.length; i++) {
                if (((res[i] >> 24) & 0xFF) > 100 &&
                    ((res[i] >> 16) & 0xFF) < 25 &&
                    ((res[i] >> 8) & 0xFF) < 25
                ) {
                    if(this.add_blood == 0 && get_rand() > 0.5) {
                        this.add_blood = 60; // Walking on blood
                    }
                } else if (((res[i] >> 24) & 0xFF) <= 50  &&
                    ((res[i] >> 16) & 0xFF) >= 200 &&
                    ((res[i] >> 8) & 0xFF) < 105 &&
                    ((res[i] >> 8) & 0xFF) >= 50)
                {
                    if(this.add_radioactive == 0 && get_rand() > 0.5) {
                        this.add_radioactive = 30; // walking on radioactive
                        if(this.radiation_poisoned == 0) {
                            this.radiation_light = this.green_light.clone();
                            this.radiation_light.intensity = 0.1;
                            this.radiation_light.position.y = 1;
                            this.chunk.mesh.add(this.radiation_light);
                        }
                        this.radiation_poisoned++;
                        this.radiation_light.intensity += 0.5;
                        this.radiation_light.distance += 2;
                        
                        // Add random radiation 
                        this.chunk.addBlock(Math.random()*this.chunk.chunk_size_x|0,
                                            Math.random()*this.chunk.chunk_size_y|0,
                                            Math.random()*this.chunk.chunk_size_z|0,
                                            (res[i][1] >> 24) & 0xFF, 
                                            (res[i][1] >> 16) & 0xFF,
                                            (res[i][1] >> 8) & 0xFF
                        );
                    }
                }
            }

            if (get_rand() < 0.4) {
                game.particles.walkSmoke(this.chunk.mesh.position.x, game.maps.ground+1, this.chunk.mesh.position.z);
            }
        }
    };

    Enemy.prototype.shoot = function () {
        if(get_rand() < this.shoot_ability) {
            Char.prototype.shoot.call(this);
        }
    };

}
Enemy.prototype = new Char;
Enemy.prototype.constructor = Enemy;

//////////////////////////////////////////////////////////////////////
// Enemy type: Dudo
//
//////////////////////////////////////////////////////////////////////
function Dudo(x, y, z) {
    Enemy.call(this);
    this.obj_type = "dudo";
    this.run_speed = 30;
    this.walk_speed = 15;
    this.y_offset = 5;

    Dudo.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.4) {
            this.addWeapon(new Shotgun());
            this.weapon.attach(this.chunk.mesh);
            this.unloadWeapon();
        }
    };

    Dudo.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, -1.5, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Dudo.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Dudo.prototype = new Enemy;
Dudo.prototype.constructor = Dudo;

//////////////////////////////////////////////////////////////////////
// Enemy type: AgentBlack
//
//////////////////////////////////////////////////////////////////////
function AgentBlack(x, y, z) {
    Enemy.call(this);
    this.y_offset = 7;
    this.run_speed = 40;
    this.walk_speed = 15;
    this.obj_type = "agentblack";
    this.shoot_ability = 0.5;
    // this.create(this.obj_type, x, game.maps.ground+5, z); // Add space from floor
    //
    AgentBlack.prototype.die = function() {
        this.chunk.mesh.position.y = game.maps.ground+1;
    };

    AgentBlack.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z, 0.5);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.8) {
            this.addWeapon(new Shotgun());
        } else if(get_rand() > 0.5) {
            this.addWeapon(new Sniper());
        } else {
            this.addWeapon(new Pistol());
        }
        this.weapon.attach(this.chunk.mesh);
        this.unloadWeapon();
    };

    AgentBlack.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, 0, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    AgentBlack.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 4, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
AgentBlack.prototype = new Enemy;
AgentBlack.prototype.constructor = AgentBlack;

//////////////////////////////////////////////////////////////////////
// Enemy type: Agent
//
//////////////////////////////////////////////////////////////////////
function Agent(x, y, z) {
    Enemy.call(this);
    this.y_offset = 7;
    this.run_speed = 40;
    this.walk_speed = 15;
    this.obj_type = "agent";
    this.shoot_ability = 0.5;
    // this.create(this.obj_type, x, game.maps.ground+5, z); // Add space from floor
    //
    Agent.prototype.die = function() {
        this.chunk.mesh.position.y = game.maps.ground+1;
    };

    Agent.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z, 0.5);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.8) {
            this.addWeapon(new Pistol());
        } else if(get_rand() > 0.5) {
            this.addWeapon(new Minigun());
        } else {
            this.addWeapon(new Shotgun());
        }
        this.weapon.attach(this.chunk.mesh);
        this.unloadWeapon();
    };

    Agent.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, 0, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Agent.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 4, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Agent.prototype = new Enemy;
Agent.prototype.constructor = Agent;

//////////////////////////////////////////////////////////////////////
// Enemy type: Greenie
//
//////////////////////////////////////////////////////////////////////
function Greenie(x, y, z) {
    Enemy.call(this);
    this.y_offset = 5;
    this.run_speed = 40;
    this.walk_speed = 15;
    this.obj_type = "greenie";
    // this.create(this.obj_type, x, game.maps.ground+5, z); // Add space from floor

    Greenie.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z, 1);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.4) {
            this.addWeapon(new P90());
            this.weapon.attach(this.chunk.mesh);
            this.unloadWeapon();
        } else {
            this.addWeapon(new Shotgun());
            this.weapon.attach(this.chunk.mesh);
            this.unloadWeapon();
        }
    };

    Greenie.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, -1.5, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Greenie.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Greenie.prototype = new Enemy;
Greenie.prototype.constructor = Greenie;

//////////////////////////////////////////////////////////////////////
// Enemy type: Hearty
//
//////////////////////////////////////////////////////////////////////
function Hearty(x, y, z) {
    Enemy.call(this);
    this.obj_type = "hearty";
    this.run_speed = 50;
    this.walk_speed = 15;
    this.y_offset = 6;
    //   this.create(this.obj_type, x, game.maps.ground+6, z); // Add space from floor

    Hearty.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.4) {
            this.addWeapon(new Sniper());
        } else {
            this.addWeapon(new RocketLauncher());
        }
        this.weapon.attach(this.chunk.mesh);
        this.unloadWeapon();
    };

    Hearty.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-2.5, -2.5, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Hearty.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Hearty.prototype = new Enemy;
Hearty.prototype.constructor = Hearty;

//////////////////////////////////////////////////////////////////////
// Player class
//////////////////////////////////////////////////////////////////////
function Player(x, y, z) {
    Char.call(this);
    this.obj_type = "player";
    this.base_type = "player";
    this.run_speed = 50;
    this.keyboard = 0;
    this.y_offset = 6;
    this.weapons = [];
    this.can_switch = true;
    this.falling = false;
    this.flashlight = new THREE.SpotLight(0xFFFFFF);
    this.footsteps = false;

    Player.prototype.reset = function() {
        this.removeBindings();
        this.weapons = [];
        game.scene.remove(this.flashlight);
        this.keyboard = null;
    };

    Player.prototype.create = function (x, y, z) {
        Char.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z);
        this.keyboard = new THREEx.KeyboardState();
        this.chunk.mesh.rotation.order = 'YXZ';
        game.player = this;
        var targetObject = new THREE.Object3D();
        targetObject.position.set(1, 1, 10);
        game.scene.add(targetObject);
        this.flashlight.target = targetObject;
        this.flashlight.decay = 1;
        this.flashlight.intensity = 2;
        this.flashlight.distance = 100;
        this.flashlight.angle = Math.PI/5;
        this.chunk.mesh.add(targetObject);
        this.chunk.mesh.add(this.flashlight);

        this.flashlight.position.set(0, 3, 0);
        //this.flashlight.target.position.set( 0, 0, 1 );
       // this.flashlight.target = this.chunk.mesh;
        //this.flashlight.castShadow = true;

        //this.flashlight.shadow.mapSize.width = 1024;
        //this.flashlight.shadow.mapSize.height = 1024;

        //this.flashlight.shadow.camera.near = 0;
        //this.flashlight.shadow.camera.far = 400;
        //this.flashlight.shadow.camera.fov = 80;

        this.addWeapon(new RocketLauncher());
        this.addWeapon(new Shotgun());

//        var t = new THREE.Mesh(new THREE.BoxGeometry(5,5,5),
//                               new THREE.MeshBasicMaterial({color: 0xFF0000}));
//        this.chunk.mesh.add(t);
//        t.position.set(0, 150, 0);


        this.addBindings();
       // game.camera.position.set(0,0,0);
       // game.camera.rotation.set(0,0,0);
        //game.camera.matrix.copy(this.chunk.mesh.matrix);
        this.chunk.mesh.add(game.camera);
        var pos = this.chunk.mesh.position.clone();
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
        game.camera.lookAt(point);
        game.camera.rotation.z = Math.PI;
        game.camera.rotation.x =-Math.PI/1.4;
        game.camera.position.y = 150;
        game.camera.position.z = -120;

    };

    Player.prototype.shiftWeapon = function () {
        if (this.weapons.length == 0) {
            return;
        }

        if(!this.can_switch) {
            return;
        }
        this.can_switch = false;
        var that = this;
        setTimeout(function () {
            that.can_switch = true;
        }, 200);

        // Check if a weapon is loaded, then unload it.
        var id = this.getWeaponId();
        if(id != -1) {
            this.unloadWeapon(id);
        } else {
            this.loadWeapon(0);
            return;
        }
        // Load next weapon, if any.
        if(this.weapons.length > 1) {
            if(id == this.weapons.length-1) {
                id = 0;
            } else {
                id++;
            }
            this.loadWeapon(id);
        }
    };

    Player.prototype.getWeaponId = function() {
        if(this.weapon == 0) {
            return -1;
        } 
        for(var i = 0; i < this.weapons.length; i++) {
            if(this.weapon.chunk.mesh.id == this.weapons[i].chunk.mesh.id) {
                return i;
            }
        }
        return -1;
    };

    Player.prototype.loadWeapon = function (id) {
        for(var i = 0; i < this.weapons.length; i++) {
            if(id != i) {
                this.unloadWeapon(i);
            }
        }
        this.weapon = this.weapons[id];
        this.weapon.setPosition(2.5, -0.5, 2.5);
        this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        this.can_shoot = true;
        this.loaded = true;
    };

    Player.prototype.unloadWeapon = function (id) {
        if (this.weapon != 0) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
            this.weapon = 0;
            this.can_shoot = false;
            this.loaded = false;
        }
    };

    Player.prototype.addWeapon = function (weapon) {
        if (this.weapons.length < 2) {
            if (weapon.attach(this.chunk.mesh)) {
                //this.weapon = weapon;
                this.weapons.push(weapon);
                this.loadWeapon(this.weapons.length-1);
            }
        }
    };

    Player.prototype.dropWeapon = function () {
        if (this.weapon != 0) {
            var wid = this.getWeaponId();
            this.unloadWeapon(wid);
            this.weapons[wid].detach(this.chunk.mesh, this.chunk.mesh.position);
            this.weapons.splice(wid, 1);
        }
    };

    Player.prototype.addBindings = function () {
        $(document).mouseup(this.mouseUp.bind(this));
        $(document).mousemove(this.mouseMove.bind(this));
        $(document).mousedown(this.mouseDown.bind(this));
    };

    Player.prototype.removeBindings = function () {
        $(document).unbind('mouseup');
        $(document).unbind('mousemove');
        $(document).unbind('mousedown');
    };


    Player.prototype.mouseUp = function () {
        if(!this.alive) {
            return;
        }
        this.shooting = false;
        if(this.weapon.obj_type == "sniper") {
            this.shoot();
            setTimeout(function() {
                game.camera.position.y = 150;
                game.camera.position.z = -120;
                game.camera.rotation.x = -Math.PI / 1.4;
            }, 1000);
        } else {
            game.camera.position.y = 150;
            game.camera.position.z = -120;
            game.camera.rotation.x = -Math.PI / 1.4;
        }
    };

    Player.prototype.mouseDown = function () {
        this.shooting = true;
    };

    Player.prototype.update = function (time, delta) {
        if(!this.alive) {
            game.sounds.StopSound("footsteps");
            game.sounds.StopSound("heartbeat");
            return;
        }
        this.speed = this.run_speed;
        Char.prototype.update.call(this, time, delta);
        if (this.shooting && this.weapon.obj_type != "sniper") {
            this.shoot();
        } else if(this.shooting && this.weapon.obj_type == "sniper") {
            if(game.camera.position.y > 10) {
                game.camera.position.y -= 10;
                game.camera.position.z += 10;
                game.camera.rotation.x += -0.01;
            } else {
                game.camera.rotation.x = -Math.PI;
                game.camera.position.z = -5;
                game.camera.position.x = 5;
                game.camera.position.y = 3;
            }
        }
        if(this.falling) {
            if(game.camera.position.y < game.maps.ground-5) {
                this.chunk.mesh.position.y -= 1;
                this.chunk.mesh.rotation.z -= Math.sin(time)/20;
                this.chunk.mesh.rotation.x -= Math.sin(time)/20;
                game.maps.ambient_light.color.r += 0.1;
                game.maps.ambient_light.color.g -= 0.01;
                game.maps.ambient_light.color.b -= 0.01;
            } else {
                if(game.maps.ambient_light.intensity < 0.8) {
                    game.maps.ambient_light.intensity += 0.1;
                }
                game.maps.ambient_light.color.r += 0.01;
                game.maps.ambient_light.color.g += 0.01;
                game.maps.ambient_light.color.b += 0.01;
                this.chunk.mesh.position.y -= 1;
                this.chunk.mesh.rotation.z -= Math.sin(time)/10;
                this.chunk.mesh.rotation.x -= Math.sin(time)/10;
                game.camera.position.y -= 1;
            }
            if(this.chunk.mesh.position.y < -250) {
                // RESPAWN?
                game.reset();
            }
            return;
        }
        this.KeyDown(time, delta);

        if (this.moving) {
            if(!game.sounds.isPlaying("footsteps")) {
                game.sounds.PlaySound("footsteps", this.chunk.mesh.position, 800);
            }
            //this.chunk.mesh.rotation.z = 0.2*Math.sin(time*speed);
            if (this.cd_check > 0.05) {
                this.cd_check = 0;
                var pos = this.chunk.mesh.position.clone();
                pos.y = game.maps.ground;
                var res = game.world.checkExists(pos);
                for (var i = 0; i < res.length; i++) {
                    if (((res[i] >> 24) & 0xFF) > 100 &&
                        ((res[i] >> 16) & 0xFF) < 25 &&
                        ((res[i] >> 8) & 0xFF) < 25
                    ) {
                        if(this.add_blood == 0 && get_rand() > 0.5) {
                            this.add_blood = 40;
                        }
                    } else if (((res[i] >> 24) & 0xFF) <= 50  &&
                               ((res[i] >> 16) & 0xFF) >= 200 &&
                               ((res[i] >> 8) & 0xFF) < 105 &&
                               ((res[i] >> 8) & 0xFF) >= 50)
                    {
                        if(this.add_radioactive == 0 && get_rand() > 0.5) {
                            this.add_radioactive = 30; // walking on radioactive
                            if(this.radiation_poisoned == 0) {
                                this.radiation_light = this.green_light.clone();
                                this.radiation_light.intensity = 0.1;
                                this.radiation_light.position.y = 1;
                                this.chunk.mesh.add(this.radiation_light);
                            }
                            this.radiation_poisoned++;
                            this.radiation_light.intensity += 0.5;
                            this.radiation_light.distance += 2;

                            this.chunk.addBlock(Math.random()*this.chunk.chunk_size_x|0,
                                                Math.random()*this.chunk.chunk_size_y|0,
                                                Math.random()*this.chunk.chunk_size_z|0,
                                                (res[i][1] >> 24) & 0xFF, 
                                                (res[i][1] >> 16) & 0xFF,
                                                (res[i][1] >> 8) & 0xFF
                            );
                        }
                    }
                }
                if(res.length == 0) {
                    this.falling = true;
                    // Only fall if hole is big enough to fit in :)
                    for(var ofx = -1; ofx <= 1; ofx++) {
                        for(var ofz = -1; ofz <= 1; ofz++) { 
                            for(var ofy = game.maps.ground; ofy >= 0; ofy--) {
                                var post = this.chunk.mesh.position.clone();
                                post.x += ofx;
                                post.y = ofy;
                                post.z += ofz;
                                var r = game.world.checkExists(post);
                                if(r.length != 0) {
                                    this.falling = false;
                                    break;
                                }
                            }
                            if(!this.falling) {
                                break;
                            }
                        }
                        if(!this.falling) {
                            break;
                        }
                    }
                    
                    if(this.falling) {
                        game.sounds.StopSound("footsteps");

                        if(get_rand() > 0.5) {
                            game.sounds.PlaySound("fall", this.chunk.mesh.position, 400);
                        } else {
                            game.sounds.PlaySound("fall2", this.chunk.mesh.position, 400);
                        }
                        game.maps.ambient_light.color.r = 0;
                        game.maps.ambient_light.color.g = 0;
                        game.maps.ambient_light.color.b = 0;
                        // Fall down!
                        this.chunk.mesh.remove(game.camera);
                        game.scene.add(game.camera);
                        //game.camera.lookAt(this.chunk.mesh);
                        game.camera.position.z = pos.z;
                        game.camera.position.x = pos.x;
                        game.camera.position.y = 150; //120; 150
                        game.camera.rotation.x = -Math.PI/2;
                    }

                }

                for(var idx = 0; idx < game.cdList.length; idx++) {
                    if(this.chunk.checkCD(game.cdList[idx].position, 5)) {
                        if (game.cdList[idx].owner.obj_type == "heart" || game.cdList[idx].owner.obj_type == "painkillers") {
                            game.cdList[idx].owner.grab(game.cdList[idx].id);
                        } else if (game.cdList[idx].owner.base_type == "weapon") {
                            if (this.weapons.length <= 2) {
                                this.addWeapon(game.cdList[idx].owner);
                            }
                        }
                    }
                }
            }
            this.cd_check += delta;
            if (get_rand() < 0.4) {
                game.particles.walkSmoke(this.chunk.mesh.position.x, this.chunk.mesh.position.y, this.chunk.mesh.position.z);
            }
            //            this.chunk.mesh.rotation.z = 0.2 * Math.sin(time * this.speed);
        }
    };

    Player.prototype.mouseMove = function (jevent) {
        if(this.alive) {
            var event = jevent.originalEvent; // jquery convert
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX ||0;
            var x = movementX*0.001;

            var axis = new THREE.Vector3(0,1,0);
            var radians = -(Math.PI/2)*x;
            var rotObjectMatrix = new THREE.Matrix4();
            rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
            this.chunk.mesh.matrix.multiply(rotObjectMatrix);
            this.chunk.mesh.rotation.setFromRotationMatrix(this.chunk.mesh.matrix);
        }
    };


    Player.prototype.KeyDown = function (time, delta) {
        this.moving = false;

        if (this.keyboard.pressed("space")) {
            this.shoot();
        }
        if (this.keyboard.pressed("w")) {
            this.chunk.mesh.translateZ(this.speed * delta);
            if(this.cd()) {
                this.moving = true;
            } else {
                this.chunk.mesh.translateZ(-this.speed * delta);
            }
        }
        if (this.keyboard.pressed("S")) {
            this.chunk.mesh.translateZ(-this.speed * delta);
            if(this.cd()) {
                this.moving = true;
            } else{
                this.chunk.mesh.translateZ(+this.speed * delta);
            }
        }
        if (this.keyboard.pressed("A")) {
            this.chunk.mesh.rotation.y += (this.speed * delta / 7);
            this.moving = true;
        }
        if (this.keyboard.pressed("D")) {
            this.chunk.mesh.rotation.y -= (this.speed * delta / 7);
            this.moving = true;
        }
        if (this.keyboard.pressed("R")) {
            this.flashlight.visible = false;
            for(var i = 0; i < game.maps.loaded.length; i++) {
                if(game.maps.loaded[i].base_type == "enemy") {
                    game.maps.loaded[i].current_view_range = game.maps.loaded[i].view_range;
                }
            }
        }
        if (this.keyboard.pressed("T")) {
            this.flashlight.visible = true;
            for(var i = 0; i < game.maps.loaded.length; i++) {
                if(game.maps.loaded[i].base_type == "enemy") {
                    game.maps.loaded[i].current_view_range = game.maps.loaded[i].view_range * 2;
                }
            }
        }
        if (this.keyboard.pressed("E")) {
            this.dropWeapon();
        }
        if (this.keyboard.pressed("F")) {
            this.shiftWeapon();
        }


     //   if(this.moving && !this.footsteps) {
     //       game.sounds.PlaySound("footsteps", this.chunk.mesh.position, 300);
     //       this.footsteps = true;
     //   }
     //   if(!this.moving && this.footsteps) {
     //       game.sounds.StopSound("footsteps");
     //       this.footsteps = false;
     //   }

    };
}
Player.prototype = new Char;
Player.prototype.constructor = Player;

