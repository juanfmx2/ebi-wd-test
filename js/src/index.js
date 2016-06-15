"use strict";

//-----------------------------------------------------------------------------
// SPECK RENDERING CODE
//-----------------------------------------------------------------------------

var fs = require("fs");
var kb = require("keyboardjs");
var lz = require("lz-string");
var $ = require("jquery");

var Renderer = require("./speck/renderer")
var View = require("./speck/view");
var System = require("./speck/system");
var xyz = require("./speck/xyz");
var samples = require("./speck/samples");
var elements = require("./speck/elements");
var presets = require("./speck/presets");
var mimetypes = require("./speck/mimetypes");

var active_keys = {};

function listen_to_key(key){
	active_keys[key];
	kb.bind(key, function(e) {
			active_keys[key] = true;
		}, function(e) {
			active_keys[key] = false;
		});
	
}

listen_to_key('a');
listen_to_key('z');
listen_to_key('d');
listen_to_key('p');
listen_to_key('b');
listen_to_key('s');
listen_to_key('w');
listen_to_key('o');
listen_to_key('l');
listen_to_key('q');

var system = System.new();
var view = View.new();
var renderer = null;
var needReset = false;

var renderContainer;

function loadStructure(data) {
	system = System.new();
	for (var i = 0; i < data.length; i++) {
		var a = data[i];
		var x = a.position[0];
		var y = a.position[1];
		var z = a.position[2];
		System.addAtom(system, a.symbol, x,y,z);
	}
	System.center(system);
	System.calculateBonds(system);
	renderer.setSystem(system, view);
	View.center(view, system);
	needReset = true;
}

function on_ready_renderer_startup_cb(){

	renderContainer = document.getElementById("render-container");

	var imposterCanvas = document.getElementById("renderer-canvas");

	renderer = new Renderer(imposterCanvas, view.resolution, view.aoRes);

	var lastX = 0.0;
	var lastY = 0.0;
	var buttonDown = false;
	
	renderContainer.addEventListener("mousedown", function(e) {
		document.body.style.cursor = "none";
		if (e.button == 0) {
			buttonDown = true;
		}
		lastX = e.clientX;
		lastY = e.clientY;
	});
	
	window.addEventListener("mouseup", function(e) {
		document.body.style.cursor = "";
		if (e.button == 0) {
			buttonDown = false;
		}
	});
	
	setInterval(function() {
		if (!buttonDown) {
			document.body.style.cursor = "";
		}
	}, 10);
	
	window.addEventListener("mousemove", function(e) {
		if (!buttonDown) {
			return;
		}
		var dx = e.clientX - lastX;
		var dy = e.clientY - lastY;
		if (dx == 0 && dy == 0) {
			return;
		}
		lastX = e.clientX;
		lastY = e.clientY;
		if (e.shiftKey) {
			View.translate(view, dx, dy);
		} else {
			View.rotate(view, dx, dy);
		}
		needReset = true;
	});
	
	renderContainer.addEventListener("wheel", function(e) {
		var wd = 0;
		if (e.deltaY < 0) {
			wd = 1;
		}
		else {
			wd = -1;
		}
		if (active_keys.a) {
			view.atomScale += wd/100;
			View.resolve(view);
			needReset = true;
		} else if (active_keys.z) {
			var scale = view.relativeAtomScale;
			scale += wd/100;
			view.relativeAtomScale += wd/100;
			View.resolve(view);
			needReset = true;
		} else if (active_keys.d) {
			view.dofStrength += wd/100;
			View.resolve(view);
		} else if (active_keys.p) {
			view.dofPosition += wd/100;
			View.resolve(view);
		} else if (active_keys.b) {
			view.bondScale += wd/100;
			View.resolve(view);
			needReset = true;
		} else if (active_keys.s) {
			view.bondShade += wd/100;
			View.resolve(view);
			needReset = true;
		} else if (active_keys.w) {
			view.atomShade += wd/100;
			View.resolve(view);
			needReset = true;
		} else if (active_keys.o) {
			view.ao += wd/100;
			View.resolve(view);
		} else if (active_keys.l) {
			view.brightness += wd/100;
			View.resolve(view);
		} else if (active_keys.q) {
			view.outline += wd/100;
			View.resolve(view);
		} else {
			view.zoom = view.zoom * (wd === 1 ? 1/0.9 : 0.9);
			View.resolve(view);
			needReset = true;
		}
		e.preventDefault();
	});
	
	function reflow() {	
		var ww = window.innerWidth;
		var wh = window.innerHeight;
	
		var rcw = Math.round(wh * 1);
		var rcm = Math.round((wh - rcw) / 2);
	
		renderContainer.style.height = rcw - 128 + "px";
		renderContainer.style.width = rcw - 128+ "px";

		imposterCanvas.style.height = rcw - 128 + "px";
		imposterCanvas.style.width = rcw - 128+ "px";
	}
	
	reflow();
	
	window.addEventListener("resize", reflow);

	function loop() {

		if (needReset) {
			renderer.reset();
			needReset = false;
		}
		renderer.render(view);
		requestAnimationFrame(loop);
	}
	
	loop();
}


//-----------------------------------------------------------------------------
// CHEM API 
//-----------------------------------------------------------------------------

var base_chem_url = "https://www.ebi.ac.uk/chembl/api/utils/";

function promise_query_chem_api(service,parameter){
	return Promise.resolve($.post(base_chem_url+ service,parameter));
}



//-----------------------------------------------------------------------------
// File Handling
//-----------------------------------------------------------------------------

function readSmileFileNUpdateViewer(evt) {
	//Retrieve the first (and only!) File from the FileList object
	var file = evt.target.files[0]; 
	if (file) {
		var reader = new FileReader();
		reader.onload = function(event) {
			var text_smiles = reader.result;
			var results = "<b>SMILES File:</b>\n";
			console.log("SMILES File:");
			console.log(text_smiles);
			results += text_smiles+"\n";
			var promise_2_ctab = promise_query_chem_api("smiles2ctab", text_smiles);
			promise_2_ctab.then(function(res){
				console.log("SMILES2CTAB result:");
				console.log(res);
				results += "<b>SMILES2CTAB result:</b>\n";
				results += res+"\n";
				promise_query_chem_api("ctab2xyz",res).then(function(res){
					console.log("CTAB2XYZ result:");
					console.log(res);
					results += "<b>CTAB2XYZ result:</b>\n";
					results += res+"\n";
					loadStructure(xyz(res)[0]);
					$("#results").html(results.replace(/\n/g, "<br>"));
					$("#render-container").show();
				});
			});
		}
		reader.readAsText(file);
	} else { 
		alert("Failed to load file");
	}
}

//-----------------------------------------------------------------------------
// OnReady
//-----------------------------------------------------------------------------

$("document").ready(function(){
	if(!window.FileReader) {
		$("#file_panel").html('Your browser does not support the HTML5 FileReader.');
	}
	else{
		on_ready_renderer_startup_cb();
		$("#smile_file").on('change',function(event){
			readSmileFileNUpdateViewer(event);
		});
	}
});
