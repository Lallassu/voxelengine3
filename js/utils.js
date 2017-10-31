//////////////////////////////////////////////////////////////////////
// Random number generator (faster than Math.random())
// https://en.wikipedia.org/wiki/Linear_feedback_shift_register
//////////////////////////////////////////////////////////////////////
var lfsr = (function(){
  var max = Math.pow(2, 16),
      period = 0,
      seed, out;
  return {
    setSeed : function(val) {
      out = seed = val || Math.round(Math.random() * max);
    },
    rand : function() {
      var bit;
      // From http://en.wikipedia.org/wiki/Linear_feedback_shift_register
      bit  = ((out >> 0) ^ (out >> 2) ^ (out >> 3) ^ (out >> 5) ) & 1;
      out =  (out >> 1) | (bit << 15);
      period++;
      return out / max;
    }
  };
}());

// Set seed
lfsr.setSeed();

//////////////////////////////////////////////////////////////////////
// Static random numbers used where repetition is not an issue
// ruby: x = [] ; 200.times do |d| x << (rand(100000).to_f)/100000.0 end
//////////////////////////////////////////////////////////////////////
// Between 0 - 1
var stat_num_map = [
    0.77746, 0.38325, 0.82969, 0.05736, 0.33151, 0.43286, 0.26037, 0.85439, 0.57122, 0.73872, 0.28077,
    0.49789, 0.58933, 0.09512, 0.75828, 0.41196, 0.0807, 0.50793, 0.75701, 0.68665, 0.08474, 0.16016,
    0.43875, 0.81966, 0.61215, 0.13987, 0.50136, 0.95285, 0.57436, 0.70174, 0.67813, 0.49587, 0.83456,
    0.73027, 0.86012, 0.0924, 0.43373, 0.98667, 0.45188, 0.79781, 0.3626, 0.59903, 0.99556, 0.43216,
    0.45571, 0.64112, 0.85143, 0.75009, 0.94958, 0.36195, 0.35397, 0.58863, 0.01064, 0.68362, 0.05133,
    0.44274, 0.68037, 0.63273, 0.74691, 0.17625, 0.73156, 0.52864, 0.35168, 0.72908, 0.89366, 0.83301,
    0.42203, 0.06304, 0.94694, 0.54525, 0.32247, 0.57608, 0.80634, 0.12162, 0.02639, 0.27409, 0.25831,
    0.44754, 0.11184, 0.02311, 0.03436, 0.34766, 0.79593, 0.6783, 0.19008, 0.00183, 0.9768, 0.3301,
    0.20512, 0.11993, 0.58733, 0.03422, 0.18652, 0.33865, 0.24856, 0.77101, 0.09319, 0.55872, 0.4192,
    0.19792, 0.38903, 0.18217, 0.65521, 0.94122, 0.6499, 0.30811, 0.89826, 0.09543, 0.87178, 0.51089,
    0.89722, 0.1274, 0.9531, 0.13679, 0.25896, 0.37279, 0.43501, 0.21727, 0.88999, 0.11503, 0.17848,
    0.16564, 0.88475, 0.3432, 0.39633, 0.5139, 0.36382, 0.69775, 0.06262, 0.66089, 0.33486, 0.78529,
    0.93855, 0.43085, 0.47818, 0.51298, 0.03996, 0.46495, 0.66424, 0.70112, 0.82315, 0.23446, 0.41075,
    0.04516, 0.52066, 0.17212, 0.49415, 0.63684, 0.03172, 0.33451, 0.72341, 0.18837, 0.2362, 0.97798,
    0.90431, 0.11286, 0.05978, 0.15245, 0.3747, 0.49159, 0.09513, 0.75614, 0.05216, 0.4333, 0.45121,
    0.1803, 0.80168, 0.54211, 0.70403, 0.11684, 0.16551, 0.2291, 0.20917, 0.87581, 0.01812, 0.78673,
    0.42666, 0.1552, 0.3867, 0.71406, 0.58447, 0.80413, 0.72927, 0.99886, 0.18384, 0.48211, 0.60929,
    0.87499, 0.30788, 0.34838, 0.73324, 0.2314, 0.3593, 0.91898, 0.10065, 0.39987, 0.72087, 0.4016,
    0.25805, 0.05051, 0.70141, 0.83446, 0.84307, 0.05106, 0.00964, 0.3026, 0.31798, 0.95077, 0.11042,
    0.14119, 0.84516, 0.98542, 0.98902, 0.05506, 0.6112, 0.67786, 0.69112, 0.84239, 0.36507, 0.01173,
    0.87732, 0.6359, 0.35604, 0.24673, 0.44617, 0.37018, 0.76193, 0.72712, 0.88626, 0.01643, 0.9409,
    0.18734, 0.03506, 0.67585, 0.28602, 0.74197, 0.17264, 0.9465, 0.42938, 0.41604, 0.21111, 0.2791,
    0.9034, 0.16715, 0.59769, 0.73084, 0.60744, 0.67604, 0.48812, 0.12001, 0.76125, 0.46963, 0.39409,
    0.36054, 0.32468, 0.19014, 0.66838, 0.54969, 0.09771, 0.22431, 0.1457, 0.66945, 0.71004, 0.69441,
    0.36207, 0.48927, 0.89035, 0.90515, 0.43973, 0.02986, 0.3815, 0.86726, 0.13784, 0.68904, 0.38601,
    0.69549, 0.78781, 0.3029, 0.86677, 0.5366, 0.62056, 0.0575, 0.20683, 0.10916, 0.0233, 0.25164,
    0.72227, 0.97402, 0.45464, 0.55953, 0.45408, 0.27305, 0.63581, 0.38718, 0.04453, 0.78245, 0.67373,
    0.72035, 0.38357, 0.26547
];
var cnt = 0;
function get_rand() {
    if(cnt < stat_num_map.length-1) {
        cnt++;
    } else {
        cnt = 0;
    }
    return stat_num_map[cnt];
}


//////////////////////////////////////////////////////////////////////
// Load image files to pixel map
//////////////////////////////////////////////////////////////////////
function loadImageFile(file, callback) {
    var image = new Image();
    image.src = file;
    var ctx = document.createElement('canvas').getContext('2d');
    var that = this;
    image.onload = function() {
        ctx.canvas.width  = image.width;
        ctx.canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        var map = new Array();
        var imgData = ctx.getImageData(0, 0, image.width, image.height);

        var list = [];
        for(var y = 0; y < image.height; y++) {
            var pos = y * image.width * 4;
            map[y] = new Array();
            for(var x = 0; x < image.width; x++) {
                var r = imgData.data[pos++];
                var g = imgData.data[pos++];
                var b = imgData.data[pos++];
                var a = imgData.data[pos++];
                map[y][x] = {};
                map[y][x].r = r;
                map[y][x].g = g;
                map[y][x].b = b;
                map[y][x].a = a;
                if(a != 0 && !(r == 0 && g == 0 && b == 0)) {
                    list.push({x: x, y: y, z: 0, r: r, g: g, b: b, a: a});
                }
            }
        }
        //callback(map, image.width, image.height);
        callback(list, image.width, image.height, map);
    }
}

function LockPointer() {
    var e = document.body;
    //var e = document.getElementById('container');
    e.requestPointerLock = e.requestPointerLock ||
        e.mozRequestPointerLock ||
        e.webkitRequestPointerLock;

    e.requestPointerLock();
}

function isFrontOfPlayer(v1) {
    var targetPosition = new THREE.Vector3();
    targetPosition = targetPosition.setFromMatrixPosition(v1.matrixWorld);
    var lookAt = game.player.chunk.mesh.getWorldDirection();
    var pos = targetPosition.sub(game.player.chunk.mesh.position);

    return (pos.angleTo(lookAt))-0.4 < (Math.PI /6);
}
