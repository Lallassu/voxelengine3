//////////////////////////////////////////////////////////////////////
// World class - Helper for world chunks
//////////////////////////////////////////////////////////////////////
function World() {
    // Generic chunk
    this.obj_size_x = 16;
    this.obj_size_z = 16;
    this.obj_size_y = 2;
    this.chunks = [];
    this.cid = 0;
    this.textures = 0;
    this.debug_update = 0;
    this.rebuild_idx = 0;
    this.radioactive_blocks = [];
    this.rpc = 0;
    this.rpc_max = 0;
    this.obj_type = "world";
    this.base_type = "world";

    World.prototype.reset = function() {
        for(var i = 0; i < this.chunks.length; i++) {
            if(this.chunks[i].mesh) {
                game.scene.remove(this.chunks[i].mesh);
            }
        }
        this.radioactive_blocks = [];
        this.chunks = [];
        this.cid = 0;
        this.rebuild_idx = 0;
        this.rpc = 0;
        this.rpc_max = 0;
    };

    World.prototype.init = function() {
        this.textures = new Textures();
        this.textures.prepare();
    };

    World.prototype.getChunkId = function(x, y, z, create) {
        x |= 0;
        y |= 0;
        z |= 0;

        var finds = [];
        var c = 0;
        for (var i = 0; i < this.chunks.length; i++) {
            // Split for perf.
            if (x >= this.chunks[i].from_x && x <= this.chunks[i].to_x) {
                if(z >= this.chunks[i].from_z && z <= this.chunks[i].to_z) {
                    if(y >= this.chunks[i].from_y && y <= this.chunks[i].to_y ) {
                        finds[c++] = i;
                    }
                }
            }
        }
        if(finds.length > 0) {
            return finds;
        }
       if (create) {
           // Create chunk based on world division by obj_size_x.
           var pos_x = (x/this.obj_size_x)|0;
           var pos_y = (y/this.obj_size_y)|0;
           var pos_z = (z/this.obj_size_z)|0;

           var chunk = new Chunk(
               pos_x * this.obj_size_x,
               pos_y * this.obj_size_y,
               pos_z * this.obj_size_z,
               this.obj_size_x, this.obj_size_y, this.obj_size_z,
               "CREATED", 1, "world");
           chunk.init();
           var i = this.addChunk(chunk);
           return [i];
       }
        return [];
    };

    World.prototype.hit = function(dmg, dir, type, pos) {
        this.explode(pos.x, pos.y, pos.z, dmg, type);
    };

    World.prototype.addChunk = function(chunk) {
        this.chunks[this.cid] = chunk;
        this.chunks[this.cid].owner = this;
        this.cid++;
        return this.cid-1;
    };

    World.prototype.explode = function(x, y, z, power, type) {
        x |= 0;
        y |= 0;
        z |= 0;
        var pow = power*power;

        var list = [];
        var vx = 0, vy = 0, vz = 0, val = 0, offset = 0;
        for(var rx = x-power; rx <= x+power; rx++) {
            vx = Math.pow((rx-x), 2); 
                for(var rz = z-power; rz <= z+power; rz++) {
                    vz = Math.pow((rz-z),2)+vx; 
                        for(var ry = y-power; ry <= y+power; ry++) {
                            if(ry < 0) {
                                continue;
                            }
                            val = Math.pow((ry-y),2)+vz;
                            if(val <= pow) {
                                list.push({x: rx, y: ry, z: rz});
                            }
                        }
                }
        }
        // Check if any object is in the way.
        if(type == "missile" || type == "grenade") {
            var pos = 0;
            var pxp = x+power*2;
            var pxm = x-power*2;
            var pzp = z+power*2;
            var pzm = z-power*2;
            for(var i = 0; i < game.cdList.length; i++) {
                if(game.cdList[i].owner) {
                    pos = game.cdList[i].owner.chunk.mesh.position;
                    if(game.cdList[i].owner.chunk.hit) {
                        if(pos.x >= pxm && pos.x <= pxp && 
                           pos.z >= pzm && pos.z <= pzp) {
                            if(this.isFunction(game.cdList[i].owner.hit)) {
                                game.cdList[i].owner.hit(power, new THREE.Vector3(0,0,0), "missile", new THREE.Vector3(x,y,z));
                            }
                        }
                    }
                }
            }
        } else {
            game.sounds.PlaySound("bullet_wall", new THREE.Vector3(x,y,z), 500);
        }
        this.removeBatch(list);
    };

    World.prototype.isFunction = function(object) {
        return !!(object && object.constructor && object.call && object.apply);
    };

    World.prototype.getColor = function(pos) {
        pos.x |= 0;
        pos.y |= 0;
        pos.z |= 0;
        var c = this.getChunkId(pos.x, pos.y, pos.z, false);
        if(c == -1) {
            return  -1;
        } 
        // Return first color?
        return this.chunks[c[0]].getColor(pos.x, pos.y, pos.z);
    };

    World.prototype.checkExists = function(pos) {
        pos.x |= 0;
        pos.y |= 0;
        pos.z |= 0;
       // console.log("CHECK:",pos);
        var c = this.getChunkId(pos.x, pos.y, pos.z, false);
       // console.log("ID: ",c);
        if(c.length == 0) {
            return [];
        }
        
        var list = [];
        for(var i = 0; i < c.length; i++) {
            var r = this.chunks[c[i]].checkExists(pos.x, pos.y, pos.z);
            if(r != -1) {
                list.push(r);
            }
        }
        return list;
    };

    World.prototype.removeBatch = function(points) {
        for(var i = 0; i < points.length; i++) {
            var c = this.getChunkId(points[i].x, points[i].y, points[i].z, false);
            if(c.length == 0) { 
                continue; 
            }
            for (var n = 0; n < c.length; n++) {
                this.chunks[c[n]].rmBlock(points[i].x, points[i].y, points[i].z);
            }
        }
        //for(var i in list) {
        //    this.chunks[i].removeBatch();
        //}
    };

    World.prototype.addBatch = function(points) {
        for(var i = 0; i < points.length; i++) {
            var c = this.getChunkId(points[i].x, points[i].y, points[i].z, true);
            if(c.length == 0) {
                return;
            }
            for(var n = 0; n < c.length; n++) {
                this.chunks[c[n]].addBlock(points[i].x,points[i].y, points[i].z, points[i].r,points[i].g, points[i].b);
            }
        }
    };

    World.prototype.addColorBlock = function(x, y, z, r, g, b) {
        x |= 0;
        y |= 0;
        z |= 0;
        var c = this.getChunkId(x,y,z, true);
        if(c.length != 0) {
            for (var i = 0; i < c.length; i++) {
                // Do not add blood to non-existing blocks.
                if(this.chunks[c[i]].blockExists(x, y, z)) {
                    this.chunks[c[i]].addBlock(x, y, z, r, g, b);
                    if(r <= 50  && g >= 200 && b < 105 && b >= 50) {
                        for(var p = 0; p < this.radioactive_blocks.length; p++) {
                            if(this.radioactive_blocks[p].x == x &&
                               this.radioactive_blocks[p].y == y &&
                               this.radioactive_blocks[p].z == z)
                            {
                                return;
                            }
                        }
                        this.radioactive_blocks[this.rpc_max++] = [x,y,z];
                    } else {
                        for(var p = 0; p < this.radioactive_blocks.length; p++) {
                            if(this.radioactive_blocks[p].x == x &&
                               this.radioactive_blocks[p].y == y &&
                               this.radioactive_blocks[p].z == z) {
                                this.radioactive_blocks[p] = 0;
                                break;
                            }
                        }
                    }
                }
            }
        }
    };

    World.prototype.addBlock = function(x, y, z, r, g, b) {
        x |= 0;
        y |= 0;
        z |= 0;
        var c = this.getChunkId(x,y,z, true);
        if(c.length != 0) {
            for (var i = 0; i < c.length; i++) {
                this.chunks[c[i]].addBlock(x, y, z, r, g, b);
            }
        }
    };

    World.prototype.removeBlock = function(x, y, z) {
        var c = this.getChunkId(x,y,z, false); 
        if(c.length != 0) {
            for(var i = 0; i < c.length; i++) {
                this.chunks[c[i]].rmBlock(x, y, z);
            }
        }
    };

   // World.prototype.rebuildBatches = function() {
   //     for(var i = 0; i < this.chunks.length; i++) {
   //         this.chunks[i].build();
   //     }
   // };

    World.prototype.update = function(time, delta) {
        if(!game.player.chunk) {
            return;
        }

        for(var i = 0; i < this.chunks.length; i++) {
           if(this.chunks[i].dirty) {
               var t1 = Date.now();
               this.chunks[i].build();
               if((Date.now() - t1) > 5) {
                   break;
               }
            }
        }

        if(this.radioactive_blocks.length > 0) {
            var v = 0;
            for(var i = 0; i < 10; i++) {
                v = Math.random()*this.radioactive_blocks.length|0;
                if(this.radioactive_blocks[v] != 0) {
                    if(this.checkExists(new THREE.Vector3(this.radioactive_blocks[v][0],
                                 this.radioactive_blocks[v][1], 
                                 this.radioactive_blocks[v][2])).length == 0)
                    {
                        this.radioactive_blocks[v] = 0;
                    } else {
                        game.particles.radiation
                        (
                         this.radioactive_blocks[v][0]+(1-get_rand()*2),
                         this.radioactive_blocks[v][1]+(1-get_rand()*2),
                         this.radioactive_blocks[v][2]+(1-get_rand()*2)
                        );
                    }
                }
            }
        }


     //   this.debug_update += delta;
       // if(this.debug_update > 2) {
       //     this.debug_update = 0;
       //     var tris = 0;
       //     var blocks = 0;
       //     var skips = 0;
       //     var visible = 0;
       //     var all_blocks = 0;
       //     for(var i = 0; i < this.chunks.length; i++) {
       //         if(this.chunks[i].mesh) {
       //             if(this.chunks[i].mesh.visible) {
       //                 visible++;
       //             }
       //         }
       //         tris += this.chunks[i].triangles;
       //         blocks += this.chunks[i].total_blocks;
       //         all_blocks += this.chunks[i].chunk_size_x * this.chunks[i].chunk_size_y * this.chunks[i].chunk_size_z;
       //         skips += this.chunks[i].skips;
       //         //this.chunks[i].applyShadow();
       //     }
       //     $('#blocks').html("Blocks:"+blocks+ " (Chunks: "+this.chunks.length+") (Visible: "+visible+") (ALL: "+all_blocks+")");
       //     $('#triangles').html("Triangles:"+tris);
       //     $('#skipped').html("Triangles skipped:"+skips);
       //     //$('#particles').html("Particles Total: "+(game.particles.size+game.particles_box.size)+ "  Free: "+(game.particles.free.length+game.particles_box.free.length) + " Active: "+(game.particles.active.length+game.particles_box.active.length)+ " Queue: "+(game.particles.queue.length+game.particles_box.queue.length));
       //     var active1 = 0;
       //     for(var i = 0; i < game.particles_box.particles.length; i++) {
       //         if(game.particles_box.particles[i].active == 1) {
       //             active1++;
       //         }
       //     }
       //     var free = game.particles_box.size - active1;
       //     var free_boxes = free;
       //     var active2 = 0;
       //     for(var i = 0; i < game.particles.particles.length; i++) {
       //         if(game.particles.particles[i].active == 1) {
       //             active2++;
       //         }
       //     }
       //     free += game.particles.size - active2;
       //     $('#particles').html("Particles Total: "+(game.particles.size+game.particles_box.size)+ "  Free: "+(free) + " Active: " + (active2+active1) + " Free Block: "+free_boxes);
       // }
    };

}
