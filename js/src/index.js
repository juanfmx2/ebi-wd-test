"use strict";

var fs = require("fs");
var kb = require("keyboardjs");
var lz = require("lz-string");
var $ = require("jquery");

var Renderer = require("speck/renderer")
var View = require("speck/view");
var System = require("speck/system");
var xyz = require("speck/xyz");
var samples = require("speck/samples");
var elements = require("speck/elements");
var presets = require("speck/presets");
var mimetypes = require("speck/mimetypes");

var base_chem_url = "https://www.ebi.ac.uk/chembl/api/utils/";

function readSingleFile(evt) {
	//Retrieve the first (and only!) File from the FileList object
	var file = evt.target.files[0]; 
	if (file) {
		var reader = new FileReader();
		reader.onload = function(event) {
			var text = reader.result;
			console.log(text)
		}
		reader.readAsText(file);
	} else { 
		alert("Failed to load file");
	}
}

$("document").ready(function(){
	if(!window.FileReader) {
		$("#file_panel").html('Your browser does not support the HTML5 FileReader.');
	}
	else{
		console.log("Hello!")
		$("#smile_file").on('change',function(event){
			readSingleFile(event);
		});
	}
});
