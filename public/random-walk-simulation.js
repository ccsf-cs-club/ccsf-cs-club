/**
 * Random Walk Simulation (Solar Photon) - Three.js
 *
 * This class implements the random walk simulation for a solar photon
 * that starts from the center of the sun and is randomly rambling until
 * it reaches the surface.
 *
 * Based the academic project of Drew Onken
 * http://www.opensourcephysics.org/items/detail.cfm?ID=11349
 *
 * @license GPLv3
 * @author Alex Tselegidis - Oct 2014
 * @requires three.js and OrbitControls.js
 */

var myRainbow = new Rainbow();

function RWS() {
  // members
  var inst = this;
  inst.scene;
  inst.camera;
  inst.controls;
  inst.renderer;
  inst.mesh;
  inst.simulation;

  // constants
  var ROTATION_SPEED = 0.01;
  var STAR_COUNT = 5000;
  var STAR_MIN_DISTANCE = 3000;
  var SUN_OPACITY = 8;
  var SUN_DENSITY = 1408;
  var SUN_RADIUS = 0.0075;
  var SPEED_OF_LIGHT = 2.99 * Math.pow(10, 8);
  var SCALE_FACTOR = 100000; //

  inst.initialize = function (autostart) {
    // initialize three.js
    inst.scene = new THREE.Scene();
    inst.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      12000,
    );
    inst.renderer = new THREE.WebGLRenderer();
    inst.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(inst.renderer.domElement);
    inst.camera.position.z = 1100;
    inst.controls = new THREE.OrbitControls(inst.camera);
    inst.controls.damping = 0.2;

    // initialize mesh and render
    inst.simulation = new Object();
    inst.simulation.isActive = true;
    inst.simulation.steps = 0;
    inst.simulation.startTime = new Date().getTime() / 1000;
    inst.simulation.l = 1 / (SUN_OPACITY * SUN_DENSITY);
    inst.initMesh();
    inst.bindEvents();
    inst.displayHint();
    if (autostart || typeof autostart == "undefined") inst.render();
  };

  /**
   * Initialize Mesh Objects
   */
  inst.initMesh = function () {
    inst.mesh = new Object();

    // sun
    var gSun = new THREE.SphereGeometry(SUN_RADIUS * SCALE_FACTOR, 26, 26);
    var mSun = new THREE.MeshBasicMaterial({
      color: 0xffff2e,
      wireframe: true,
      opacity: 0.1,
      transparent: true,
    });
    inst.mesh.sun = new THREE.Mesh(gSun, mSun);
    inst.scene.add(inst.mesh.sun);

    // photon
    var gPhoton = new THREE.SphereGeometry(5, 8, 6);
    var mPhoton = new THREE.MeshBasicMaterial({ color: 0x2e66ff });
    inst.mesh.photon = new THREE.Mesh(gPhoton, mPhoton);
    inst.scene.add(inst.mesh.photon);

    // random background stars
    for (var i = 0; i < STAR_COUNT; i++) {
      var gStar = new THREE.SphereGeometry(6, 8, 6);
      var mStar = new THREE.MeshBasicMaterial({ color: 0xffffff });
      var star = new THREE.Mesh(gStar, mStar);

      star.position.x = inst.rnd();
      star.position.y = inst.rnd();
      star.position.z = inst.rnd();

      // if the star is very close to the sun it will
      // not be added to the scene
      if (inst.calc3dDistance(star) >= STAR_MIN_DISTANCE) inst.scene.add(star);
    }
  };

  /**
   * Render Loop
   */
  inst.render = function () {
    requestAnimationFrame(inst.render);
    if (inst.simulation.isActive) inst.processSimulation();
    inst.renderer.render(inst.scene, inst.camera);
  };

  /**
   * Bind Simulation Events
   */
  inst.bindEvents = function () {
    // no specific events at the moment
  };

  /**
   * Process Simulation Frame
   *
   * This method proceeds one step of the simulation (60 steps will
   * make 1 second on scene).
   */
  inst.processSimulation = function () {
    inst.simulation.steps++;
    var oldVector = inst.getVector3(inst.mesh.photon); // get old position

    var pxl = inst.simulation.l * SCALE_FACTOR;
    var theta = 2 * Math.PI * Math.random();
    var phi = Math.PI - 2 * Math.PI * Math.random();
    inst.mesh.photon.position.x += pxl * Math.sin(phi) * Math.cos(theta);
    inst.mesh.photon.position.y += pxl * Math.sin(phi) * Math.sin(theta);
    inst.mesh.photon.position.z += pxl * Math.cos(phi);

    var newVector = inst.getVector3(inst.mesh.photon); // get new position
    inst.createLine(oldVector, newVector);

    dist = inst.calc3dDistance(inst.mesh.photon);
    if (dist > inst.mesh.sun.geometry.parameters.radius) {
      console.log("Simulation Ended"); // stop simulation and print data
      inst.simulation.isActive = false;
      inst.simulation.endTime = new Date().getTime() / 1000;
      inst.displayStats();
      // Wait 5 seconds and refresh the page
      setTimeout(function () {
        location.reload(1);
      }, 3000);
    }
  };

  /**
   * Genera Random Number For Star Positioning
   *
   * @return {Number}
   */
  inst.rnd = function () {
    return Math.floor(Math.random() * 10000 - 5000);
  };

  /**
   * Calculate 3D From Scene Center Point(0, 0, 0)
   *
   * @param {THREE.Mesh} mesh
   * @return {Number}
   */
  inst.calc3dDistance = function (mesh) {
    return Math.sqrt(
      Math.pow(mesh.position.x, 2) +
        Math.pow(mesh.position.y, 2) +
        Math.pow(mesh.position.z, 2),
    );
  };

  /**
   * Get a Vector3 Object From Mesh Position
   *
   * @param {THREE.Mesh} mesh
   */
  inst.getVector3 = function (mesh) {
    return new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
  };

  /**
   * Create new line in order to display for the
   * trajectory of the photon.
   *
   * @param {THREE.Vector3} oldVector
   * @param {THREE.Vector3} newVector
   */
  inst.createLine = function (oldVector, newVector) {
    var gLine = new THREE.Geometry();
    gLine.vertices.push(oldVector);
    gLine.vertices.push(newVector);
    var lineLevel = 100 - Math.abs(100 - ((inst.simulation.steps / 20) % 200));
    var lineColor = myRainbow.colourAt(lineLevel);
    lineColor = parseInt(`0x${lineColor}`, 16);
    var mLine = new THREE.LineBasicMaterial({
      color: lineColor,
      linewidth: 1,
      transparent: true,
      opacity: 0.9,
    });
    var line = new THREE.Line(gLine, mLine);
    inst.scene.add(line);
  };

  /**
   * Display Simulation Statistics
   *
   * This method is called when the photon reaces the surface
   * of the sun and it displays the simulation statistics (number
   * of steps, simulation time, photon real time in years etc ...)
   */
  inst.displayStats = function () {
    var html =
      "<strong>Simulation Results</strong><br>" +
      "Duration: " +
      Number(inst.simulation.endTime - inst.simulation.startTime).toFixed(2) +
      "s<br>" +
      "Total Steps: " +
      inst.simulation.steps +
      "<br>" +
      "Escape Time: " +
      Math.round(
        (48.32 * inst.simulation.steps * inst.simulation.l) /
          Math.pow(SUN_RADIUS, 2),
      ) +
      " Years";

    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.minWidth = "286px";
    div.style.top = "10px";
    div.style.left = "10px";
    div.style.padding = "20px";
    div.style.backgroundColor = "#FFF";
    div.style.font = "16px arial, helvetica";
    div.style.lineHeight = "1.4";
    div.innerHTML = html;
    document.body.appendChild(div);
  };

  /**
   * Display Viewport Hint
   */
  inst.displayHint = function () {
    var html = "<strong>Use your mouse to change the view.</strong>";
    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.padding = "10px";
    div.style.font = "11px arial, helvetica";
    div.style.color = "#FFF";
    div.innerHTML = html;
    document.body.appendChild(div);
  };
}
