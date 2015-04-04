/*
Randy Parisi
Lab4
2/25/15
*/

var canvas;
var gl;

var numVertices  = 12;

var pointsArray = [];
var normalsArray = [];

var vertices = [
		vec4( 4.0,  -4.0, 3.0, 1.0 ),//0
		vec4( 0.0, 4.0, 0.0, 1.0 ),//1
        vec4( -4.0, -4.0, 3.0, 1.0 ),//2
        vec4( 0.0, -4.0, -5.0, 1.0 ),//3
];

var texCoordsArray = [];
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var lightPosition = vec4(0, 15, -15, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.8 , 0.0, 0.8, 1.0 );
var materialDiffuse = vec4( 1.0, 0.1, 1, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];
var speed = 0;
var thetaLoc;

var flag = true;

var leftarrow = 37;
var uparrow = 38;
var  rightarrow = 39;
var downarrow = 40;
var numpadzero = 96;
var currentlyPressedKeys = {};

//Texture Generation
var texSize = 64;
var numRows = 8;
var numCols = 8;
var image1 = new Uint8Array(4*texSize*texSize);

//Stripes
for ( var i = 0; i < texSize; i++ ) {
	for ( var j = 0; j <texSize; j++ ) {	
		image1[4*i*texSize+4*j*texSize/16] = 255;
		image1[4*i*texSize+4*j*texSize/16+1] = 255;
		image1[4*i*texSize+4*j*texSize/16+2] = 255;
		image1[4*i*texSize+4*j*texSize/16+3] = 255;		
	}
}


//			  1
//          / |\
//         /  | \
//        /   3  \
//       /  /   \  \
//      2--------0
// 012
// 031
// 321
// 032


function tri(a, b, c) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[b], vertices[c]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);

     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 
	 texCoordsArray.push(texCoord[0]);
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 
	 texCoordsArray.push(texCoord[1]);
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);  
	 texCoordsArray.push(texCoord[2]);
}

function colorTri()
{
    tri( 2, 0, 1);
	tri( 0, 3, 1);
    tri( 3, 2, 1);
	tri( 0, 3, 2);
}

function configureTexture() {
    texture1 = gl.createTexture();       
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);   
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
	
	//Keys
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    colorTri();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
	
	
	
	//TEXTURE
	var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

	configureTexture();
    
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);
	//TEXTURE
	
	

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

	projection = ortho(-8, 8, -8, 8, -200, 200);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
    
    render();
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
	if (event.keyCode == rightarrow) {
		axis = yAxis;
		speed = -.5;
	}
	if (event.keyCode == leftarrow) {
		axis = yAxis;
		speed = .5;
	}
	if (event.keyCode == downarrow) {
		axis = xAxis;
		speed = -.5;
	}
	if (event.keyCode == uparrow) {
		axis = xAxis;
		speed = .5;
	}
	if (event.keyCode == numpadzero) {
		flag = !flag;
	}
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

var render = function(){
            
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
           
    if(flag) theta[axis] += speed;
            
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
            
    requestAnimFrame(render);
}
