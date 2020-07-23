console.log("ml5 version:", ml5.version);
var video = document.getElementById("video");
const reps = document.getElementById("reps")

var poseNet = ml5.poseNet(video, modelLoaded);
let check = true;
let state = "start" // recording, finish
let repsCounter = 0
// Create a new poseNet method

// When the model is loaded
function modelLoaded() {
  console.log("Model Loaded!");
}
// Listen to new 'pose' events

function startRecording(){
  const chunks = []
  const rec = new MediaRecorder(video.srcObject);

  rec.ondataavailable = e => chunks.push(e.data)
  rec.onstop = e => download(new Blob(chunks))
  console.log(rec)
}

function download(blob){
  console.log("In Download")
  let a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob);
  a.download = 'recorded.webm';
  document.body.appendChild(a);
  a.click();
}

function getVideo() {
  // Grab elements, create settings, etc.
  // Get access to the camera!
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Not adding `{ audio: true }` since we only want video now
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
      //video.src = window.URL.createObjectURL(stream);
      video.srcObject = stream;
      console.log(stream);
      video.play();
      
      const chunks = []
      const rec = new MediaRecorder(video.srcObject)
      rec.start()

      rec.ondataavailable = e => chunks.push(e.data)
      rec.onstop = e => download(new Blob(chunks))

      console.log(rec)
      console.log(chunks)

      if (check) {
        poseNet.on("pose", function(results) {
          poses = results;
          if (poses.length > 0) {
            let data = checkReps(poses[0].pose);
            repsCounter += data

            if(data){
              reps.textContent = `${repsCounter}`
            }
          }
        });
      }

      startTimer(60);
    });
  }
}

$(".snap").click(function() {
  if(state === "start"){
    state = "recording"
    $(this).text("Recording...");
    getVideo();
  }
});

function startTimer(sec) {
  const myTimer = document.getElementById("countDown");

  let myMinutes = Math.floor(sec / 60),
    remSeconds = sec % 60;

  let interval = setInterval(downTime, 1000);

  function downTime() {
    if (sec > 0) {
      sec -= 1;
      myMinutes = Math.floor(sec / 60);
      remSeconds = sec % 60;
      if (remSeconds < 10) {
        myMinutes < 10
          ? (myTimer.textContent = `0${myMinutes} : 0${remSeconds}`)
          : (myTimer.textContent = `${myMinutes} : 0${remSeconds}`);
      } else {
        myMinutes < 10
          ? (myTimer.textContent = `0${myMinutes} : ${remSeconds}`)
          : (myTimer.textContent = `${myMinutes} : ${remSeconds}`);
      }
    } else {
      video.srcObject.getTracks().forEach(function(track) {
        track.stop();
      });
      clearInterval(interval);
      $("video")[0].pause();
      $(".snap").text("   Done   ");
      myTimer.textContent = "Done";
      state = "finish"
    }
  }
}

let allKeypoints = [
  "nose",
  "leftEye",
  "rightEye",
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle"
];

let start_frame = false;
let result_count = 0;
let start_frames_index = [];
let end_frames_index = [];
let reached_down = false;

let ANGLE_CHECK = 180;
let DISTANCE_THRESHOLD = 20;

function vectorAngle(v1, v2) {
  var numer = v1.x * v2.x + v1.y * v2.y;
  var denom = Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  return (Math.acos(numer / denom) * 180.0) / Math.PI;
}

function checkReps(pose) {
  var repsCounter_done = false;

  leftShoulder = {
    x: pose.leftShoulder.x,
    y: pose.leftShoulder.y,
    confidence: pose.leftShoulder.confidence
  };

  rightShoulder = {
    x: pose.rightShoulder.x,
    y: pose.rightShoulder.y,
    confidence: pose.rightShoulder.confidence
  };

  leftHip = {
    x: pose.leftHip.x,
    y: pose.leftHip.y,
    confidence: pose.leftHip.confidence
  };

  rightHip = {
    x: pose.rightHip.x,
    y: pose.rightHip.y,
    confidence: pose.rightHip.confidence
  };

  leftKnee = {
    x: pose.leftKnee.x,
    y: pose.leftKnee.y,
    confidence: pose.leftKnee.confidence
  };

  rightKnee = {
    x: pose.rightKnee.x,
    y: pose.rightKnee.y,
    confidence: pose.rightKnee.confidence
  };

  leftHSVec = {
    x: leftShoulder.x - leftHip.x,
    y: leftShoulder.y - leftHip.y
  };

  rightHSVec = {
    x: rightShoulder.x - rightHip.x,
    y: rightShoulder.y - rightHip.y
  };

  leftHKVec = {
    x: leftKnee.x - leftHip.x,
    y: leftKnee.y - leftHip.y
  };

  rightHKVec = {
    x: rightKnee.x - rightHip.x,
    y: rightKnee.y - rightHip.y
  };

  leftSHKAngle = vectorAngle(leftHSVec, leftHKVec);
  rightSHKAngle = vectorAngle(rightHSVec, rightHKVec);

  if (leftSHKAngle >= 0.9 * ANGLE_CHECK && rightSHKAngle >= 0.9 * ANGLE_CHECK && 
    leftShoulder.confidence > 0.1 && rightShoulder.confidence > 0.1 && 
    leftHip.confidence > 0.1 && rightHip.confidence > 0.1 && 
    leftKnee.confidence > 0.1 && rightKnee.confidence > 0.1
    ) {
    if (!start_frame) {
      // console.log('start frame')
      start_frame = true;
    } else if (start_frame && reached_down) {
      // console.log('end frame')
      start_frame = false;
      reached_down = false;
      repsCounter_done = true;
    }
  }

  if (Math.abs(leftHKVec.y) < 30 && Math.abs(rightHKVec.y) < 30) {
    // console.log('reached down')
    reached_down = true;
  }

  return repsCounter_done;
}
