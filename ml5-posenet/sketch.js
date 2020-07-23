// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet using p5.js
=== */
/* eslint-disable */

// Grab elements, create settings, etc.
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// The detected positions will be inside an array
let poses = [];
let poseStream = []




let allKeypoints = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle']

let start_frame = false
let result_count = 0
let start_frames_index = []
let end_frames_index = []
let reached_down = false

let ANGLE_CHECK = 180
let DISTANCE_THRESHOLD = 20

function vectorAngle(v1, v2){
  var numer = v1.x * v2.x + v1.y * v2.y
  var denom = Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  return Math.acos(numer / denom) * 180.0 / Math.PI
}

function checkReps(pose){
  var reps_done = false

  leftShoulder = {
    'x': pose.leftShoulder.x,
    'y': pose.leftShoulder.y
  }

  rightShoulder = {
    'x': pose.rightShoulder.x,
    'y': pose.rightShoulder.y
  }

  leftHip = {
    'x': pose.leftHip.x,
    'y': pose.leftHip.y
  }

  rightHip = {
    'x': pose.rightHip.x,
    'y': pose.rightHip.y
  }

  leftKnee = {
    'x': pose.leftKnee.x,
    'y': pose.leftKnee.y
  }

  rightKnee = {
    'x': pose.rightKnee.x,
    'y': pose.rightKnee.y
  }

  leftHSVec = {
    'x': leftShoulder.x - leftHip.x,
    'y': leftShoulder.y - leftHip.y
  } 

  rightHSVec = {
    'x': rightShoulder.x - rightHip.x,
    'y': rightShoulder.y - rightHip.y
  }

  leftHKVec = {
    'x': leftKnee.x - leftHip.x,
    'y': leftKnee.y - leftHip.y
  }

  rightHKVec = {
    'x': rightKnee.x - rightHip.x,
    'y': rightKnee.y - rightHip.y
  }

  leftSHKAngle = vectorAngle(leftHSVec, leftHKVec)
  rightSHKAngle = vectorAngle(rightHSVec, rightHKVec)

  // console.log(leftSHKAngle)
  // console.log(rightSHKAngle)

  if(leftSHKAngle >= 0.9 * ANGLE_CHECK && rightSHKAngle >= 0.9 * ANGLE_CHECK){
    if(!start_frame){
      console.log('start frame')
      start_frame = true
    }
    else if(start_frame && reached_down){
      console.log('end frame')
      start_frame = false
      reached_down = false
      reps_done = true
    }
  }

  // console.log(leftHKVec)
  // console.log(rightHKVec)

  if(Math.abs(leftHKVec.y) < 20 && Math.abs(rightHKVec.y) < 20){
    console.log('reached down')
    reached_down = true
  }

  return reps_done
}






var points = ["nose", "leftEye", "rightEye", "leftEar", "rightEar", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"]

// let downloadButton = document.getElementById("downloadButton");

function startRecording(){
  // switch button's behavior
  const btn = this;
  btn.textContent = 'stop recording';
  btn.onclick = stopRecording;
  
  const chunks = []; // here we will save all video data
  const rec = new MediaRecorder(video.srcObject);
  // this event contains our data
  rec.ondataavailable = e => chunks.push(e.data);
  // when done, concatenate our chunks in a single Blob
  rec.onstop = e => download(new Blob(chunks));
  rec.start();
  function stopRecording(){
    rec.stop();
    // switch button's behavior
    btn.textContent = 'start recording';
    btn.onclick = startRecording;
  }
}
function download(blob){
  // uses the <a download> to download a Blob
  let a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob);
  a.download = 'recorded.webm';
  document.body.appendChild(a);
  a.click();
  saveText(JSON.stringify(poseStream), "poseStream.json");
}


// Create a webcam capture
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
    video.srcObject=stream;
    // downloadButton.srcObject = stream
    video.play();
  }).then(()=>{ // enable the button
    const btn = document.getElementById('downloadButton');
    btn.disabled = false;
    btn.onclick = startRecording;

    // video.srcObject=stream;
    // video.play();
  });
}

// A function to draw the video and poses into the canvas.
// This function is independent of the result of posenet
// This way the video will not seem slow if poseNet 
// is not detecting a position
function drawCameraIntoCanvas() {
  // console.log("Hello")
  // Draw the video element into the canvas
  ctx.drawImage(video, 0, 0, 640, 480);
  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

let poseparams =   {
  architecture: 'MobileNetV1',
  imageScaleFactor: 0.3,
  outputStride: 16,
  flipHorizontal: false,
  minConfidence: 0.5,
  maxPoseDetections: 1,
  scoreThreshold: 0.5,
  nmsRadius: 20,
  detectionType: 'multiple',
  inputResolution: 513,
  multiplier: 0.75,
  quantBytes: 2
}

function saveText(text, filename){
  var a = document.createElement('a');
  a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(text));
  a.setAttribute('download', filename);
  a.click()
}

// Create a new poseNet method with a single detection
const poseNet = ml5.poseNet(video, poseparams, modelReady);
poseNet.on('pose', gotPoses);

// A function that gets called every time there's an update from the model
function gotPoses(results) {
  poses = results;
  // console.log(poses.length)
  // console.log(video)

  if(poses.length > 0){
    // poseStream.push(poses[0].pose)
    tmpPose = poses[0].pose
    res = checkReps(tmpPose)
    console.log('Reps Done')
    // tmpJson = {
    //   "score": tmpPose.score,
    //   "timestamp": Date.now()
    // }

    // for(let i=0; i<points.length; ++i){
    //   // console.log(poses.nose)
    //   // console.log(points[i])
    //   let tmp_point = points[i]
    //   tmpJson[points[i]] = tmpPose[tmp_point]
    // }

    // // console.log("tmpJson")
    // // console.log(tmpJson)
    // poseStream.push(tmpJson)

  }


  // if(poseStream.length == 1000){
  //   saveText(JSON.stringify(poseStream), "poseStream.json" );
  // }
}

function modelReady() {
  console.log("model ready")
  // poseNet.singlePose(video)
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      let keypoint = poses[i].pose.keypoints[j];
      // console.log(keypoint)
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "#c82124";
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}