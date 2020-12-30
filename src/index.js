import * as THREE from 'three';
import { BoxGeometry, LogLuvEncoding, Vector3, VectorKeyframeTrack } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


let scene, renderer, camera, clock, controls; // main
let logo; // 3d assets
let videoMaterial;
let gui; // gui
let mixer; // animation 
let composer; // post-processing 

let env, videoTexture, cubeRenderTarget, cubeCamera; // reflections

const params = {
    color: '#000000',
    reflect: true,
    reflectionIntesity: 5.0,
    roughness: 0.0,
    fov: 50,
    rotateSpeed: 0.03,
};


function init() {

    setupDragDrop();
    SetupGUI();
    SetupScene();
    SetupControls();
    SetupVideoSphere()
    SetupLights();
    SetupReflections()
    // AddCube()
    // loadGLTF()
    SetupPost();
    loadOBJ()



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
        // logo.visible = false;
        cubeCamera.update(renderer, scene);
        logo.rotateY(-delta * params.rotateSpeed);
        // console.log("logo here");
        // logo.material.envMap = cubeCamera.renderTarget.texture;
        // logo.visible = true;
    }




    // renderer.render(scene, camera);
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
    var guiColor = gui.addColor(params, 'color');
    var guiReflect = gui.add(params, 'reflect');
    var guiRoughness = gui.add(params, 'roughness', 0, 1, 0.1);
    var guifov = gui.add(params, 'fov', 5, 200, 0.1);
    var guiReflectionIntesity = gui.add(params, 'reflectionIntesity', 0, 10, 0.1);
    var guiRotateSpeed = gui.add(params, 'rotateSpeed', -1, 1, 0.01);
    guiColor.onChange(function () {
        SetLogo();
    })
    guiReflect.onChange(function () {
        SetLogo();
    })
    guiRoughness.onChange(function () {
        SetLogo();
    })
    guiReflectionIntesity.onChange(function () {
        SetLogo();
    })

    guifov.onChange(function () {
        SetCamera();
    })
    gui.closed = true;
}


function SetupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("rgb(255, 255, 255)");
    camera = new THREE.PerspectiveCamera(params.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 35;

    camera.position.x = 0;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    clock = new THREE.Clock();
    window.addEventListener('resize', onWindowResize, false);
}

function SetCamera() {
    camera.fov = params.fov;
    camera.updateProjectionMatrix()
}

function SetupPost() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // const effect1 = new ShaderPass(DotScreenShader);
    // effect1.uniforms['scale'].value = 6;
    // composer.addPass(effect1);

    var effectFilm = new FilmPass(0.3, 0, 0, false);
    effectFilm.renderToScreen = true;
    composer.addPass(effectFilm);

    var fxaaPass = new ShaderPass(FXAAShader);
    composer.addPass(fxaaPass);
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
    // material.envMap = cubeRenderTarget.texture;
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = 10;
    scene.add(cube);
}

function SetupLights() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(directionalLight);
    scene.add(ambientLight);
}

function SetupVideoSphere() {
    const geometry = new THREE.SphereBufferGeometry(10, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(- 1, 1, 1);
    geometry.rotateY(90);
    const video = document.getElementById('video');
    video.play();

    videoTexture = new THREE.VideoTexture(video);
    env = videoTexture;
    videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

    const mesh = new THREE.Mesh(geometry, videoMaterial);
    scene.add(mesh);
}

function SetupReflections() {
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(528, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    cubeCamera = new THREE.CubeCamera(1, 100000, cubeRenderTarget);
    scene.add(cubeCamera);
}


function loadGLTF() {
    const loader = new GLTFLoader();

    loader.load('SR-logo.gltf', function (object) {

        logo = object.scene;

        mixer = new THREE.AnimationMixer(logo);
        object.animations.forEach((clip) => { mixer.clipAction(clip).play(); });
        // const action = mixer.clipAction(object.animations[0]);
        // action.play();

        logo.scale.set(0.01, 0.01, 0.01);
        logo.position.set(1.5, 0, 0);
        SetLogo();
        scene.add(logo);

    }, undefined, function (error) {

        console.error(error);

    });
}

function loadOBJ() {
    const loader = new OBJLoader();

    loader.load('SR-logo.obj',
        function (object) {
            logo = object;
            logo.scale.set(0.01, 0.01, 0.01);
            logo.position.set(1.5, 0, 0);
            SetLogo();
            scene.add(logo);
            console.log("loaded");
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (err) {
            console.log("An error happened " + err)
        }

    )
}

function SetLogo() {
    const material = new THREE.MeshStandardMaterial({ metalic: 1, color: params.color, roughness: params.roughness });

    if (params.reflect) {
        material.envMap = cubeRenderTarget.texture;
        material.envMapIntensity = params.reflectionIntesity;
    } else {
        material.envMap = null;
    }

    for (var i = 0; i < logo.children.length; i++) {
        logo.children[i].material = material;
    }
}




function setupDragDrop() {

    const dropzone = document.getElementById('main')
    dropzone.addEventListener('dragover', event => event.preventDefault())
    dropzone.addEventListener('drop', event => {
        event.preventDefault()
        const droppedFile = event.dataTransfer.files[0]
        const video = document.getElementById('video')
        video.addEventListener('loadedmetadata', event => {
            console.log(video.videoWidth, video.videoHeight)
        })
        video.src = URL.createObjectURL(droppedFile)
        video.play();
    })

    // const holder = document.getElementById('drop');

    // holder.ondragover = function () {

    //     return false;
    // };

    // holder.ondragend = function () {

    //     return false;
    // };

    // holder.ondrop = function (e) {

    //     e.preventDefault();

    //     var file = e.dataTransfer.files[0];
    //     var reader = new window.FileReader();
    //     reader.onload = function (event) {
    //         // holder.style.background =
    //         //     'url(' + event.target.result + ') no-repeat center';

    //         // var image = document.createElement('img');
    //         const video = document.getElementById('video');
    //         var sources = video.getElementsByTagName('source');
    //         console.log(event);
    //         sources[0].src = event.target.result;

    //         videoTexture = new THREE.VideoTexture(video);
    //         env = videoTexture;
    //         videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
    //         videoTexture.needsUpdate = true;
    //         console.log("video dropped");

    //         // scene.getObjectByName('cube').material.map = texture;
    //     };
    //     reader.readAsDataURL(file);
    //     return false;
    // }
}