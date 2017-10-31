if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
//////////////////////////////////////////////////////////////////////
// Main class - Where the magic happens
//////////////////////////////////////////////////////////////////////
function Main() {
    this.renderer = 0;
    this.controls = 0;
    this.camera = 0;
    this.scene = 0;
    this.stats = 0;
    this.clock = 0;
    this.light1 = 0;
    this.particles = 0;
    this.particles_box = 0;
    this.t_start = Date.now();
    this.modelLoader = new ModelLoader();
    this.maps = 0;
    this.world = new World();
    this.update_objects = [];
    this.cdList = [];
    this.player = 0;
    this.visible_distance = 250; // from player to hide chunks + enemies.
    this.textures = new Textures();
    this.chunk_material = 0;
    this.objects = {};
    this.ff_objects = [];
    this.sounds = new SoundLoader();

    // Particle stuff.
    this.box_material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    this.sprite_material = new THREE.SpriteMaterial({ color: 0xffffff });
    this.chunk_material = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, wireframe: false });
    this.p_light = new THREE.PointLight(0xFFAA00, 1, 10);
 
    Main.prototype.init = function() {
        this.sounds.Add({name: "sniper", file: "assets/sounds/sniper.wav.mp3"});
        this.sounds.Add({name: "take_heart", file: "assets/sounds/heart.wav.mp3"});
        this.sounds.Add({name: "walk1", file: "assets/sounds/walk1.wav.mp3"});
        this.sounds.Add({name: "blood1", file: "assets/sounds/blood1.wav.mp3"});
        this.sounds.Add({name: "blood2", file: "assets/sounds/blood2.wav.mp3"});
        this.sounds.Add({name: "blood3", file: "assets/sounds/blood3.wav.mp3"});
        this.sounds.Add({name: "rocket", file: "assets/sounds/rocket_shoot.wav.mp3"});
        this.sounds.Add({name: "rocket_explode", file: "assets/sounds/rocket_explode.wav.mp3"});
        this.sounds.Add({name: "ak47", file: "assets/sounds/ak47.wav.mp3"});
        this.sounds.Add({name: "p90", file: "assets/sounds/p90.wav.mp3"});
        this.sounds.Add({name: "pistol", file: "assets/sounds/pistol.mp3"});
        this.sounds.Add({name: "grenadelauncher", file: "assets/sounds/grenadelauncher.mp3"});
        this.sounds.Add({name: "shotgun", file: "assets/sounds/shotgun_shoot.wav.mp3"});
        this.sounds.Add({name: "shotgun_reload", file: "assets/sounds/shotgun_reload.wav.mp3"});
        this.sounds.Add({name: "minigun", file: "assets/sounds/gunshot1.wav.mp3"});
        this.sounds.Add({name: "fall", file: "assets/sounds/fall.wav.mp3"});
        this.sounds.Add({name: "fall2", file: "assets/sounds/scream.wav.mp3"});
        this.sounds.Add({name: "footsteps", file: "assets/sounds/footsteps.wav.mp3"});
        this.sounds.Add({name: "heartbeat", file: "assets/sounds/heartbeat.wav.mp3"});
        this.sounds.Add({name: "painkillers", file: "assets/sounds/painkillers.wav.mp3"});
        this.sounds.Add({name: "ambient_horror", file: "assets/sounds/ambient_horror.wav.mp3"});
        this.sounds.Add({name: "ambient_street", file: "assets/sounds/ambient_street.mp3"});
        this.sounds.Add({name: "hit1", file: "assets/sounds/hit1.wav.mp3"});
        this.sounds.Add({name: "hit2", file: "assets/sounds/hit2.wav.mp3"});
        this.sounds.Add({name: "hunt1", file: "assets/sounds/kill_you.wav.mp3"});
        this.sounds.Add({name: "hunt2", file: "assets/sounds/take_him.wav.mp3"});
        this.sounds.Add({name: "ammo_fall", file: "assets/sounds/ammo_fall.wav.mp3"});
        this.sounds.Add({name: "reload", file: "assets/sounds/reload.wav.mp3"});
        this.sounds.Add({name: "bullet_wall", file: "assets/sounds/bullet_wall.mp3"});
        this.sounds.Add({name: "bullet_metal", file: "assets/sounds/bullet_metal.mp3"});
       // this.sounds.Add({name: "haha1", file: "assets/sounds/haha.wav.mp3"});
       // this.sounds.Add({name: "haha2", file: "assets/sounds/haha2.wav.mp3"});
       // this.sounds.Add({name: "haha3", file: "assets/sounds/haha3.wav.mp3"});
        //
        //var loader = new THREE.TextureLoader();
        //var that = this;
        //loader.load(
        //    'assets/textures/bump.png',
        //    function (texture) {
        //        //texture.anisotropy = 4;
        //        //texture.repeat.set(0.998, 0.998);
        //        //texture.offset.set(0.001, 0.001);
        //        //texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //        //texture.format = THREE.RGBFormat;
        //        that.bump_map = new THREE.MeshPhongMaterial({ map: texture,specularMap: texture, vertexColors: THREE.VertexColors, wireframe: false });
        //    }
        //);
        var container = document.getElementById( 'container' );
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        
        // Iosmetric view
       // var aspect = window.innerWidth / window.innerHeight;
       // var d = 70;
       // var aspect = window.innerWidth/window.innerHeight;
       // this.camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, -d, 1, 3000 );
        this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, this.visible_distance );
       // this.camera.applyMatrix( new THREE.Matrix4().makeTranslation( 300, 150, 300 ) );
       // this.camera.applyMatrix( new THREE.Matrix4().makeRotationX( -0.8 ) );

        //this.camera.position.set( 200, 300, 700 ); 

      //  this.scene.fog = new THREE.FogExp2( 0xFFA1C1, 0.0059 );
        //this.scene.fog = new THREE.Fog( 0xFFA1C1, 180, this.visible_distance );
        this.scene.fog = new THREE.Fog( 0x000000, 180, this.visible_distance );

     //   this.controls = new THREE.FlyControls( this.camera );
     //   this.controls.movementSpeed = 700;
     //   this.controls.domElement = container;
     //   this.controls.rollSpeed = Math.PI / 10;
     //   this.controls.autoForward = false;
     //   this.controls.dragToLook = false;

        
//
 //       var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1.1 );
 //     //  hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
 //      // hemiLight.groundColor.setHSL( 0.095, 0.5, 0.75 );
 //       hemiLight.position.set( 0, 10, 0 );
 //       this.scene.add( hemiLight );

       // var dirLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight.position.set(0, 50, 40);
       // this.scene.add( dirLight );
       // var dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight2.position.set(0, 50, -40);
       // this.scene.add( dirLight2 );
       // var dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight2.position.set(-1000, 0, -40);
       // this.scene.add( dirLight2 );
       // var dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight2.position.set(1000, 0, -40);
       // this.scene.add( dirLight2 );
//
//
     //   var dirLight = new THREE.DirectionalLight( 0x000000, 1.2 );
     //   dirLight.color.setHSL( 0.5, 0.9, 0.95 );
     //   dirLight.position.set( 20, 10, -20 );
     //   dirLight.position.multiplyScalar( 10);

     //   dirLight.castShadow = true;

     //   dirLight.shadow.mapSize.width = 2048;
     //   dirLight.shadow.mapSize.height = 2048; // 2048

     //   var d = 1500;

     //   dirLight.shadow.camera.left = -d;
     //   dirLight.shadow.camera.right = d;
     //   dirLight.shadow.camera.top = d;
     //   dirLight.shadow.camera.bottom = -d;

     //   dirLight.shadow.camera.far = 1500;
     // //  dirLight.shadow.bias = -0.00001;
     //   this.light1 = dirLight;
     //   this.scene.add(dirLight);

        //   this.controls = new THREE.FirstPersonControls(this.camera);
     //   this.controls.lookSpeed = 0.4;
     //   this.controls.noFly = true;
     //   this.controls.lookVertical = false;
     //   this.controls.constrainVertical = true;
     //   this.controls.verticalMin = Math.PI/2;
     //   //this.controls.verticalMax = 2.0;
     //   this.controls.lon = -150;
     //   this.controls.lat = 120;
     //   this.controls.movementSpeed = 70;

        this.renderer = new THREE.WebGLRenderer({antialias: false});
     //   console.log(window.devicePixelRatio);
        this.renderer.setPixelRatio( 1 );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
       // this.renderer.setClearColor(0xFFA1C1, 1);
      //  this.renderer.setClearColor(0xFFA1C1, 1);
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild( this.renderer.domElement );
        this.stats = new Stats();
        container.appendChild( this.stats.dom );

        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

        // Load models
        this.modelLoader.init();
        this.modelLoader.loadFiles();

        // Init world.
        this.world.init();


        // Init particle engine
        this.particles = new ParticlePool();
        this.particles.init(2000, 0);
        this.particles_box = new ParticlePool();
        this.particles_box.init(1000, 1);
        
        // DEBUG STUFF
       // var gridHelper = new THREE.GridHelper( 5000, 100);
       // gridHelper.position.set(0,0,0);
       // game.scene.add( gridHelper );
        
        // Wait for all resources to be loaded before loading map.
        this.textures.prepare();
        this.waitForLoadTextures();
        
    };

    Main.prototype.waitForLoadTextures = function() {
        if(!game.textures.isLoaded()) {
            setTimeout(function() {
                console.log("waiting for load of textures...");
                game.waitForLoadTextures();
            }, 100);
        } else {
            game.waitForLoadMap();
        }
    };

    Main.prototype.waitForLoadMap = function() {
        if(game.modelLoader.files.length > 0) {
            setTimeout(function() {
                console.log("waiting for load of files...");
                game.waitForLoadMap();
            }, 500);
        } else {
            this.maps = new Level1();
            this.maps.init();
            //game.maps.init("Level 1", "assets/maps/map3_ground.png", "assets/maps/map3_objects.png");
            // Load objects here to reduce overhead of multiple objects of same type.
            this.objects["shell"] = new Shell();
            this.objects["shell"].create();
            this.objects["ammo"] = new Ammo();
            this.objects["ammo"].create();
            this.objects["ammo_p90"] = new AmmoP90();
            this.objects["ammo_p90"].create();
            this.objects["ammo_sniper"] = new AmmoSniper();
            this.objects["ammo_sniper"].create();
            this.objects["heart"] = new Heart();
            this.objects["heart"].create();

            this.render();
        }
    };

    Main.prototype.reset = function() {
        this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, this.visible_distance );
        this.world.reset();
        this.maps.reset();
        this.player.reset();
        this.cdList = [];
        for(var i = 0; i < this.update_objects.length; i++) {
            if(this.update_objects[i].chunk) {
                this.scene.remove(this.update_objects[i].chunk.mesh);
            }
        }
        this.update_objects = [];
        this.maps.init();
    };

    Main.prototype.onWindowResize = function() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );

    };

  //  Main.prototype.animate = function() {
  //      requestAnimationFrame( this.animate.bind(this) );
  //      this.render();
  //  };

    Main.prototype.addObject = function(obj) {
        this.update_objects.push(obj);
    };

    Main.prototype.addToCD = function(obj) {
        if(obj.owner == null || obj.owner == "") {
            var err =  new Error();
            console.log( err.stack);
        }
        if(obj != undefined) {
            this.cdList.push(obj);
        }
    };

    Main.prototype.spliceCDList = function (index) {
        var len = this.cdList.length;
        if (!len) { return; }
        while (index < len) {
            this.cdList[index] = this.cdList[index + 1];
            index++
        }
        this.cdList.length--;
    };

    Main.prototype.removeFromCD = function(obj) {
        for(var i = 0; i < this.cdList.length; i++) {
            // if(this.cdList[i] == null) { continue; }
            if(this.cdList[i] != undefined) {
                if(this.cdList[i].id == obj.id) {
                    //this.cdList.splice(i, 1);
                    this.spliceCDList(i);
                    //this.cdList[i].r ;
                    return;
                }
            }
        }
    };

    Main.prototype.render = function() {
        requestAnimationFrame( this.render.bind(this) );

        var time = (Date.now() - this.t_start)*0.001;
        //var time = Date.now() * 0.00005;
        var delta = this.clock.getDelta();

        // Update all objects
        for(var f in this.update_objects) {
            if(this.update_objects[f] == null) { continue; }
            if(this.update_objects[f].update) {
                this.update_objects[f].update(time, delta);
            } else {
                this.update_objects[f] = null;
            }
        }

        for(var f in this.objects) {
            this.objects[f].update(time, delta);
        }

        //this.controls.update(delta);

        this.stats.update();
        this.particles.update(time, delta);
        this.particles_box.update(time, delta);
        this.world.update(time, delta);
        this.maps.update(time, delta);
        this.renderer.render(this.scene, this.camera);
    };
}
