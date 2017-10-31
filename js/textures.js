const MAP1 = 0;
const WALL1 = 1;
const ROAD1 = 2;
const GRASS1 = 3;
const TREE1 = 4;
const DIRT1 = 5;
const STONE_WALL = 6;
const WALL2 = 7;
const FLOOR1 = 8;
const RADIOACTIVE_BARREL = 9;
const LEVEL1_WALL = 10;
const WOOD_WALL = 11;
const LEVEL1_WALL2 = 12;

const IMAGE = 0;
const HEIGHT_MAP = 1;

function Textures() {
    this.files = [
        ["map1.png", IMAGE],
        ["wall.jpg", IMAGE],
        ["road.jpg", IMAGE], 
        ["grass1.jpg", IMAGE], 
        ["tree1.jpg", IMAGE],
        ["dirt.jpg", IMAGE],
        ["stone_wall.jpg", IMAGE],
        ["wall2.png", IMAGE],
        ["floor1.png", IMAGE],
        ["radioactive.png", IMAGE],
        ["wall_level1.png", IMAGE],
        ["wood_fence.png", IMAGE],
        ["wall2_level1.png", IMAGE],
    ];
    this.tex = [];
    this.loaded = 0;
    this.heightMap = {};

    Textures.prototype.clean = function() {
        for(var i = 0; i < this.tex.length; i++) {
            this.tex[i].map = null;
            this.tex[i] = null;
        }
    };

    Textures.prototype.getMap = function(map_id) {
        return this.tex[map_id];
    };

    Textures.prototype.isLoaded = function() {
        return this.loaded == this.files.length? true : false;
    };

    Textures.prototype.prepare = function() {
        for(var i = 0; i < this.files.length; i++) {
            this.tex[i] = {};
            this.tex[i].file = this.files[i][0];
            if(this.files[i][1] == IMAGE) {
                this.load(this.tex[i].file, i);
            } else if(this.files[i][1] == HEIGHT_MAP) {
                this.loadHeightMap(this.tex[i].file, i);
            }
        }
    };

    Textures.prototype.getPixel = function(x, y, tex_id) {
        // Scale x,y to image size.
        //console.log(this.tex[tex_id], tex_id);
        var tx = (x/this.tex[tex_id].height)|0; 
        var xx = x - (tx*this.tex[tex_id].height);
        var ty = (y/this.tex[tex_id].width)|0; 
        var yy = y - (ty*this.tex[tex_id].width);
        //console.log(yy,xx);
        if(this.tex[tex_id].map[xx] == undefined) {
            console.log(xx,yy);
        }
        if(xx >= this.tex[tex_id].height) { xx = this.tex[tex_id].height - 10;}
        if(yy >= this.tex[tex_id].width) { yy = this.tex[tex_id].width - 10;}
        if(this.tex[tex_id].map[xx] == undefined) {
            console.log(this.tex[tex_id].map.length);
            console.log(this.tex[tex_id], xx,yy);
        }
        return {r: this.tex[tex_id].map[xx][yy].r,
            g: this.tex[tex_id].map[xx][yy].g,
            b: this.tex[tex_id].map[xx][yy].b
        };
    };

    Textures.prototype.loadHeightMap = function(filename, id) {
        var image = new Image();
        image.src = "assets/textures/"+filename;
        image.id = id;
        var ctx = document.createElement('canvas').getContext('2d');
        var that = this;

        image.onload = function() {
            var scale = 1;
            ctx.canvas.width = image.width;
            ctx.canvas.height = image.height;

            that.tex[image.id].width = image.width;
            that.tex[image.id].height = image.height;

            var size = image.width * image.height;
            var data = new Float32Array( size );

            ctx.drawImage(image,0,0);

            for ( var i = 0; i < size; i ++ ) {
                data[i] = 0
            }

            var imaged = ctx.getImageData(0, 0, image.width, image.height);
            var pix = imaged.data;

            that.tex[image.id].map = new Array();
            for(var y = 0; y < image.height; y++) {
                var pos = y * image.width * 4;
                that.tex[image.id].map[y] = new Array();
                for(var x = 0; x < image.width; x++) {
                    var all = pix[pos]+pix[pos+1]+pix[pos+2];
                    pos++;
                    pos++;
                    pos++;
                    that.tex[image.id].map[y][x] = all;
                }
            }
            that.loaded++;
        }
    };

    Textures.prototype.load = function(filename, id) {
        var image = new Image();
        image.src = "assets/textures/"+filename;
        image.id = id;
        var ctx = document.createElement('canvas').getContext('2d');
        var that = this;
        image.onload = function() {
            ctx.canvas.width  = image.width;
            ctx.canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            that.tex[image.id].width = image.width;
            that.tex[image.id].height = image.height;
            that.tex[image.id].map = new Array();
            var imgData = ctx.getImageData(0, 0, image.width, image.height);
            for(var y = 0; y < image.height; y++) {
                var pos = y * image.width * 4;
                that.tex[image.id].map[y] = new Array();
                for(var x = 0; x < image.width; x++) {
                    var r = imgData.data[pos++];
                    var g = imgData.data[pos++];
                    var b = imgData.data[pos++];
                    var a = imgData.data[pos++];
                    that.tex[image.id].map[y][x] = {'r': r, 'g': g, 'b': b, 'a': a};
                }
            }
            that.loaded++;
        }
    };

}
