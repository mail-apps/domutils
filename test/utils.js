var htmlparser = require("htmlparser2");
var DomHandler = require('domhandler');

exports.makeDom = function(markup) {
	var handler = new DomHandler(),
		parser = new htmlparser.Parser(handler);
	parser.write(markup);
	parser.done();
	return handler.dom;
};
