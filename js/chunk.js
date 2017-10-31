//////////////////////////////////////////////////////////////////////
// Chunk class
//////////////////////////////////////////////////////////////////////
function Chunk(x, y, z, cx, cy, cz, id, bs, type) {
    this.type = type;
    this.id = id;
    this.from_x = x;
    this.from_y = y;
    this.from_z = z;
    this.to_x = x+bs*cx;
    this.to_y = y+bs*cy;
    this.to_z = z+bs*cz;
    this.chunk_size_x = cx;
    this.chunk_size_y = cy;
    this.chunk_size_z = cz;
    this.blockSize = bs;
    this.owner = "";
    this.mesh = undefined;
   // this.bb = undefined; // boundingbox
    //this.batch_points = [];
    //this.bp = 0; // batch_points pointer
    this.blocks = 0;
    this.wireframe = false;
    this.triangles = 0;
    //this.shadow_blocks = [];
    this.total_blocks = 0;
    this.skips = 0;
    this.starting_blocks = 0;
    this.current_blocks = 0;
    this.blood_positions = [];
    this.health = 100;
    this.dirty = true;
    this.positions = 0;
    this.colors = 0;
    this.geometry = 0;
    this.v = 0;
    this.c = 0;
    this.prev_len = 0;
    this.offset = 0;
//    console.log("X:",this.from_x, this.to_x, "Z:", this.from_z, this.to_z, "Y: ", this.from_y, this.to_y );

    Chunk.prototype.destroy = function () {
        game.scene.remove(this.mesh);
    //    game.scene.remove(this.bb);
    //    game.removeFromCD(this.bb);
        //        this.mesh.geometry.dispose();
        //        this.mesh.material.dispose();
        //        this.bb.geometry.dispose();
        //        this.bb.material.dispose();
        this.blocks = null;
    };

    Chunk.prototype.SameColor = function (block1, block2) {
        if (((block1 >> 8) & 0xFFFFFF) == ((block2 >> 8) & 0xFFFFFF) && block1 != 0 && block2 != 0) {
            return true;
        }
        return false;
    };

    Chunk.prototype.init = function () {
        this.material = game.chunk_material;
        //this.material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, wireframe: this.wireframe});
        //        this.material = new THREE.MeshPhongMaterial({bumpMap: bump, vertexColors: THREE.VertexColors, wireframe: this.wireframe});
        this.blocks = new Array(this.chunk_size_x);
        for (var x = 0; x < this.chunk_size_x; x++) {
            this.blocks[x] = new Array(this.chunk_size_y);
            for (var y = 0; y < this.chunk_size_y; y++) {
                this.blocks[x][y] = new Array(this.chunk_size_z);
                for (var z = 0; z < this.chunk_size_z; z++) {
                    this.blocks[x][y][z] = 0;
                }
            }
        }
    };

    Chunk.prototype.build = function () {
        var vertices = [];
        var colors = [];
        var cc = 0; // Color counter
        var r = 0;
        var g = 0;
        var b = 0;

        // Block structure
        // BLOCK: [R-color][G-color][B-color][0][00][back_left_right_above_front]
        //           8bit    8bit     8it   2bit(floodfill)     6bit(faces)

        // Reset faces
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    this.blocks[x][y][z] &= 0xFFFFFFC0;
                }
            }
        }

        // this.shadow_blocks = [];
        this.total_blocks = 0;

        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if (this.blocks[x][y][z] == 0) {
                        continue; // Skip empty blocks
                    }
                    this.total_blocks++;
                    // Check if hidden
                    var left = 0, right = 0, above = 0, front = 0, back = 0, below = 0;
                    if (z > 0) {
                        if (this.blocks[x][y][z - 1] != 0) {
                            back = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x10;
                        }
                    } else {
                        if (this.type == "world") {
                            // Check hit towards other chunks.
                            if (game.world.checkExists(
                                new THREE.Vector3(
                                    (x + this.from_x * this.chunk_size_x) | 0,
                                    (y + this.from_y * this.chunk_size_y) | 0,
                                    ((z - 1) + this.from_z * this.chunk_size_z) | 0
                                )).length != 0) {
                                back = 1;
                                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x10;
                            }
                        }
                    }
                    if (x > 0) {
                        if (this.blocks[x - 1][y][z] != 0) {
                            left = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x8;
                        }
                    } else {
                        if (this.type == "world") {
                            // Check hit towards other chunks.
                            if (game.world.checkExists(
                                new THREE.Vector3(
                                    ((x - 1) + this.from_x * this.chunk_size_x) | 0,
                                    (y + this.from_y * this.chunk_size_y) | 0,
                                    (z + this.from_z * this.chunk_size_z) | 0
                                )).length != 0) {
                                left = 1;
                                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x8;
                            }
                        }
                    }
                    if (x < this.chunk_size_x - 1) {
                        if (this.blocks[x + 1][y][z] != 0) {
                            right = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x4;
                        }
                    } else {
                        if (this.type == "world") {
                            if (game.world.checkExists(
                                new THREE.Vector3(
                                    (x + 1 + this.from_x * this.chunk_size_x) | 0,
                                    (y + this.from_y * this.chunk_size_y) | 0,
                                    (z + this.from_z * this.chunk_size_z) | 0
                                )).length != 0) {
                                right = 1;
                                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x4;
                            }
                        }
                    }
                    // Only check / draw bottom if we are a object!
                    if (this.type != "world") {
                        if (y > 0) {
                            if (this.blocks[x][y - 1][z] != 0) {
                                below = 1;
                                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x20; // bit 6 
                            }
                        }
                    }

                    if (y < this.chunk_size_y - 1) {
                        if (this.blocks[x][y + 1][z] != 0) {
                            above = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x2;
                        }
                    } else {
                        if (this.type == "world") {
                            // Check hit towards other chunks.
                            if (game.world.checkExists(
                                new THREE.Vector3(
                                    (x + this.from_x * this.chunk_size_x) | 0,
                                    ((y + 1) + this.from_y * this.chunk_size_y) | 0,
                                    (z + this.from_z * this.chunk_size_z) | 0
                                )).length != 0) {
                                above = 1;
                                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x2;
                            }
                        }
                    }
                    if (z < this.chunk_size_z - 1) {
                        if (this.blocks[x][y][z + 1] != 0) {
                            front = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x1;
                        }
                    } else {
                        if (this.type == "world") {
                            // Check hit towards other chunks.
                            if (game.world.checkExists(
                                new THREE.Vector3(
                                    (x + this.from_x * this.chunk_size_x) | 0,
                                    (y + this.from_y * this.chunk_size_y) | 0,
                                    ((z - 1) + this.from_z * this.chunk_size_z) | 0
                                )).length != 0) {
                                front = 1;
                                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x1;
                            }
                        }
                    }

                    if (this.type == "world") {
                        if (front == 1 && left == 1 && right == 1 && above == 1 && back == 1) {
                            continue; // block is hidden (world)
                        }
                    } else {
                        if (front == 1 && left == 1 && right == 1 && above == 1 && back == 1 && below == 1) {
                            continue; // block is hidden (object)
                        }
                    }

                    // Draw blocks

                    // Only draw below if we are an object
                    if (this.type != "world") {
                        if (!below) {
                            // Get below (bit 6)
                            if ((this.blocks[x][y][z] & 0x20) == 0) {
                                var maxX = 0;
                                var maxZ = 0;
                                var end = 0;

                                for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                                    // Check not drawn + same color
                                    if ((this.blocks[x_][y][z] & 0x20) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                        maxX++;
                                    } else {
                                        break;
                                    }
                                    var tmpZ = 0;
                                    for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                                        if ((this.blocks[x_][y][z_] & 0x20) == 0 && this.SameColor(this.blocks[x_][y][z_], this.blocks[x][y][z])) {
                                            tmpZ++;
                                        } else {
                                            break;
                                        }
                                    }
                                    if (tmpZ < maxZ || maxZ == 0) {
                                        maxZ = tmpZ;
                                    }
                                }
                                for (var x_ = x; x_ < x + maxX; x_++) {
                                    for (var z_ = z; z_ < z + maxZ; z_++) {
                                        this.blocks[x_][y][z_] = this.blocks[x_][y][z_] | 0x20;
                                    }
                                }
                                maxX--;
                                maxZ--;

                                vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                                vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                                vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);

                                vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                                vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                                vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);

                                r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
                                g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
                                b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
                                colors[cc++] = [r,g,b];
                                colors[cc++] = [r,g,b];
                                colors[cc++] = [r,g,b];
                                colors[cc++] = [r,g,b];
                                colors[cc++] = [r,g,b];
                                colors[cc++] = [r,g,b];
                            }
                        }
                    }

                    if (!above) {
                        // Get above (0010)
                        if ((this.blocks[x][y][z] & 0x2) == 0) {
                            var maxX = 0;
                            var maxZ = 0;
                            var end = 0;

                            for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x2) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                var tmpZ = 0;
                                for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                                    if ((this.blocks[x_][y][z_] & 0x2) == 0 && this.SameColor(this.blocks[x_][y][z_], this.blocks[x][y][z])) {
                                        tmpZ++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpZ < maxZ || maxZ == 0) {
                                    maxZ = tmpZ;
                                }
                            }
                            for (var x_ = x; x_ < x + maxX; x_++) {
                                for (var z_ = z; z_ < z + maxZ; z_++) {
                                    this.blocks[x_][y][z_] = this.blocks[x_][y][z_] | 0x2;
                                }
                            }
                            maxX--;
                            maxZ--;

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize - this.blockSize]);

                            r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
                            g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
                            b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                        }
                    }
                    if (!back) {
                        // back  10000
                       // this.shadow_blocks.push([x, y, z]);
                        if ((this.blocks[x][y][z] & 0x10) == 0) {
                            var maxX = 0;
                            var maxY = 0;

                            for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x10) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x_][y_][z] & 0x10) == 0 && this.SameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var x_ = x; x_ < x + maxX; x_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x_][y_][z] = this.blocks[x_][y_][z] | 0x10;
                                }
                            }
                            maxX--;
                            maxY--;
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

                            r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
                            g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
                            b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                        }
                    }
                    if (!front) {
                        // front 0001
                        if ((this.blocks[x][y][z] & 0x1) == 0) {
                            var maxX = 0;
                            var maxY = 0;

                            for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                               // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x1) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x_][y_][z] & 0x1) == 0 && this.SameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var x_ = x; x_ < x + maxX; x_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x_][y_][z] = this.blocks[x_][y_][z] | 0x1;
                                }
                            }
                            maxX--;
                            maxY--;

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize]);

                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize]);

                            r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
                            g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
                            b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                        }
                    }
                    if (!left) {
                        if ((this.blocks[x][y][z] & 0x8) == 0) {
                            var maxZ = 0;
                            var maxY = 0;

                            for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                               // Check not drawn + same color
                                if ((this.blocks[x][y][z_] & 0x8) == 0 && this.SameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                                    maxZ++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x][y_][z_] & 0x8) == 0 && this.SameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var z_ = z; z_ < z + maxZ; z_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x][y_][z_] = this.blocks[x][y_][z_] | 0x8;
                                }
                            }
                            maxZ--;
                            maxY--;

                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);

                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

                            r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
                            g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
                            b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                        }
                    }
                    if (!right) {
                        if ((this.blocks[x][y][z] & 0x4) == 0) {
                            var maxZ = 0;
                            var maxY = 0;

                            for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x][y][z_] & 0x4) == 0 && this.SameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                                    maxZ++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x][y_][z_] & 0x4) == 0 && this.SameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var z_ = z; z_ < z + maxZ; z_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x][y_][z_] = this.blocks[x][y_][z_] | 0x4;
                                }
                            }
                            maxZ--;
                            maxY--;

                            vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);

                            vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

                            r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
                            g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
                            b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                            colors[cc++] = [r,g,b];
                        }
                    }
                }
            }
        }
        this.triangles = vertices.length / 3;

        if(this.mesh == undefined) {
            var starting_blocks = 0;
            for (var x = 0; x < this.chunk_size_x; x++) {
                for (var y = 0; y < this.chunk_size_y; y++) {
                    for (var z = 0; z < this.chunk_size_z; z++) {
                        if (this.blocks[x][y][z] != 0) {
                            starting_blocks++;
                            this.blocks[x][y][z] &= 0xFFFFFFE0;
                        }
                    }
                }
            }
            this.starting_blocks = starting_blocks;
            this.current_blocks = starting_blocks;
        }


        if(this.mesh != undefined && this.prev_len >= vertices.length) {
            for (var i = 0; i < vertices.length; i++) {
                this.v.setXYZ(i, vertices[i][0], vertices[i][1], vertices[i][2]);
                this.c.setXYZW(i, colors[i][0], colors[i][1], colors[i][2], 1);
            }

            this.geometry.setDrawRange(0, vertices.length); 
            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.attributes.color.needsUpdate = true;
            this.geometry.computeVertexNormals();
            if(this.type != "world") {
                this.geometry.translate(this.offset.x, this.offset.y, this.offset.z);
            }
        } else {
            this.v = new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3);
            this.c = new THREE.BufferAttribute(new Float32Array(colors.length * 3), 3);
            for (var i = 0; i < vertices.length; i++) {
                this.v.setXYZ(i, vertices[i][0], vertices[i][1], vertices[i][2]);
                this.c.setXYZW(i, colors[i][0], colors[i][1], colors[i][2], 1);
            }
            this.geometry = new THREE.BufferGeometry();
            this.geometry.dynamic = true;
            this.geometry.addAttribute('position', this.v);
            this.geometry.addAttribute('color', this.c);
            this.geometry.attributes.position.dynamic = true;
            this.geometry.attributes.color.dynamic = true;
            this.geometry.computeBoundingBox();
            this.geometry.computeVertexNormals();
            this.prev_len = vertices.length;

            if(this.mesh == undefined) {
                this.mesh = new THREE.Mesh(this.geometry, this.material);
                this.mesh.position.set(
                                       this.from_x,
                                       this.from_y,
                                       this.from_z
                );

                game.scene.add(this.mesh);

                if(this.type != "world") {
                    this.offset = this.geometry.center();
                    this.mesh.owner = this.owner;
                    if(this.owner) {
                        game.addToCD(this.mesh);
                    }
                }
            } else {
                this.mesh.geometry = this.geometry;
                if(this.type != "world") {
                    this.geometry.translate(this.offset.x, this.offset.y, this.offset.z);
                }
            }
        }
        this.dirty = false;
    };

    Chunk.prototype.rmBlock = function (x, y, z, dir, dmg, local) {
        //this.batch_points[this.bp++] = { x: x, y: y, z: z};
        var wx = x;
        var wy = y;
        var wz = z;
        
        if(!local) {
            x = x - (this.from_x * this.blockSize + this.blockSize) | 0;
            y = y - (this.from_y * this.blockSize + this.blockSize) | 0;
            z = z - (this.from_z * this.blockSize + this.blockSize) | 0;
        } 
        var max = 0.5;
        if(this.total_blocks > 3000) {
            max = 0.98;
        } else if (this.total_blocks > 1000) {
            max = 0.85;
        } else if (this.total_blocks > 500) {
            max = 0.7;
        } else if(this.total_blocks < 200) {
            max = 0.2;
        }
        var mp_x = 0; 
        var mp_y = 0; 
        var mp_z = 0; 

        if (x >= 0 && y >= 0 && z >= 0) {
            var c = this.blocks[x][y][z];
            if (c != 0) {
                if (this.type == "world") {
                    if (get_rand() > 0.4) {
                        game.particles_box.world_debris(wx, wy, wz, this.blockSize, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF);
                    }
                } else {
                    if (get_rand() > max) {
                       // if(this.mesh.rotation.y == 0) {
                            mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                       // } else { // -Math.PI
                       //     mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x)/(Math.PI*2);
                       //     mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y)/(Math.PI*2);
                       //     mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z)/(Math.PI*2);
                       // }
                        var size = this.blockSize;
                        if(get_rand() > 0.5) {
                            size = 1;
                        }
                        game.particles_box.debris(
                               mp_x + x * this.blockSize,
                               mp_y + y * this.blockSize,
                               mp_z + z * this.blockSize,
                               size, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF, false,
                               //this.blockSize, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF, false,
                               dir.x, dir.y, dir.z
                        );
                    }
                    if(this.owner.radioactive_leak) {
                        if(get_rand() > 0.8) {
                            var mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            var mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            var mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                            game.particles.radioactive_leak(
                                                             mp_x + x * this.blockSize,
                                                             mp_y + y * this.blockSize,
                                                             mp_z + z * this.blockSize,
                                                             0.5
                            );
                        }
                    }
                    if (this.owner.radioactive) {
                        if(get_rand() > max) {
                            var mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            var mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            var mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                            game.particles.radioactive_splat(
                                                             mp_x + x * this.blockSize,
                                                             mp_y + y * this.blockSize,
                                                             mp_z + z * this.blockSize,
                                                             0.2,
                                                             dir.x,
                                                             dir.y,
                                                             dir.z
                            );
                        }
                    }
                    if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                        var size = this.blockSize;
                        if(get_rand() > 0.5) {
                            size = 1;
                        }
                        if(get_rand() > max) {
                            var mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            var mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            var mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                            //for (var t = 0; t < 2; t++) {
                            game.particles.blood(
                                mp_x + x * this.blockSize,
                                mp_y + y * this.blockSize,
                                mp_z + z * this.blockSize,
                                size,
                                dir.x,
                                dir.y,
                                dir.z
                            );
                            //}
                        }
                    }
                }
                this.dirty = true;
                this.blocks[x][y][z] = 0;
            }
            this.current_blocks--;
        }
    };

    Chunk.prototype.addBlock = function (x, y, z, r, g, b) {
        x -= this.from_x * this.blockSize;
        y -= this.from_y * this.blockSize;
        z -= this.from_z * this.blockSize;
        x |= 0;
        y |= 0;
        z |= 0;
        if (x < 0 || y < 0 || z < 0 ||
            x >= this.chunk_size_x || y >= this.chunk_size_y || z >= this.chunk_size_z) {
            return;
        }
        this.blocks[x][y][z] =
            (r & 0xFF) << 24 |
            (g & 0xFF) << 16 |
            (b & 0xFF) << 8 |
            0 & 0xFF;
        this.dirty = true;
    };

    Chunk.prototype.blockExists = function(x, y, z) {
        x -= this.from_x * this.blockSize;
        y -= this.from_y * this.blockSize;
        z -= this.from_z * this.blockSize;
        x |= 0;
        y |= 0;
        z |= 0;
        if (x < 0 || y < 0 || z < 0 ||
            x >= this.chunk_size_x || y >= this.chunk_size_y || z >= this.chunk_size_z) {
            return false;
        }
        if(this.blocks[x][y][z] != 0) {
            return true;
        }
        return false;
    };

    Chunk.prototype.hit = function (dir, power, pos) {
        if (this.blocks == null) {
            return;
        }
        var x = 0;
        var y = 0;
        var z = 0;
        var vx = 0, vy = 0, vz = 0, val = 0, offset = 0;
        var ff = new Array();
        power =  power * (1/this.blockSize);
        var pow = power * power;

        var max = 0.5;
        if(this.total_blocks > 3000) {
            max = 0.98;
        } else if (this.total_blocks > 1000) {
            max = 0.85;
        } else if (this.total_blocks > 500) {
            max = 0.7;
        } else if(this.total_blocks < 200) {
            max = 0.5;
        }


        if(pos == null || this.type == "ff_object") {
            x = get_rand() * this.chunk_size_x | 0;
            z = get_rand() * this.chunk_size_z | 0;
            y = get_rand() * this.chunk_size_y | 0;
        } else {
          //  if(this.mesh.rotation.y == 0) {
                var p = this.mesh.position.y - (this.chunk_size_y*this.blockSize)/2;
                var h = pos.y - p;
                y = h*(1/this.blockSize) |0;

                p = this.mesh.position.x - (this.chunk_size_x * this.blockSize / 2);
                h = pos.x - p;
                x = h*(1/this.blockSize) |0;

                p = this.mesh.position.z - (this.chunk_size_z * this.blockSize / 2);
                h = pos.z - p;
                z = h*(1/this.blockSize) | 0;
           // } else if(this.mesh.rotation.y == -Math.PI) {
           //     var p = this.mesh.position.y - (this.chunk_size_y*this.blockSize)/2;
           //     var h = pos.y - p;
           //     y = h*(1/this.blockSize) |0;

           //     p = this.mesh.position.x + (this.chunk_size_x * this.blockSize / 2);
           //     h = pos.x - p;
           //     x = h*(1/this.blockSize) |0;

           //     p = this.mesh.position.z + (this.chunk_size_z * this.blockSize / 2);
           //     h = pos.z - p;
           //     z = h*(1/this.blockSize) | 0;
           // }
        }

        x = x > 0? x: 0;
        y = y > 0? y: 0;
        z = z > 0? z: 0;
        
        var offset = 5;
        if(this.type == "enemy") {
            offset = 20;
        }
        // Try to find a point which has a block to not repeat the hits
        if (x >= 0 && y >= 0 && z >= 0 && x < this.chunk_size_x && y < this.chunk_size_y && z < this.chunk_size_z) {
            if((this.blocks[x][y][z] >> 8) == 0) {
                var found = false;
                for(var x_ = x-offset; x_ < x+offset; x_++) {
                    for(var z_ = z-offset; z_ < z+offset; z_++) {
                        for(var y_ = y-offset; y_ < y+offset; y_++) {
                            if (x_ >= 0 && y_ >= 0 && z_ >= 0 && x_ < this.chunk_size_x && y_ < this.chunk_size_y && z_ < this.chunk_size_z) {
                                rx |= 0;
                                ry |= 0;
                                rz |= 0;
                                if((this.blocks[x_][y_][z_] >> 8) != 0) {
                                    found = true;
                                    x = x_; 
                                    y = y_;
                                    z = z_;
                                    break;
                                }
                            }
                        }
                        if(found) { break; }
                    }
                    if(found) { break; }
                }
            }
        }
        //if (x >= 0 && y >= 0 && z >= 0 && x < this.chunk_size_x && y < this.chunk_size_y && z < this.chunk_size_z) {
        //    if((this.blocks[x][y][z] >> 8) == 0) {
        //        var found = false;
        //        for(var x_ = x; x_ < this.chunk_size_x; x_++) {
        //            for(var z_ = z; z_ < this.chunk_size_z; z_++) {
        //                if (x_ >= 0 && z_ >= 0 && x_ < this.chunk_size_x  && z_ < this.chunk_size_z) {
        //                    if((this.blocks[x_][y][z_] >> 8) != 0) {
        //                        found = true;
        //                        console.log("NEW POS");
        //                        x = x_; 
        //                        z = z_;
        //                        break;
        //                    }
        //                }
        //            }
        //            if(found) { break; }
        //        }
        //    }
        //}

        var isHit = 0;
        var from_x = (x - power) < 0? 0: x-power;
        var from_z = (z - power) < 0? 0: z-power;
        var from_y = (y - power) < 0? 0: y-power;
        for (var rx = from_x; rx <= x + power; rx++) {
            vx = Math.pow((rx - x), 2); //*(rx-x);
            for (var rz = from_z; rz <= z + power; rz++) {
                vz = Math.pow((rz - z), 2) + vx; //*(rz-z);
                for (var ry = from_y; ry <= y + power; ry++) {
                    val = Math.pow((ry - y), 2) + vz;
                    rx |= 0;
                    ry |= 0;
                    rz |= 0;
                    if (val < pow) {
                        if (rx >= 0 && ry >= 0 && rz >= 0 && rx < this.chunk_size_x && ry < this.chunk_size_y && rz < this.chunk_size_z) {
                            if ((this.blocks[rx][ry][rz] >> 8) != 0) {
                                if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                                    if(get_rand() > max) {
                                        game.particles.blood(
                       //                            this.mesh.position.x + rx * this.blockSize,
                       //                            this.mesh.position.y + ry * this.blockSize,
                       //                            this.mesh.position.z + rz * this.blockSize,
                                                   this.mesh.position.x - (this.blockSize * this.chunk_size_x)/2 +rx*this.blockSize,
                                                   this.mesh.position.y - (this.blockSize * this.chunk_size_y)/2 +ry*this.blockSize,
                                                   this.mesh.position.z - (this.blockSize * this.chunk_size_z)/2 +rz*this.blockSize, 
                                                   0.5,
                                                   dir.x,
                                                   dir.y,
                                                   dir.z
                                        );
                                    }
                                }
                                this.rmBlock(rx, ry, rz, dir, power, true);
                                isHit = true;
                            }
                        }
                    } else if (val >= pow) {
                        if (rx >= 0 && ry >= 0 && rz >= 0 && rx < this.chunk_size_x && ry < this.chunk_size_y && rz < this.chunk_size_z) {
                            if ((this.blocks[rx][ry][rz] >> 8) != 0) {
                                ff.push(new THREE.Vector3(rx, ry, rz));
                                if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                                    if(get_rand() > 0.5) {
                                        this.blocks[rx][ry][rz] = (0xAA & 0xFF) << 24 | (0x08 & 0xFF) << 16 | (0x08 & 0xFF) << 8;
                                        this.blood_positions.push(new THREE.Vector3(rx, ry, rz));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if(isHit) {
            this.health = (this.current_blocks / this.starting_blocks) * 100;
            var max_hp = 60;
            if(this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                max_hp = 90;
            }
            if (((this.owner.base_type == "enemy" || this.owner.base_type == "player") && this.health < max_hp) ||
                ((this.owner.base_type == "object" || this.owner.base_type == "ff_object") && ff.length > 0))
            {

                
                for (var x = 0; x < this.chunk_size_x; x++) {
                    for (var y = 0; y < this.chunk_size_y; y++) {
                        for (var z = 0; z < this.chunk_size_z; z++) {
                            this.blocks[x][y][z] &= 0xFFFFFF00;
                        }
                    }
                }

                for (var i = 0; i < ff.length; i++) {
                    this.floodFill(ff[i], dir, power);
                }
                //this.build();
                // Recalc health after flood fill
                this.health = (this.current_blocks / this.starting_blocks) * 100;
                this.dirty = true;
                if(this.health < 20) {
                    game.removeFromCD(this.mesh);
                }
            }
            return true;
        }
        return false;
    };

    Chunk.prototype.floodFill = function (start, dir, power) {
        var ground = 1; //this.mesh.position.y - (this.chunk_size_y*this.blockSize / 2);
        var stack = new Array();
        var result = new Array();
        // Keep track of upcoming chunk size.
        var max_x = 0;
        var max_y = 0;
        var max_z = 0;
        
        if((this.blocks[start.x][start.y][start.z] & 0x40) != 0 ||
           (this.blocks[start.x][start.y][start.z] & 0x80) != 0) 
        {
            return;
        }

        stack.push(start);
        while (stack.length != 0) {
            var b = stack.pop();
            if (b.x < 0 || b.y < 0 || b.z < 0 || b.x > this.chunk_size_x || b.y > this.chunk_size_y || b.z > this.chunk_size_z) {
                continue;
            }
            if ((this.blocks[b.x][b.y][b.z] >> 8) == 0) {
                continue;
            }
            if ((this.blocks[b.x][b.y][b.z] & 0x80) != 0) {
                continue;
            }
            if ((this.blocks[b.x][b.y][b.z] & 0x40) != 0) {
                continue;
            }


            if (b.x > max_x) { max_x = b.x; }
            if (b.y > max_y) { max_y = b.y; }
            if (b.z > max_z) { max_z = b.z; }
            result.push([b, this.blocks[b.x][b.y][b.z]]);

           // this.blocks[b.x][b.y][b.z] = (200 & 0xFF) << 24 | (0 & 0xFF) << 16 | (200 & 0xFF) << 8;
            this.blocks[b.x][b.y][b.z] |= 0x80;

            if(b.y < 3) {
                for(var i = 0; i < result.length; i++) {
                    this.blocks[b.x][b.y][b.z] |= 0x40;
                    this.blocks[b.x][b.y][b.z] |= 0x80;
                }
                return;
            }

            stack.push(new THREE.Vector3(b.x, b.y + 1, b.z));
            stack.push(new THREE.Vector3(b.x, b.y, b.z + 1));
            stack.push(new THREE.Vector3(b.x + 1, b.y, b.z));
            stack.push(new THREE.Vector3(b.x, b.y, b.z - 1));
            stack.push(new THREE.Vector3(b.x - 1, b.y, b.z));
            stack.push(new THREE.Vector3(b.x, b.y - 1, b.z));
        }
        
        if(result.length < 5) {
            return; 
        }


        if (result.length > 0 && result.length != this.current_blocks) {
           // console.log("CHUNK GND:", ground, "RES:",result.length, "CUR:", this.current_blocks);
            var chunk = new Chunk(0, 0, 0, max_x, max_y, max_z, "ff_object", this.blockSize, false);
            chunk.init();
            for (var i = 0; i < result.length; i++) {
                var p = result[i][0];
                chunk.addBlock(p.x, p.y, p.z, (result[i][1] >> 24) & 0xFF, (result[i][1] >> 16) & 0xFF, (result[i][1] >> 8) & 0xFF);
                //chunk.addBlock(p.x, p.y, p.z, 255 , 0, 200);
                this.blocks[p.x][p.y][p.z] = 0;
                this.current_blocks--;
                //this.rmBlock(p.x, p.y, p.z, dir, 1, true);
            }
            this.dirty = true;

            ffc = new FFChunk();
            ffc.create(chunk);
            ffc.base_type = this.owner.base_type;
            chunk.build();

            game.particles.chunkDebris(
                this.mesh.position.x,
                game.maps.ground+max_y*this.blockSize,
                this.mesh.position.z,
                ffc.chunk,
                dir.x,
                dir.y,
                dir.z,
                power
            );
        }
    };

    Chunk.prototype.explode = function (dir, damage) {
        if(!damage) { damage = 0; }
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if ((this.blocks[x][y][z] >> 8) != 0) {
                        this.rmBlock(x, y, z, dir, damage);
                    }
                }
            }
        }
        this.mesh.visible = false;
    };

    Chunk.prototype.placeInWorld = function () {
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if (this.blocks[x][y][z] != 0) {
                        var c = this.blocks[x][y][z];
                        game.world.addBlock(
                            this.mesh.position.x + x,
                            this.mesh.position.y + y,
                            this.mesh.position.z + z,
                            (c >> 24) & 0xFF,
                            (c >> 16) & 0xFF,
                            (c >> 8) & 0xFF
                        );
                    }
                }
            }
        }
        var that = this;
    };

    Chunk.prototype.virtual_explode = function (pos) {
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if (this.blocks[x][y][z] != 0) {
                        var c = this.blocks[x][y][z];
                        if (get_rand() > 0.9) {
                            game.particles.debris(
                                pos.x + x * this.blockSize / 2,
                                pos.y + y * this.blockSize / 2,
                                pos.z + z * this.blockSize / 2,
                                this.blockSize,
                                (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF,
                                true
                            );
                        }
                    }
                }
            }
        }
    };

    Chunk.prototype.blockExists_w = function(pos) {
        var l = (this.blockSize*this.chunk_size_x/2)*(1/this.blockSize);
        var x = this.chunk_size_x - (pos.x - (this.mesh.position.x - l)) | 0; 
        var y = this.chunk_size_y - (pos.y - (this.mesh.position.y - l)) | 0; 
        var z = this.chunk_size_z - (pos.z - (this.mesh.position.z - l)) | 0; 
        if(x >= 0 && y >= 0 && z >= 0 && x < this.chunk_size_x && y < this.chunk_size_y && z < this.chunk_size_z) {
            if((this.blocks[x][y][z] >> 8) != 0) {
                return true;
            }
        }
        return false;
    };


    Chunk.prototype.checkExists = function (x, y, z) {
        x -= this.from_x * this.blockSize + this.blockSize;
        y -= this.from_y * this.blockSize + this.blockSize;
        z -= this.from_z * this.blockSize + this.blockSize;
        x |= 0;
        y |= 0;
        z |= 0;
        if (!(x < 0 || y < 0 || z < 0)) {
            if (this.blocks[x][y][z] != 0) {
                return this.blocks[x][y][z];
            }
        }
        return -1;
    };

    Chunk.prototype.checkCD = function(vec, range) {
        if(vec.x <= this.mesh.position.x + range &&
           vec.x >= this.mesh.position.x - range)
        {
            if(vec.z <= this.mesh.position.z + range &&
               vec.z >= this.mesh.position.z - range)
            {
                return true;
            }
        }
        return false;
    };


};
