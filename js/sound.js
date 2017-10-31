function SoundLoader() {
    this.sounds = new Array();
    this.context;
    this.muted = false;

    SoundLoader.prototype.isPlaying = function(name) {
        if(this.sounds[name].source != null) {
            return true;
        }
        return false;
    };

    SoundLoader.prototype.StopSound = function(name) {
        this.sounds[name].source = null;
    };

    SoundLoader.prototype.PlaySound = function(name, position, radius, loop) {
        if(loop == null) { loop = false; }
        this.sounds[name].source = this.context.createBufferSource();
        this.sounds[name].source.buffer = this.sounds[name].buffer;
        this.sounds[name].gainNode = this.context.createGain();
        this.sounds[name].source.connect(this.sounds[name].gainNode);
        this.sounds[name].source.loop = loop;
        this.sounds[name].gainNode.connect(this.context.destination);
        this.sounds[name].source.start(0);

        var that = this;
        this.sounds[name].source.onended = function() {
            that.sounds[name].source = null;
        };

        if(position != undefined) {
            var vector = game.camera.localToWorld(new THREE.Vector3(0,0,0));
            var distance = position.distanceTo( vector );
            if ( distance <= radius ) {
                var vol = 1 * ( 1 - distance / radius );
                this.sounds[name].gainNode.gain.value = vol;
            } else {
                this.sounds[name].gainNode.gain.value = 0;
            }
        } else {
            this.sounds[name].gainNode.gain.value = 1;
        }
    };

    SoundLoader.prototype.Add = function(args) {
        this.sounds[args.name] = new Object();
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if(this.context == undefined) {
            this.context = new AudioContext();
        }
        //var context = new AudioContext();
        var loader = new BufferLoader(this.context,
                                      [args.file],
                                      this.Load.bind(this, args.name));
        loader.load();
    };

    SoundLoader.prototype.Load = function(name, buffer) {
        this.sounds[name].buffer = buffer[0];
    };
}

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;

    BufferLoader.prototype.loadBuffer = function(url, index) {
        // Load buffer asynchronously
        //console.log("URL: "+url);
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var loader = this;

        request.onload = function() {
            // Asynchronously decode the audio file data in request.response
            loader.context.decodeAudioData(
                   request.response,
                   function(buffer) {
                       if (!buffer) {
                           alert('error decoding file data: ' + url);
                           return;
                       }
                       loader.bufferList[index] = buffer;
                       if (++loader.loadCount == loader.urlList.length)
                           loader.onload(loader.bufferList);
                   },
                   function(error) {
                       console.log("ERROR FOR URL: "+url);
                       console.log('decodeAudioData error', error);
                   }
            );
        }

        request.onerror = function() {
            alert('BufferLoader: XHR error');
        }

        request.send();
    };

    BufferLoader.prototype.load = function() {
        for (var i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
    };
}
