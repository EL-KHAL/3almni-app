import gsap from 'https://cdn.skypack.dev/gsap'
import ScrollTrigger from 'https://cdn.skypack.dev/gsap/ScrollTrigger'
import Draggable from 'https://cdn.skypack.dev/gsap/Draggable'

let iteration = 0
const TRIGGER = ScrollTrigger.create({
  start: 0,
  end: '+=2000',
  horizontal: false,
  pin: '.boxes',
  onUpdate: self => {
    const SCROLL = self.scroll()
    if (SCROLL > self.end - 1) {
      // Go forwards in time
      WRAP(1, 1)
    } else if (SCROLL < 1 && self.direction < 0) {
      // Go backwards in time
      WRAP(-1, self.end - 1)
    } else {
      const NEW_POS = (iteration + self.progress) * LOOP_HEAD.duration()
      SCRUB.vars.position = NEW_POS
      SCRUB.invalidate().restart()
    }
  },
})

const WRAP = (iterationDelta, scrollTo) => {
  iteration += iterationDelta
  TRIGGER.scroll(scrollTo)
  TRIGGER.update()
}

const SNAP = gsap.utils.snap(1 / BOXES.length)

const progressToScroll = progress =>
  gsap.utils.clamp(
    1,
    TRIGGER.end - 1,
    gsap.utils.wrap(0, 1, progress) * TRIGGER.end
  )

const scrollToPosition = position => {
  const SNAP_POS = SNAP(position)
  const PROGRESS =
    (SNAP_POS - LOOP_HEAD.duration() * iteration) / LOOP_HEAD.duration()
  const SCROLL = progressToScroll(PROGRESS)
  if (PROGRESS >= 1 || PROGRESS < 0) return WRAP(Math.floor(PROGRESS), SCROLL)
  TRIGGER.scroll(SCROLL)
}

ScrollTrigger.addEventListener('scrollEnd', () =>
  scrollToPosition(SCRUB.vars.position)
)

const NEXT = () => scrollToPosition(SCRUB.vars.position - 1 / BOXES.length)
const PREV = () => scrollToPosition(SCRUB.vars.position + 1 / BOXES.length)

document.addEventListener('keydown', event => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') NEXT()
  if (event.code === 'ArrowRight' || event.code === 'KeyD') PREV()
})

document.querySelector('.boxes').addEventListener('click', e => {
  const BOX = e.target.closest('.box')
  if (BOX) {
    let TARGET = BOXES.indexOf(BOX)
    let CURRENT = gsap.utils.wrap(
      0,
      BOXES.length,
      Math.floor(BOXES.length * SCRUB.vars.position)
    )
    let BUMP = TARGET - CURRENT
    if (TARGET > CURRENT && TARGET - CURRENT > BOXES.length * 0.5) {
      BUMP = (BOXES.length - BUMP) * -1
    }
    if (CURRENT > TARGET && CURRENT - TARGET > BOXES.length * 0.5) {
      BUMP = BOXES.length + BUMP
    }
    scrollToPosition(SCRUB.vars.position + BUMP * (1 / BOXES.length))
  }
})

window.BOXES = BOXES

document.querySelector('.next').addEventListener('click', NEXT)
document.querySelector('.prev').addEventListener('click', PREV)

gsap.set('.box', { display: 'block' })

gsap.set('button', {
  z: 200,
})

Draggable.create('.drag-proxy', {
  type: 'x',
  trigger: '.box',
  onPress() {
    this.startOffset = SCRUB.vars.position
  },
  onDrag() {
    SCRUB.vars.position = this.startOffset + (this.startX - this.x) * 0.001
    SCRUB.invalidate().restart() // same thing as we do in the ScrollTrigger's onUpdate
  },
  onDragEnd() {
    scrollToPosition(SCRUB.vars.position)
  },
})


import * as THREE from "https://cdn.skypack.dev/three@0.135.0";

import { gsap } from "https://cdn.skypack.dev/gsap@3.8.0";

class World {
  constructor({
    canvas,
    width,
    height,
    cameraPosition,
    fieldOfView = 75,
    nearPlane = 0.1,
    farPlane = 100
  }) {
    this.parameters = {
      count: 1500,
      max: 12.5 * Math.PI,
      a: 2,
      c: 4.5
    };
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#00101a");
    this.clock = new THREE.Clock();
    this.data = 0;
    this.time = { current: 0, t0: 0, t1: 0, t: 0, frequency: 0.0005 };
    this.angle = { x: 0, z: 0 };
    this.width = width || window.innerWidth;
    this.height = height || window.innerHeight;
    this.aspectRatio = this.width / this.height;
    this.fieldOfView = fieldOfView;
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      this.aspectRatio,
      nearPlane,
      farPlane
    );
    this.camera.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );
    this.scene.add(this.camera);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      powerPreference: "high-performance",
      antialias: false,
      stencil: false,
      depth: false
    });
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.timer = 0;
    this.addToScene();
    this.addButton();

    this.render();
    // this.postProcessing();
    this.listenToResize();
  }
  start() {}
  render() {
    this.renderer.render(this.scene, this.camera);
    this.composer && this.composer.render();
  }
  loop() {
    this.time.elapsed = this.clock.getElapsedTime();
    this.time.delta = Math.min(
      60,
      (this.time.current - this.time.elapsed) * 1000
    );
    if (this.analyser && this.isRunning) {
      this.time.t = this.time.elapsed - this.time.t0 + this.time.t1;
      this.data = this.analyser.getAverageFrequency();
      this.data *= this.data / 2000;
      this.angle.x += this.time.delta * 0.001 * 0.63;
      this.angle.z += this.time.delta * 0.001 * 0.39;
      const justFinished = this.isRunning && !this.sound.isPlaying;
      if (justFinished) {
        this.time.t1 = this.time.t;
        this.audioBtn.textContent = "Play again";
        this.audioBtn.disabled = false;
        this.isRunning = false;
        const tl = gsap.timeline();
        this.angle.x = 0;
        this.angle.z = 0;
        tl.to(this.camera.position, {
          x: 0,
          z: 4.5,
          duration: 4,
          ease: "expo.in"
        });
        tl.to(this.audioBtn, {
          opacity: () => 1,
          duration: 1,
          ease: "power1.out"
        });
      } else {
        this.camera.position.x = Math.sin(this.angle.x) * this.parameters.a;
        this.camera.position.z = Math.min(
          Math.max(Math.cos(this.angle.z) * this.parameters.c, -4.5),
          4.5
        );
      }
    }
    this.camera.lookAt(this.scene.position);
    this.spiralMaterial.uniforms.uTime.value +=
      this.time.delta * this.time.frequency * (1 + this.data * 0.2);
    this.extMaterial.uniforms.uTime.value +=
      this.time.delta * this.time.frequency;
    //this.mesh.rotation.y += 0.0001 * this.time.delta * data
    for (const octa of this.octas.children) {
      octa.rotation.y += this.data
        ? (0.001 * this.time.delta * this.data) / 5
        : 0.001 * this.time.delta;
    }
    this.octas.rotation.y -= 0.0002 * this.time.delta;
    this.externalSphere.rotation.y += 0.0001 * this.time.delta;
    this.render();

    this.time.current = this.time.elapsed;
    requestAnimationFrame(this.loop.bind(this));
  }
  listenToResize() {
    window.addEventListener("resize", () => {
      // Update sizes
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      // Update camera
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();

      // Update renderer
      this.renderer.setSize(this.width, this.height);
      this.composer.setSize(this.width, this.height);
    });
  }
  addSpiral() {
    this.spiralMaterial = new THREE.ShaderMaterial({
      vertexShader: document.getElementById("vertexShader").textContent,
      fragmentShader: document.getElementById("fragmentShader").textContent,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 0.045 }
      },
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const count = this.parameters.count; //2000
    const scales = new Float32Array(count * 1);
    const colors = new Float32Array(count * 3);
    const phis = new Float32Array(count);
    const randoms = new Float32Array(count);
    const randoms1 = new Float32Array(count);
    const colorChoices = ["pink", "green", "cyan", "wheat", "red"];

    const squareGeometry = new THREE.PlaneGeometry(1, 1);
    this.instancedGeometry = new THREE.InstancedBufferGeometry();
    Object.keys(squareGeometry.attributes).forEach((attr) => {
      this.instancedGeometry.attributes[attr] = squareGeometry.attributes[attr];
    });
    this.instancedGeometry.index = squareGeometry.index;
    this.instancedGeometry.maxInstancedCount = count;

    for (let i = 0; i < count; i++) {
      const i3 = 3 * i;
      const colorIndex = Math.floor(Math.random() * colorChoices.length);
      const color = new THREE.Color(colorChoices[colorIndex]);
      phis[i] = Math.random() * this.parameters.max;
      randoms[i] = Math.random();
      scales[i] = Math.random();
      colors[i3 + 0] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    this.instancedGeometry.setAttribute(
      "phi",
      new THREE.InstancedBufferAttribute(phis, 1, false)
    );
    this.instancedGeometry.setAttribute(
      "random",
      new THREE.InstancedBufferAttribute(randoms, 1, false)
    );
    this.instancedGeometry.setAttribute(
      "aScale",
      new THREE.InstancedBufferAttribute(scales, 1, false)
    );
    this.instancedGeometry.setAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(colors, 3, false)
    );
    this.spiral = new THREE.Mesh(this.instancedGeometry, this.spiralMaterial);

    this.scene.add(this.spiral);
  }

  addExternalSphere() {
    this.extMaterial = new THREE.ShaderMaterial({
      vertexShader: document.getElementById("vertexShaderExt").textContent,
      fragmentShader: document.getElementById("fragmentShaderExt").textContent,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("orange") }
      },
      wireframe: true,
      transparent: true
    });
    const geometry = new THREE.SphereGeometry(6, 128, 128);
    this.externalSphere = new THREE.Mesh(geometry, this.extMaterial);
    this.scene.add(this.externalSphere);
  }
  addOctahedron({ color = "white", scale, position = [0, 0, 0] }) {
    const octa = new THREE.Mesh(
      this.octaGeometry,
      new THREE.MeshBasicMaterial({
        wireframe: true,
        color
      })
    );
    octa.scale.set(...scale);
    octa.position.set(...position);
    this.octas.add(octa);
  }
  addOctahedrons() {
    this.octas = new THREE.Group();
    this.octaGeometry = new THREE.OctahedronGeometry(0.2, 0);
    this.addOctahedron({ color: "red", scale: [1, 1.4, 1] });
    this.addOctahedron({
      color: "tomato",
      position: [0, 0.85, 0],
      scale: [0.5, 0.7, 0.5]
    });

    this.addOctahedron({
      color: "red",
      position: [1, -0.75, 0],
      scale: [0.5, 0.7, 0.5]
    });
    this.addOctahedron({
      color: "tomato",
      position: [-0.75, -1.75, 0],
      scale: [1, 1.2, 1]
    });
    this.addOctahedron({
      color: "red",
      position: [0.5, -1.2, 0.5],
      scale: [0.25, 0.37, 0.25]
    });
    this.scene.add(this.octas);
  }
  addToScene() {
    this.addSpiral();
    this.addExternalSphere();
    this.addOctahedrons();
  }
  addButton() {
    this.audioBtn = document.querySelector("button");
    this.audioBtn.addEventListener("click", () => {
      this.audioBtn.disabled = true;
      if (this.analyser) {
        this.sound.play();
        this.time.t0 = this.time.elapsed;
        this.data = 0;
        this.isRunning = true;
        gsap.to(this.audioBtn, {
          opacity: 0,
          duration: 1,
          ease: "power1.out"
        });
      } else {
        this.audioBtn.textContent = "Loading...";
        this.loadMusic().then(() => {
          console.log("music loaded");
        });
      }
    });
  }

  loadMusic() {
    return new Promise((resolve) => {
      const listener = new THREE.AudioListener();
      this.camera.add(listener);
      // create a global audio source
      this.sound = new THREE.Audio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(
        (buffer) => {
          this.sound.setBuffer(buffer);
          this.sound.setLoop(false);
          this.sound.setVolume(0.5);
          this.sound.play();
          this.analyser = new THREE.AudioAnalyser(this.sound, 32);
          // get the average frequency of the sound
          const data = this.analyser.getAverageFrequency();
          this.isRunning = true;
          this.t0 = this.time.elapsed;
          resolve(data);
        },
        (progress) => {
          gsap.to(this.audioBtn, {
            opacity: () => 1 - progress.loaded / progress.total,
            duration: 1,
            ease: "power1.out"
          });
        },

        (error) => {
          console.log(error);
        }
      );
    });
  }

}

const world = new World({
  canvas: document.querySelector("canvas.webgl"),
  cameraPosition: { x: 0, y: 0, z: 4.5 }
});

world.loop();


num = this.texts.length
for (let i = 0; i < num; i++) {
  const bounds = this.texts[i].getBoundingClientRect()

  this.planesTextsBounds[i] = {
    x: bounds.x,
    y: bounds.y + (window.scrollY || window.pageYOffset),
    width: bounds.width,
    height: bounds.height
  }
}
}

setElementsStyle() {
// Images
let num = this.images.length
for (let i = 0; i < num; i++) {
  this.planesImg[i].scaling.x = this.images[i].clientWidth
  this.planesImg[i].scaling.y = this.images[i].clientHeight
}

// Texts
num = this.texts.length
for (let i = 0; i < num; i++) {
  this.setTextStyle({ plane: this.planesTexts[i], index: i })
}
}

setElementsPosition() {
// Images
let num = this.images.length
for (let i = 0; i < num; i++) {
  this.planesImg[i].position.y = -this.planesImgBounds[i].height / 2 + this.canvas.clientHeight / 2 - this.planesImgBounds[i].y + (window.scrollY || window.pageYOffset)
  this.planesImg[i].position.x = this.planesImgBounds[i].width / 2 - this.canvas.clientWidth / 2 + this.planesImgBounds[i].x
}

// Texts
num = this.texts.length
for (let i = 0; i < num; i++) {
  this.planesTexts[i].top = this.planesTextsBounds[i].height / 2 - this.canvas.clientHeight / 2 + this.planesTextsBounds[i].y - (window.scrollY || window.pageYOffset)
  this.planesTexts[i].left = this.planesTextsBounds[i].width / 2 - this.canvas.clientWidth / 2 + this.planesTextsBounds[i].x
}
}

setTextStyle({ plane, index }) {
const style = getComputedStyle(this.texts[index])

plane.fontSize = style.fontSize
plane.fontFamily = style.fontFamily
plane.fontWeight = style.fontWeight
plane.resizeToFit = true
plane.textWrapping = true
plane.widthInPixels = this.texts[index].clientWidth
plane.heightInPixels = this.texts[index].clientHeight

// Text alignment and positioning
switch (style.textAlign) {
  case 'left':
  case 'start':
    plane.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    plane.leftInPixels = this.texts[index].clientWidth / 2
    break
  case 'right':
    plane.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
    plane.rightInPixels = -this.texts[index].clientWidth / 2
    break
  case 'center':
    plane.textHorizontalAlignment = BABYLON.GUI.TextBlock._HORIZONTAL_ALIGNMENT_CENTER
    break
}
}

animateDispFactor({ target, to }) {
const prop = { value: target.material._floats.dispFactor }

TweenMax.fromTo(prop, 0.6,
  {
    value: target.material._floats.dispFactor
  },
  {
  value: to,
  onUpdate: () => {
    target.material.setFloat('dispFactor', prop.value)
  }
})
}

animateInDispFactor(e) {
this.activeImageIndex = this.images.indexOf(e.target)
this.animateDispFactor({ target: this.planesImg[this.activeImageIndex], to: 1 })
}

animateOutDispFactor() {
this.animateDispFactor({ target: this.planesImg[this.activeImageIndex], to: 0 })
}

animateFisheye({ value }) {
TweenMax.to(this.fisheyeDistortion, 0.5, { value: value * 0.007 })
}

addListeners() {
const numImages = this.images.length
for (let i = 0; i < numImages; i++) {
  this.images[i].addEventListener('pointerenter', this.animateInDispFactorCallback, { passive: true })
  this.images[i].addEventListener('pointerleave', this.animateOutDispFactorCallback, { passive: true })
}
}

removeListeners() {
const numImages = this.images.length
for (let i = 0; i < numImages; i++) {
  this.images[i].removeEventListener('pointerenter', this.animateInDispFactorCallback, { passive: true })
  this.images[i].removeEventListener('pointerleave', this.animateOutDispFactorCallback, { passive: true })
}
}

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    gobalLight, shadowLight, backLight,
    renderer,
    container,
    controls;

var HEIGHT, WIDTH, windowHalfX, windowHalfY,
    mousePos = { x: 0, y: 0 },
    oldMousePos = {x:0, y:0},
    ballWallDepth = 28;



var hero;


function initScreenAnd3D() {
  
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = 1;
  farPlane = 2000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  camera.position.x = 0;
  camera.position.z = 300;
  camera.position.y = 250;
  camera.lookAt(new THREE.Vector3(0, 60, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMapEnabled = true;
  
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);
  
  window.addEventListener('resize', handleWindowResize, false);
  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);

}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  mousePos = {x:event.clientX, y:event.clientY};
} 

function handleTouchMove(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mousePos = {x:event.touches[0].pageX, y:event.touches[0].pageY};
  }
}

function createLights() {
  globalLight = new THREE.HemisphereLight(0xffffff, 0xffffff, .5)
  
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(200, 200, 200);
  shadowLight.castShadow = true;
  shadowLight.shadowDarkness = .2;
  shadowLight.shadowMapWidth = shadowLight.shadowMapHeight = 2048;
  
  backLight = new THREE.DirectionalLight(0xffffff, .4);
  backLight.position.set(-100, 100, 100);
  backLight.castShadow = true;
  backLight.shadowDarkness = .1;
  backLight.shadowMapWidth = shadowLight.shadowMapHeight = 2048;
  
  scene.add(globalLight);
  scene.add(shadowLight);
  scene.add(backLight);
}

function createFloor(){ 
  floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000,1000), new THREE.MeshBasicMaterial({color: 0x6ecccc}));
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
}

function createHero() {
  hero = new Cat();
  scene.add(hero.threeGroup);
}

function createBall() {
  ball = new Ball();
  scene.add(ball.threeGroup);
}

// BALL RELATED CODE


var woolNodes = 10,
	woolSegLength = 2,
	gravity = -.8,
	accuracy =1;


Ball = function(){

	var redMat = new THREE.MeshLambertMaterial ({
	    color: 0x630d15, 
	    shading:THREE.FlatShading
	});

	var stringMat = new THREE.LineBasicMaterial({
    	color: 0x630d15,
    	linewidth: 3
	});

	this.threeGroup = new THREE.Group();
	this.ballRay = 8;

	this.verts = [];

	// string
	var stringGeom = new THREE.Geometry();

	for (var i=0; i< woolNodes; i++	){
		var v = new THREE.Vector3(0, -i*woolSegLength, 0);
		stringGeom.vertices.push(v);

		var woolV = new WoolVert();
		woolV.x = woolV.oldx = v.x;
		woolV.y = woolV.oldy = v.y;
		woolV.z = 0;
		woolV.fx = woolV.fy = 0;
		woolV.isRootNode = (i==0);
		woolV.vertex = v;
		if (i > 0) woolV.attach(this.verts[(i - 1)]);
		this.verts.push(woolV);
		
	}
  	this.string = new THREE.Line(stringGeom, stringMat);

  	// body
  	var bodyGeom = new THREE.SphereGeometry(this.ballRay, 5,4);
	this.body = new THREE.Mesh(bodyGeom, redMat);
  	this.body.position.y = -woolSegLength*woolNodes;

  	var wireGeom = new THREE.TorusGeometry( this.ballRay, .5, 3, 10, Math.PI*2 );
  	this.wire1 = new THREE.Mesh(wireGeom, redMat);
  	this.wire1.position.x = 1;
  	this.wire1.rotation.x = -Math.PI/4;

  	this.wire2 = this.wire1.clone();
  	this.wire2.position.y = 1;
  	this.wire2.position.x = -1;
  	this.wire1.rotation.x = -Math.PI/4 + .5;
  	this.wire1.rotation.y = -Math.PI/6;

  	this.wire3 = this.wire1.clone();
  	this.wire3.rotation.x = -Math.PI/2 + .3;

  	this.wire4 = this.wire1.clone();
  	this.wire4.position.x = -1;
  	this.wire4.rotation.x = -Math.PI/2 + .7;

  	this.wire5 = this.wire1.clone();
  	this.wire5.position.x = 2;
  	this.wire5.rotation.x = -Math.PI/2 + 1;

  	this.wire6 = this.wire1.clone();
  	this.wire6.position.x = 2;
  	this.wire6.position.z = 1;
  	this.wire6.rotation.x = 1;

  	this.wire7 = this.wire1.clone();
  	this.wire7.position.x = 1.5;
  	this.wire7.rotation.x = 1.1;

  	this.wire8 = this.wire1.clone();
  	this.wire8.position.x = 1;
  	this.wire8.rotation.x = 1.3;

  	this.wire9 = this.wire1.clone();
  	this.wire9.scale.set(1.2,1.1,1.1);
  	this.wire9.rotation.z = Math.PI/2;
  	this.wire9.rotation.y = Math.PI/2;
  	this.wire9.position.y = 1;
  	
  	this.body.add(this.wire1);
  	this.body.add(this.wire2);
  	this.body.add(this.wire3);
  	this.body.add(this.wire4);
  	this.body.add(this.wire5);
  	this.body.add(this.wire6);
  	this.body.add(this.wire7);
  	this.body.add(this.wire8);
  	this.body.add(this.wire9);

  	this.threeGroup.add(this.string);
	this.threeGroup.add(this.body);

	this.threeGroup.traverse( function ( object ) {
    if ( object instanceof THREE.Mesh ) {
      object.castShadow = true;
      object.receiveShadow = true;
    }});

}

WoolVert = function(){
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.oldx = 0;
	this.oldy = 0;
	this.fx = 0;
	this.fy = 0;
	this.isRootNode = false;
	this.constraints = [];
	this.vertex = null;
}


WoolVert.prototype.update = function(){
	var wind = 0;//.1+Math.random()*.5;
  	this.add_force(wind, gravity);

  	nx = this.x + ((this.x - this.oldx)*.9) + this.fx;
  	ny = this.y + ((this.y - this.oldy)*.9) + this.fy;
  	this.oldx = this.x;
  	this.oldy = this.y;
  	this.x = nx;
  	this.y = ny;

  	this.vertex.x = this.x;
  	this.vertex.y = this.y;
  	this.vertex.z = this.z;

  	this.fy = this.fx = 0
}

WoolVert.prototype.attach = function(point) {
  this.constraints.push(new Constraint(this, point));
};

WoolVert.prototype.add_force = function(x, y) {
  this.fx += x;
  this.fy += y;
};

Constraint = function(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
  this.length = woolSegLength;
};

Ball.prototype.update = function(posX, posY, posZ){
		
	var i = accuracy;
	
	while (i--) {
		
		var nodesCount = woolNodes;
		
		while (nodesCount--) {
		
			var v = this.verts[nodesCount];
			
			if (v.isRootNode) {
			    v.x = posX;
			    v.y = posY;
			    v.z = posZ;
			}
		
			else {
		
				var constraintsCount = v.constraints.length;
		  		
		  		while (constraintsCount--) {
		  			
		  			var c = v.constraints[constraintsCount];

		  			var diff_x = c.p1.x - c.p2.x,
					    diff_y = c.p1.y - c.p2.y,
					    dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y),
					    diff = (c.length - dist) / dist;

				  	var px = diff_x * diff * .5;
				  	var py = diff_y * diff * .5;

				  	c.p1.x += px;
				  	c.p1.y += py;
				  	c.p2.x -= px;
				  	c.p2.y -= py;
				  	c.p1.z = c.p2.z = posZ;
		  		}

		  		if (nodesCount == woolNodes-1){
		  			this.body.position.x = this.verts[nodesCount].x;
					this.body.position.y = this.verts[nodesCount].y;
					this.body.position.z = this.verts[nodesCount].z;

					this.body.rotation.z += (v.y <= this.ballRay)? (v.oldx-v.x)/10 : Math.min(Math.max( diff_x/2, -.1 ), .1);
		  		}
		  	}
		  	
		  	if (v.y < this.ballRay) {
		  		v.y = this.ballRay;
		  	}
		}
	}

	nodesCount = woolNodes;
	while (nodesCount--) this.verts[nodesCount].update();

	this.string.geometry.verticesNeedUpdate = true;

	
}

Ball.prototype.receivePower = function(tp){
	this.verts[woolNodes-1].add_force(tp.x, tp.y);
}

var t=0;

function loop(){
  render();
  
  t+=.05;
  hero.updateTail(t);

  var ballPos = getBallPos();
  ball.update(ballPos.x,ballPos.y, ballPos.z);
  ball.receivePower(hero.transferPower);
  hero.interactWithBall(ball.body.position);

  requestAnimationFrame(loop);
}


function getBallPos(){
  var vector = new THREE.Vector3();

  vector.set(
      ( mousePos.x / window.innerWidth ) * 2 - 1, 
      - ( mousePos.y / window.innerHeight ) * 2 + 1,
      0.1 );

  vector.unproject( camera );
  var dir = vector.sub( camera.position ).normalize();
  var distance = (ballWallDepth - camera.position.z) / dir.z;
  var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
  return pos;
}

function render(){
  if (controls) controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('load', init, false);

function init(event){
  initScreenAnd3D();
  createLights();
  createFloor()
  createHero();
  createBall();
  loop();
}
$(function(){

	var scene = new THREE.Scene();

	var aspect = window.innerWidth / window.innerHeight;
	var d = 2;
	camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );
	//var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

	camera.position.set( 4, 3, 3); // all components equal
	camera.lookAt( scene.position ); // or the origin

	// var axis = new THREE.AxisHelper(10);
	// scene.add(axis);

	var renderer = new THREE.WebGLRenderer({antialias: false});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setClearColor(0x141A35);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;

	var loader = new THREE.JSONLoader();
	loader.load('https://aperesso.github.io/low_poly_room/room.json', handle_load);
	function handle_load(geometry,materials) {
		var obj = new THREE.Mesh(
			geometry,
			materials
		);
		obj.receiveShadow = true;
		obj.castShadow = true;
		scene.add(obj);
	}

	var screen = new THREE.Mesh(
		new THREE.PlaneGeometry(.31,.25,.85),
		new THREE.MeshStandardMaterial({emissive: 0x141A35})
	);
	screen.position.set(1.8,.84,1.32);
	scene.add(screen);

	var snow = [];
	var nb = 35;

	for (var i = 0; i < nb ; i++) {
		var particle = new Snow();
		particle.init();
		particle.modelize();
		snow.push(particle);
	}



	light();

	function light() {

		var spotlight = new THREE.SpotLight(0xF5FC5A);
		spotlight.position.set(1.75, 4, -3);
		spotlight.castShadow = true;
		spotlight.intensity = .2;
		scene.add(spotlight);

		var dirlight = new THREE.DirectionalLight(0xfdd8ff);
		dirlight.position.set(-.96,3,-.75);
		//dirlight.castShadow = true;
		dirlight.intensity = .2;
		scene.add(dirlight);

		var ambi = new THREE.AmbientLight(0x0e1642);
		scene.add(ambi);

		var pointlight = new THREE.PointLight();
		pointlight.position.set(.63,.72,.71);
		//pointlight.castShadow = true;
		pointlight.intensity = .2;
		scene.add(pointlight);
	}

	function update() {
		for (var i = 0; i < nb; i++) {
			snow[i].update();
		}

		renderer.render(scene,camera);
		requestAnimationFrame(update);
	}


	function Snow() {
		this.position = new THREE.Vector3();
		this.vel = new THREE.Vector3(-1 * (0.0005 + Math.random() * 0.001),-1 * (0.005 + Math.random() * 0.01), -.1 * (0.005 + Math.random() * 0.01));

		this.init = function() {
			this.position.x = Math.random() * 2.85;
			this.position.y = 2.6;
			this.position.z = -2.47 + Math.random() * 2;
		}

		this.modelize = function() {
			this.mesh = new THREE.Mesh(
				new THREE.DodecahedronGeometry(1),
				new THREE.MeshPhongMaterial({
					color: 0xfafafa
				})
			);
			this.mesh.position.copy(this.position);
			this.mesh.scale.set(0.02,0.02,0.02);
			this.mesh.castShadow = true;
			this.mesh.receiveShadow = true;
			scene.add(this.mesh);
		}

		this.update = function() {
			if (this.position.y < 0)
				this.position.y = 2.6;
			if (this.position.x < 0 || this.position.x > 2.85)
					this.vel.x *= -1;
			if (this.position.z < -2.47 || this.position.z > -.47)
					this.vel.z *= -1;
			this.position.add(this.vel);
			this.mesh.position.copy(this.position);
		}
	}

	$('#webGL-container').append(renderer.domElement);
	renderer.render(scene, camera);

	update();
})
    // globals
    var renderer, scene, camera;

    var polyhedron, polyGeometry, polyMaterial, polyVertsOrig;

    var pointA, pointB, pointC;
    var t = 0.0;
    var radius = 10;
    var dirLightLIntensity, dirLightRIntensity;

   // var spotLight;

    function init() {

        // create scene
        scene = new THREE.Scene();

        // create camera
        var cameraX = 0;
        var cameraY = 0;
        var cameraZ = 80;

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 300);
        camera.position.x = cameraX;
        camera.position.y = cameraY;
        camera.position.z = cameraZ;
       
        

        // lights
        var pointAColor = "#FFA600";
        pointA = new THREE.PointLight( pointAColor, 2, 50);
        //pointA.position.set( -2, 2, 2 );
        scene.add( pointA); 
       scene.add(new THREE.PointLightHelper(pointA, 0.25));


        var pointBColor = "#35FA85";
        pointB = new THREE.PointLight( pointBColor, 2, 50);
        //pointA.position.set( -2, 2, 2 );
        scene.add( pointB); 
    scene.add(new THREE.PointLightHelper(pointB, 0.25));


        var pointCColor = "#8635FA";
        pointC = new THREE.PointLight( pointCColor, 3, 30);
        //pointA.position.set( -2, 2, 2 );
        scene.add( pointC); 
        scene.add(new THREE.PointLightHelper(pointC, 0.25));

        var dirLightL = new THREE.DirectionalLight(0xffffff, 0.1);
        dirLightL.position.set(2, 0, 0);
       scene.add(dirLightL);

        var dirLightR = new THREE.DirectionalLight(0xffffff, 0.1);
        dirLightR.position.set(-2, 0, 0);
       scene.add(dirLightR);


        // create renderer
        renderer = new THREE.WebGLRenderer();
        var clearColor = "#ff6600";
        renderer.setClearColor(clearColor, 1.0);
        renderer.setSize(window.innerWidth, window.innerHeight);

        // add axes
        var axes = new THREE.AxisHelper(20);
        //scene.add(axes);

        // add polyhedron
        polyGeometry = new THREE.IcosahedronGeometry(50, 2);
       // polyVertsOrig = polyGeometry.clone().vertices;
        //polyMaterial =  new THREE.MeshPhongMaterial( { color: 0xe1e1e1, specular: 0x555555, shininess: 10 } );
        polyMaterial =  new THREE.MeshPhongMaterial({
            color: 0x8635FA, //0xfb3550,
            shading: THREE.FlatShading,
            side: THREE.BackSide
        });

        polyhedron = new THREE.Mesh(polyGeometry, polyMaterial);
        polyhedron.position.set(0,0,0);
        // add it to the scene.

        polyhedron.castShadow = true;
       //scene.add(polyhedron);


         var torusGeometry = new THREE.TorusGeometry(50, 25, 30, 40, Math.PI * 2);

         var torusMaterial =  new THREE.MeshPhongMaterial({
            color: 0x8635FA, //0xfb3550,
            shading: THREE.FlatShading,
            side: THREE.BackSide
        });
         var torus       = new THREE.Mesh(torusGeometry, torusMaterial);
        torus.castShadow = true;
         torus.rotation.x = Math.PI/2;
        // add the sphere to the scene
        scene.add(torus);
        // controls
        var controls = new function () {
           this.cameraX = cameraX;           
           this.cameraY = cameraY;
           this.cameraZ = cameraZ;
           this.followCam = false;
        };

        var gui = new dat.GUI();


       gui.add(controls, 'followCam').onChange(function (e) {


            switch(e) {
                case true:
                controls.cameraZ = 60;
                break;
                default:
                controls.cameraZ = 80;
            }
        });


        render();

        function render() {
            
            // camera
            cameraX = controls.cameraX;            
            cameraY = controls.cameraY;
            cameraZ = controls.cameraZ;

            camera.position.x = cameraX;
            camera.position.y = cameraY;
            camera.position.z = cameraZ;


            // camera follow
             if (controls.followCam) {
                camera.lookAt(pointA.position);
            } else {
                camera.lookAt(scene.position);
            }

            // dirlights osc intensity
            dirLightL.intensity = Math.map(Math.sin(t/ Math.PI), -1, 1, 0.1, 0.25);
            dirLightR.intensity = Math.map(Math.cos(t / Math.PI), -1, 1, 0.1, 0.25);

            // move pointlights 
            pointA.position.x = Math.sin( t * 0.1 ) * 45;
            pointA.position.y = Math.cos( t * 0.1 ) * 12;
            pointA.position.z = Math.cos( t * 0.1 ) * 45;

            pointB.position.x = Math.sin( t * 0.2 ) * 45;
            pointB.position.y = Math.cos( t * 0.2 ) * 1;
            pointB.position.z = Math.cos( t * 0.2 ) * 45;

            pointC.position.x = Math.sin( t * 0.3 ) * 45;
            pointC.position.y = Math.cos( t * 0.3 ) * 5;
            pointC.position.z = Math.cos( t * 0.3 ) * 45;

            // spin poly
            polyhedron.rotation.x += 0.001;
            polyhedron.rotation.y += 0.001;

             // render using requestAnimationFrame
            requestAnimationFrame(render);
            renderer.render(scene, camera);

            t += 0.1;

        } // render


        document.getElementById("WebGL-output").appendChild(renderer.domElement);
        renderer.render(scene, camera);


    } 

        function randomRange(bottom, top) {
                return Math.floor( Math.random() * ( 1 + top - bottom ) ) + bottom;           
        }
        Math.map = function (value, istart, istop, ostart, ostop) {
            return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
        }

        Math.lerp = function(start, stop, amt) {
            return start + (stop-start) * amt;
        }

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        window.addEventListener('resize', onResize, false);


    window.onload = init;

