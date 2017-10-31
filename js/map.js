//////////////////////////////////////////////////////////////////////
// Maps class - Loading of maps from images
//////////////////////////////////////////////////////////////////////
function Maps() {
    this.name = "";
    this.ground = 3;
    this.wall_height = 25;
    this.wall_thickness = 2;
    this.objects = [];
    this.wall_texture = 0;
    this.wall2_texture = 0;
    // Object => color in obj image
    this.objects["Agent"] = { r: 0xFF, g: 0x00, b: 0x00 };
    this.objects["Greenie"] = { r: 0xEE, g: 0x00, b: 0x00 };
    this.objects["Dudo"] = { r: 0xDD, g: 0x00, b: 0x00 };
    this.objects["Hearty"] = { r: 0xCC, g: 0x00, b: 0x00 };
    this.objects["AgentBlack"] = { r: 0xBB, g: 0x00, b: 0x00 };
    this.objects["Lamp1"] = { r: 0x00, g: 0xFF, b: 0x00 };
    this.objects["Portal"] = { r: 0x00, g: 0xEE, b: 0x00 };
    this.objects["RadiationSign"] = { r: 0x00, g: 0xDD, b: 0x00 };
    this.objects["UfoSign"] = { r: 0x00, g: 0xCC, b: 0x00 };
    this.objects["DeadHearty"] = { r: 0x00, g: 0xBB, b: 0x00 };
    this.objects["BarrelFire"] = { r: 0x00, g: 0xAA, b: 0x00 };
    this.objects["StreetLamp"] = { r: 0x00, g: 0x99, b: 0x00 };
    this.objects["Tree"] = { r: 0x00, g: 0x88, b: 0x00 };
    this.objects["PaperAgent"] = { r: 0x00, g: 0x77, b: 0x00 };
    this.objects["PaperPoliceCar"] = { r: 0x00, g: 0x66, b: 0x00 };
    this.objects["Barrel"] = { r: 0x00, g: 0x55, b: 0x00 };
    this.objects["Player"] = { r: 0x00, g: 0x00, b: 0xFF };
    this.objects["PainKillers"] = { r: 0x00, g: 0x00, b: 0xEE };

    this.walls = [];
    this.width = 0;
    this.height = 0;
    // Objects loaded 
    this.loaded = [];

    this.ambient_light = 0;

    Maps.prototype.reset = function() {
        for(var i = 0; i < this.loaded.length; i++) {
            if(this.loaded[i].chunk) {
                game.scene.remove(this.loaded[i].chunk.mesh);
            }
        }
        this.loaded = [];
        this.walls = [];
        game.scene.remove(this.ambient_light);
    };

    Maps.prototype.update = function (time, delta) {
        var t1 = 0;
        for (var i = 0; i < this.loaded.length; i++) {
            if(this.loaded[i].chunk && this.loaded[i].chunk.dirty) {
                this.loaded[i].chunk.build();
                t1 = Date.now();
                if((Date.now() - t1) > 3) {
                    break;
                }
            }
            t1 = Date.now();
            if (this.loaded[i].alive) {
                if(this.loaded[i].chunk) {
                    if (this.loaded[i].chunk.mesh.position.distanceTo(game.player.chunk.mesh.position) < game.visible_distance) {
                        this.loaded[i].update(time, delta);
                    }
                } else if(this.loaded[i].x) {
                    if (new THREE.Vector3(this.loaded[i].x, this.loaded[i].y, this.loaded[i].z).distanceTo(game.player.chunk.mesh.position) < game.visible_distance) {
                        this.loaded[i].update(time, delta);
                    }
                } else {
                    this.loaded[i].update(time, delta);
                }
            }
            if((Date.now() - t1) > 3) {
                break;
            }
        }
    };

    Maps.prototype.init = function (name, ground, objects) {
        this.name = name;
        var that = this;

        // Load ground
        loadImageFile(ground, function (data, width, height, map) {
            that.width = width;
            that.height = height;
            var walls = [];
            var floor = [];
            var wall_map = new Array(width);
            for (var x = 0; x < width; x++) {
                wall_map[x] = new Array(height);
            }

            for (var x = 0; x < map.length; x++) {
                for (var z = 0; z < map[x].length; z++) {
                    var p = map[x][z];
                    if (p.a == 0) { continue; }

                    // Black will dissapear in chunk algo.
                    if (p.r == 0 && p.g == 0 && p.b == 0) {
                        p.r = 1;
                        p.g = 1;
                        p.b = 1;
                    }
                    var wall_thickness = game.maps.wall_thickness;
                    var wall_height = game.maps.wall_height;

                    if(p.r == 0x22 && p.g == 0x22 && p.b == 0x22) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, x, that.wall2_texture);
                            walls.push({ x: x, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                            wall_map[x][z] = 1;
                        }
                    }

                    if (map[x + 1][z].a == 0) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, z, that.wall_texture);
                            for (var xx = 0; xx < wall_thickness; xx++) {
                                walls.push({ x: x + xx, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x + xx, y: y, z: z - 1, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x + xx, y: y, z: z + 1, r: pix.r, g: pix.g, b: pix.b });
                                wall_map[x + xx][z - 1] = 1;
                                wall_map[x + xx][z + 1] = 1;
                                wall_map[x + xx][z] = 1;
                            }
                        }
                    }
                    if (map[x - 1][z].a == 0) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, z, that.wall_texture);
                            for (var xx = 0; xx < wall_thickness; xx++) {
                                walls.push({ x: x - xx, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x - xx, y: y, z: z - 1, r: pix.r, g: pix.g, b: pix.b });
                                wall_map[x - xx][z - 1] = 1;
                                wall_map[x - xx][z] = 1;
                            }
                        }
                    }
                    if (map[x][z + 1].a == 0) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, x, that.wall_texture);
                            for (var zz = 0; zz < wall_thickness; zz++) {
                                walls.push({ x: x - 1, y: y, z: z + zz, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x, y: y, z: z + zz, r: pix.r, g: pix.g, b: pix.b });
                                wall_map[x - 1][z + zz] = 1;
                                wall_map[x][z + zz] = 1;
                            }
                        }
                    }
                    if (map[x][z - 1].a == 0) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, x, that.wall_texture);
                            for (var zz = 0; zz < wall_thickness; zz++) {
                                walls.push({ x: x - 1, y: y, z: z - zz, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x, y: y, z: z - zz, r: pix.r, g: pix.g, b: pix.b });
                                wall_map[x][z - zz] = 1;
                                wall_map[x - 1][z - zz] = 1;
                            }
                        }
                    }

                    // Draw floor
                    for (var y = 0; y < game.maps.ground; y++) {
                        floor.push({ x: x, y: y, z: z, r: p.r, g: p.g, b: p.b });
                    }
                }
            }

            // Find floor and create chunks for it.
            var total_chunks = 0;
            while (true) {
                var x = 0;
                var z = 0;
                var found = false;
                for (x = 0; x < width; x++) {
                    for (z = 0; z < height; z++) {
                        if (map[x][z].a != 0) {
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
                if (!found) {
                    break;
                }
                // We found a wall position.
                // Get how far on X the wall is.
                var max_x = 0;
                var max_z = 1000;
                var found = false;
                var max_width = 20;
                var max_height = 20;
                for (var x1 = 0; x + x1 < width && x1 < max_width; x1++) {
                    if (map[x + x1][z].a != 0) {
                        max_x++;
                        // Check Z
                        var mz = 0;
                        for (var z1 = 0; z + z1 < height && z1 < max_height; z1++) {
                            if (map[x + x1][z + z1].a != 0) {
                                mz++;
                            } else {
                                break;
                            }
                        }
                        if (mz < max_z) {
                            max_z = mz;
                        }
                    } else {
                        break;
                    }
                }
                for (var x_ = x; x_ < x + max_x; x_++) {
                    for (var z_ = z; z_ < z + max_z; z_++) {
                        map[x_][z_].a = 0;
                    }
                }

                // Now find all blocks within the range.
                var chunk = new Chunk(x, 0, z, max_x, game.maps.ground, max_z, "floor", 1, "world");
                chunk.init();
                for (var i = 0; i < floor.length; i++) {
                    if (floor[i].x >= x && floor[i].x < x + max_x &&
                        floor[i].z >= z && floor[i].z < z + max_z) {
                        chunk.addBlock(floor[i].x, floor[i].y, floor[i].z, floor[i].r, floor[i].g, floor[i].b);
                    }
                }

                //chunk.addBatch();
                game.world.addChunk(chunk);
            }


            // Find wall and create chunks for them.
            while (true) {
                var x = 0;
                var z = 0;
                var found = false;
                for (x = 0; x < width; x++) {
                    for (z = 0; z < height; z++) {
                        if (wall_map[x][z] == 1) {
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
                if (!found) {
                    break;
                }
                // We found a wall position.
                // Get how far on X the wall is.
                var max_x = 0;
                var max_z = 1000;
                var found = false;
                var max_width = 20;
                var max_height = 20;
                for (var x1 = 0; x + x1 < width && x1 < max_width; x1++) {
                    if (wall_map[x + x1][z] == 1) {
                        max_x++;
                        // Check Z
                        var mz = 0;
                        for (var z1 = 0; z + z1 < height && z1 < max_height; z1++) {
                            if (wall_map[x + x1][z + z1] == 1) {
                                mz++;
                            } else {
                                break;
                            }
                        }
                        if (mz < max_z) {
                            max_z = mz;
                        }
                    } else {
                        break;
                    }
                }
                for (var x_ = x; x_ < x + max_x; x_++) {
                    for (var z_ = z; z_ < z + max_z; z_++) {
                        wall_map[x_][z_] = 0;
                    }
                }

                // Now find all blocks within the range.
                // 0.01 = offset so we don't see black borders on the floor.
                var chunk = 0;
                if (max_x > max_z) {
                    chunk = new Chunk(x - wall_thickness, that.ground, z - wall_thickness, max_x + wall_thickness, wall_height, max_z + wall_thickness, "x", 1, "world");
                } else {
                    chunk = new Chunk(x - wall_thickness, that.ground, z, max_x + wall_thickness, wall_height, max_z + wall_thickness, "x", 1, "world");
                }
                chunk.init();
                for (var i = 0; i < walls.length; i++) {
                    if (walls[i].x >= x && walls[i].x <= x + max_x &&
                        walls[i].z >= z && walls[i].z <= z + max_z) {
                        chunk.addBlock(walls[i].x, walls[i].y + that.ground, walls[i].z, walls[i].r, walls[i].g, walls[i].b);
                    }
                }
                //chunk.addBatch();
                game.world.addChunk(chunk);
            }

            // Load objects + enemies + player
            loadImageFile(objects, function (data, width, height) {
                var list = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].a == 0) { continue; }
                    var found = 0;
                    for (var k in that.objects) {
                        if (data[i].r == that.objects[k].r && data[i].g == that.objects[k].g && data[i].b == that.objects[k].b) {
                            var o = new window[k]();
                            o.create(data[i].y, 0, data[i].x);
                            that.loaded.push(o);
                            if (k == "Player") {
                                game.player = o;
                            }
                            found = 0;
                        }
                        if (found) { break; }
                    }
                }
            });
        });

    };
};

function Map1() {
    Maps.call(this);
    this.wall_texture = WALL2; // from textures class.
    this.wall2_texture = WALL2; // from textures class.
    this.map_file = "assets/maps/map3_ground.png";
    this.obj_file = "assets/maps/map3_objects.png";
    
    
    Map1.prototype.init = function() {
        Maps.prototype.init.call(this, "Level1", this.map_file, this.obj_file);
        this.set_lightning();
        game.sounds.PlaySound("ambient_horror", null, 800, true);
    };

    Map1.prototype.set_lightning = function() {
        this.ambient_light = new THREE.AmbientLight( 0xFFFFFF, 0.9);
        game.scene.add( this.ambient_light );
    };
}
Map1.prototype = new Maps;
Map1.prototype.constructor = Map1;

function Level1() {
    Maps.call(this);
    this.wall_texture = WALL2; // from textures class.
    this.wall2_texture = WOOD_WALL; // from textures class.
    this.map_file = "assets/maps/map3_ground.png";
    this.obj_file = "assets/maps/map3_objects.png";
    
    Level1.prototype.update = function(time, delta) {
        Maps.prototype.update.call(this, time, delta);
        for(var i= 0; i < 2; i++) {
            game.particles.rain();
        }
    };

    Level1.prototype.reset = function() {
        Maps.prototype.reset.call(this);
        game.sounds.StopSound("ambient_horror");
    };
    
    Level1.prototype.init = function() {
        Maps.prototype.init.call(this, "Level1", this.map_file, this.obj_file);
        this.set_lightning();
        game.sounds.PlaySound("ambient_horror", null, 800, true);
    };

    Level1.prototype.set_lightning = function() {
        this.ambient_light = new THREE.AmbientLight( 0xFFFFFF, 0.8);
        game.scene.add( this.ambient_light );
    };
}
Level1.prototype = new Maps;
Level1.prototype.constructor = Level1;
