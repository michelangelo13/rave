/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var normalizeCjs = require('rave/pipeline/normalizeCjs');
var locatePackage = require('rave/pipeline/locatePackage');
var locateAsIs = require('rave/pipeline/locateAsIs');
var fetchAsText = require('rave/pipeline/fetchAsText');
var translateAsIs = require('rave/pipeline/translateAsIs');
var translateWrapObjectLiteral = require('rave/pipeline/translateWrapObjectLiteral');
var instantiateNode = require('rave/pipeline/instantiateNode');
var instantiateScript = require('rave/pipeline/instantiateScript');
var overrideIf = require('rave/lib/overrideIf');
var createFileExtFilter = require('rave/lib/createFileExtFilter');
var pkg = require('rave/lib/package');
var beget = require('rave/lib/beget');

module.exports = _ravePipeline;

function _ravePipeline (context) {
	var modulePipeline, jsonPipeline;

	context = beget(context);
	if (context.packages) {
		context.packages = pkg.normalizeCollection(context.packages);
	}

	modulePipeline = {
		normalize: normalizeCjs,
		locate: withContext(context, locatePackage),
		fetch: fetchAsText,
		translate: translateAsIs,
		instantiate: instantiateNode
	};

	jsonPipeline = {
		normalize: normalizeCjs,
		locate: withContext(context, locateAsIs),
		fetch: fetchAsText,
		translate: translateWrapObjectLiteral,
		instantiate: instantiateScript
	};

	return {
		applyTo: function (loader) {
			overrideIf(createRavePredicate(context), loader, modulePipeline);
			overrideIf(createFileExtFilter('json'), loader, jsonPipeline);
		}
	};
}

function createRavePredicate (context) {
	return function (arg) {
		var moduleId, packageId;
		// Pipeline functions typically receive an object with a normalized name,
		// but the normalize function takes an unnormalized name and a normalized
		// referrer name.
		moduleId = typeof arg === 'object' ? arg.name : arg;
		// check if this is the rave-main module
		if (moduleId === context.raveMain) return true;
		if (moduleId.charAt(0) === '.') moduleId = arguments[1];
		packageId = moduleId.split('/')[0];
		return packageId === 'rave';
	};
}

function withContext (context, func) {
	return function (load) {
		load.metadata.rave = context;
		return func.call(this, load);
	};
}