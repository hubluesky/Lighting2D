import Lighting2DIntersection from "./Lighting2DIntersection.js";

// DRAWING
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
const sightRadius = 100;
function draw() {

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    ctx.strokeStyle = "#999";
    for (let segment of segments) {
        for (var i = 0; i < segment.length; i++) {
            var point1 = segment[i];
            var point2 = segment[(i + 1) % segment.length];
            ctx.beginPath();
            ctx.moveTo(point1.x, point1.y);
            ctx.lineTo(point2.x, point2.y);
            ctx.stroke();
        }
    }


    var intersects = Lighting2DIntersection.getSightPolygon(segments, Mouse, Infinity);
    drawLighting(ctx, "#dd3838", intersects);
    if (!moueHold) {
        var intersects = Lighting2DIntersection.getSightPolygon(segments, Mouse, sightRadius);
        drawLighting(ctx, "#00008888", intersects);
    }

    // DRAW DEBUG LINES
    ctx.strokeStyle = "#f55";
    for (var i = 0; i < intersects.length; i++) {
        var intersect = intersects[i];
        ctx.beginPath();
        ctx.moveTo(Mouse.x, Mouse.y);
        ctx.lineTo(intersect.x, intersect.y);
        ctx.stroke();
    }

    ctx.strokeStyle = "#00ff00";
    ctx.beginPath();
    ctx.arc(Mouse.x, Mouse.y, sightRadius, 0, Math.PI * 2, true);
    ctx.stroke();
}

function drawLighting(ctx, color, intersects) {
    // DRAW AS A GIANT POLYGON
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(intersects[0].x, intersects[0].y);
    for (var i = 1; i < intersects.length; i++) {
        var intersect = intersects[i];
        ctx.lineTo(intersect.x, intersect.y);
    }
    ctx.fill();
}

var segments = [
    // Border
    [
        { x: 0, y: 0 },
        { x: 640, y: 0 },
        { x: 640, y: 360 },
        { x: 0, y: 360 },
    ],
    // Polygon #1
    [
        { x: 100, y: 150 },
        { x: 120, y: 50 },
        { x: 200, y: 80 },
        { x: 140, y: 210 },
    ],
    // Polygon #2
    [
        { x: 100, y: 200 },
        { x: 120, y: 250 },
        { x: 60, y: 300 },
    ],
    // Polygon #3
    [
        { x: 200, y: 260 },
        { x: 220, y: 150 },
        { x: 300, y: 200 },
        { x: 350, y: 320 },
    ],
    // Polygon #4
    [
        { x: 340, y: 60 },
        { x: 360, y: 40 },
        { x: 370, y: 70 },
    ],
    // Polygon #5
    [
        { x: 450, y: 190 },
        { x: 560, y: 170 },
        { x: 540, y: 270 },
        { x: 430, y: 290 },
    ],
    // Polygon #6
    [
        { x: 400, y: 95 },
        { x: 580, y: 50 },
        { x: 480, y: 150 },
    ],
];

// DRAW LOOP
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
var updateCanvas = true;
var moueHold = false;
function drawLoop() {
    requestAnimationFrame(drawLoop);
    if (updateCanvas) {
        draw();
        updateCanvas = false;
    }
}
window.onload = function () {
    drawLoop();
};

// MOUSE	
var Mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};
canvas.onmousemove = function (event) {
    Mouse.x = event.clientX;
    Mouse.y = event.clientY;
    updateCanvas = true;
};
canvas.onmousedown = function (event) {
    moueHold = true;
    updateCanvas = true;
};
canvas.onmouseup = function (event) {
    moueHold = false;
    updateCanvas = true;
};