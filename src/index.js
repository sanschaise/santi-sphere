import * as THREE from "three";
import {
  BoxGeometry,
  LogLuvEncoding,
  Vector3,
  VectorKeyframeTrack,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { DotScreenShader } from "three/examples/jsm/shaders/DotScreenShader.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";

let scene, renderer, camera, clock, controls; // main
let logo; // 3d assets
let videoMaterial;
let gui; // gui
let mixer; // animation
let composer, effectFilm; // post-processing

//raycasting
const pointer = new THREE.Vector2();
let raycaster;
let INTERSECTED;

const group = new THREE.Group();

let env, videoTexture, cubeRenderTarget, cubeCamera; // reflections

<<<<<<< HEAD
let objpath = "TelfarOBJ.obj";
let objScale = 0.7;
let objPos = {
  x: 0,
  y: 0,
  z: 0,
};
let videoPath = "videos/ALLVIDEOS_R1.mp4";
let videos = ["Edge 2 Edge.mp4"];
=======
let objpath = "SR-logo.obj";
let videoPath = "videos/GranTeton_BlurTest_B.mp4";
let videos = [
  "3609.mp4",
  "SequoiaBlurrTest_B.mp4",
  "Edge 2 Edge.mp4",
  "GranTeton_BlurTest_B.mp4",
];
>>>>>>> parent of c43c97b (telfar branch)

const params = {
  color: "#ffffff",
  reflect: true,
  reflectionIntesity: 1.0,
  roughness: 0.0,
  metalic: 1.0,
  fov: 50,
  rotateSpeed: 0.0,
  post: true,
  grain: 0.3,
  filmLines: 25,
  sphere: true,
};

function init() {
  setupDragDrop();
  //   SetupGUI();
  SetupScene();
  SetupControls();
  SetupVideoSphere();
  SetupLights();
  SetupReflections();
  SetupLink();
  SetupPost();
  SetupRayCaster();
  if (params.sphere) {
    AddSphere();
  } else {
    loadOBJ(objpath);
  }
}

const animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();
  controls.update();
  videoTexture.update();
  if (mixer) mixer.update(delta);

  //reflections
  if (logo) {
    cubeCamera.update(renderer, scene);
    logo.rotateY(-delta * params.rotateSpeed);
  }
  RunRayCaster();
  composer.render(delta);
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();

// other functions

function SetupGUI() {
  gui = new GUI();
  var guiColor = gui.addColor(params, "color");
  var guiReflect = gui.add(params, "reflect");
  var guiRoughness = gui.add(params, "roughness", 0, 1, 0.1);
  var guiMetalic = gui.add(params, "metalic", 0, 1, 0.1);
  var guifov = gui.add(params, "fov", 5, 200, 0.1);
  var guiReflectionIntesity = gui.add(params, "reflectionIntesity", 0, 10, 0.1);
  var guiRotateSpeed = gui.add(params, "rotateSpeed", -1, 1, 0.01);
  var guiPost = gui.add(params, "post");
  var guiGrain = gui.add(params, "grain", 0, 1, 0.1);
  var guiFilmLines = gui.add(params, "filmLines", 0, 555, 1);
  var guiSphere = gui.add(params, "sphere");

  guiSphere.onChange(function () {
    if (params.sphere) {
      AddSphere();
    } else {
      loadGLTF(objpath);
    }
  });
  guiColor.onChange(function () {
    SetLogo();
  });
  guiReflect.onChange(function () {
    SetLogo();
  });
  guiRoughness.onChange(function () {
    SetLogo();
  });
  guiMetalic.onChange(function () {
    SetLogo();
  });
  guiReflectionIntesity.onChange(function () {
    SetLogo();
  });

  guifov.onChange(function () {
    SetCamera();
  });

  guiGrain.onChange(function () {
    SetupPost();
  });
  guiPost.onChange(function () {
    SetupPost();
  });
  guiFilmLines.onChange(function () {
    SetupPost();
  });
  gui.closed = true;
}

function SetupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(255, 255, 255)");
  camera = new THREE.PerspectiveCamera(
    params.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 35;

  camera.position.x = 0;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  clock = new THREE.Clock();
  window.addEventListener("resize", onWindowResize, false);
  scene.add(group);
}

function SetupRayCaster() {
  raycaster = new THREE.Raycaster();
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("click", onPointerClick);
}

function RunRayCaster() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(group.children);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        setScale(INTERSECTED, new Vector3(1, 1, 1));
      }

      INTERSECTED = intersects[0].object;

      let newScale = INTERSECTED.scale.addScalar(0.1);
      setScale(INTERSECTED, newScale);
    }
  } else {
    if (INTERSECTED) {
      setScale(INTERSECTED, new Vector3(1, 1, 1));
    }

    INTERSECTED = null;
  }
}

function setScale(object, scale) {
  object.scale.x = scale.x;
  object.scale.y = scale.y;
  object.scale.z = scale.z;
}

function SetCamera() {
  camera.fov = params.fov;
  camera.updateProjectionMatrix();
}

function SetupPost() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.reset();
  if (params.post) {
    var fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    fxaaPass.renderToScreen = true;
    composer.addPass(fxaaPass);

    effectFilm = new FilmPass(params.grain, 0.2, params.filmLines, false);
    effectFilm.renderToScreen = true;
    composer.addPass(effectFilm);
  }
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerClick(event) {
  console.log(INTERSECTED.userData.onClick());
}

function SetupLink() {
  const geometry = new THREE.BoxGeometry(5, 5, 1);
  //   const material = new THREE.MeshBasicMaterial({ color: params.color });
  const material = CreateEnvMaterial();
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = 10;

  cube.userData = {
    onClick: function () {
      ChangeVideo();
    },
  };
  group.add(cube);
}

function SetupVideo(path) {
  var video = document.getElementById("video");
  video.src = path;
}

function SetupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 200;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
}

function AddCube() {
  const geometry = new THREE.BoxGeometry(5, 5, 1);
  const material = new THREE.MeshBasicMaterial({ color: params.color });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = 10;
  group.add(cube);
}

function CreateEnvMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: params.color,
    roughness: params.roughness,
    metalness: params.metalic,
  });

  if (params.reflect) {
    material.envMap = cubeRenderTarget.texture;
    material.envMapIntensity = params.reflectionIntesity;
  } else {
    material.envgMap = null;
  }

  return material;
}

function AddSphere() {
  const geometry = new THREE.SphereGeometry(5, 255, 255);
  const material = CreateEnvMaterial();
  scene.remove(logo);
  logo = new THREE.Mesh(geometry, material);
  logo.userData = {
    onClick: function () {
      window.open("https://www.madeatartcamp.com/");
    },
  };

  group.add(logo);
}

function SetupLights() {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(directionalLight);
  scene.add(ambientLight);
}

function SetupVideoSphere() {
  const geometry = new THREE.SphereBufferGeometry(30, 60, 40);
  geometry.scale(-1, 1, 1);
  geometry.rotateY(90);
  const video = document.getElementById("video");
  video.play();

  videoTexture = new THREE.VideoTexture(video);
  env = videoTexture;
  videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

  const mesh = new THREE.Mesh(geometry, videoMaterial);
  scene.add(mesh);
}

function SetupReflections() {
  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1528, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  cubeCamera = new THREE.CubeCamera(1, 100000, cubeRenderTarget);
  scene.add(cubeCamera);
}

function loadGLTF(pathName) {
  const loader = new GLTFLoader();

  loader.load(
    pathName,
    function (object) {
      scene.remove(logo);
      logo = object.scene;

      mixer = new THREE.AnimationMixer(logo);
      object.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });

      logo.scale.set(8, 8, 8);
      logo.position.set(1.5, 0, 0);
      logo.rotateY(-90);
      SetLogo();
      scene.add(logo);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}

function loadOBJ(path) {
  const loader = new OBJLoader();

  loader.load(
    path,
    function (object) {
      scene.remove(logo);
      logo = object;
<<<<<<< HEAD
      logo.scale.set(objScale, objScale, objScale);
      logo.position.set(objPos.x, objPos.y, objPos.z);
=======
      logo.scale.set(0.01, 0.01, 0.01);
      logo.position.set(1.5, 0, 0);
>>>>>>> parent of c43c97b (telfar branch)
      SetLogo();
      scene.add(logo);
      console.log("loaded");
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (err) {
      console.log("An error happened " + err);
    }
  );
}

function SetLogo() {
  const material = CreateEnvMaterial();

  logo.traverse((o) => {
    if (o.isMesh) o.material = material;
  });
}

function setupDragDrop() {
  var video = document.getElementById("video");

  const dropzone = document.getElementById("main");
  dropzone.addEventListener("dragover", (event) => event.preventDefault());
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];

    video.addEventListener("loadedmetadata", (event) => {
      // console.log(video.videoWidth, video.videoHeight)
    });
    video.src = URL.createObjectURL(droppedFile);
    video.play();
  });

  const threedropzone = document.getElementById("objdrop");
  threedropzone.addEventListener("dragover", (event) => event.preventDefault());
  threedropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];

    console.log(droppedFile);

    let extension = droppedFile.name.split(".").pop();

    if (extension == "gltf" || extension == "glf") {
      loadGLTF(URL.createObjectURL(droppedFile));
    }
    if (extension == "obj") {
      loadOBJ(URL.createObjectURL(droppedFile));
    }

    video.play();
  });
}

let videoIndex = 0;
function ChangeVideo() {
  var video = document.getElementById("video");
  video.src = `videos/${videos[videoIndex]}`;
  videoIndex = (videoIndex + 1) % videos.length;
  video.play();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max + (min + 1)));
}

function randomFloat(min, max) {
  return Math.random() * (max + min);
}

function randomFromArray(array) {
  return array[randomInt(0, array.length - 1)];
}
