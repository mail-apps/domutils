'use strict'

var DomUtils = require("..");
var fixture = require("./fixture");
var assert = require("assert");

var makeDoc = require("./utils").makeDoc;
var path = require('path');
var fs = require('fs');

// Set up expected structures
var expected = {
	idAsdf: fixture[1],
	tag2: [],
	typeScript: []
};
for (var idx = 0; idx < 20; ++idx) {
	expected.tag2.push(fixture[idx*2 + 1].children[5]);
	expected.typeScript.push(fixture[idx*2 + 1].children[1]);
}

describe("legacy", function() {
	describe("getElements", function() {
		var getElements = DomUtils.getElements;
		it("returns the node with the specified ID", function() {
			assert.deepEqual(
				getElements({ id: "asdf" }, fixture, true, 1),
				[expected.idAsdf]
			);
		});
		it("returns empty array for unknown IDs", function() {
			assert.deepEqual(getElements({ id: "asdfs" }, fixture, true), []);
		});
		it("returns the nodes with the specified tag name", function() {
			assert.deepEqual(
				getElements({ tag_name:"tag2" }, fixture, true),
				expected.tag2
			);
		});
		it("returns empty array for unknown tag names", function() {
			assert.deepEqual(
				getElements({ tag_name : "asdfs" }, fixture, true),
				[]
			);
		});
		it("returns the nodes with the specified tag type", function() {
			assert.deepEqual(
				getElements({ tag_type: "script" }, fixture, true),
				expected.typeScript
			);
		});
		it("returns empty array for unknown tag types", function() {
			assert.deepEqual(
				getElements({ tag_type: "video" }, fixture, true),
				[]
			);
		});
	});

	describe("getElementById", function() {
		var getElementById = DomUtils.getElementById;
		it("returns the specified node", function() {
			assert.equal(
				expected.idAsdf,
				getElementById("asdf", fixture, true)
			);
		});
		it("returns `null` for unknown IDs", function() {
			assert.equal(null, getElementById("asdfs", fixture, true));
		});
	});

	describe("getElementsByTagName", function() {
		var getElementsByTagName = DomUtils.getElementsByTagName;
		it("returns the specified nodes", function() {
			assert.deepEqual(
				getElementsByTagName("tag2", fixture, true),
				expected.tag2
			);
		});
		it("returns empty array for unknown tag names", function() {
			assert.deepEqual(
				getElementsByTagName("tag23", fixture, true),
				[]
			);
		});
	});

	describe("getElementsByTagNameNS", function() {
		var getElementsByTagNameNS = DomUtils.getElementsByTagNameNS;
		it('returns the specified nodes', function() {
			var xmlFilePath = path.resolve(__dirname, './fixture/ns-xml.xml');
			var xmlContent = fs.readFileSync(xmlFilePath, {encoding: 'utf8'});
			var doc = makeDoc(xmlContent);
			DomUtils.expandDoc(doc);
			var dom = doc.dom;
			var nodes =	getElementsByTagNameNS('namespace1', 'node1', dom);
			assert.equal(nodes.length, 1);

			nodes = getElementsByTagNameNS('namespace1', 'node6', dom);
			assert.equal(nodes.length, 1);

			nodes = getElementsByTagNameNS('namespace-default', 'node5', dom);
			assert.equal(nodes.length, 1);
		});
	});

	describe("getElementsByTagType", function() {
		var getElementsByTagType = DomUtils.getElementsByTagType;
		it("returns the specified nodes", function() {
			assert.deepEqual(
				getElementsByTagType("script", fixture, true),
				expected.typeScript
			);
		});
		it("returns empty array for unknown tag types", function() {
			assert.deepEqual(
				getElementsByTagType("video", fixture, true),
				[]
			);
		});
	});

	describe("getOuterHTML", function() {
		var getOuterHTML = DomUtils.getOuterHTML;
		it("Correctly renders the outer HTML", function() {
			assert.equal(
				getOuterHTML(fixture[1]),
				"<tag1 id=\"asdf\"> <script>text</script> <!-- comment --> <tag2> text </tag2></tag1>"
			);
		});
	});

	describe("getInnerHTML", function() {
		var getInnerHTML = DomUtils.getInnerHTML;
		it("Correctly renders the inner HTML", function() {
			assert.equal(
				getInnerHTML(fixture[1]),
				" <script>text</script> <!-- comment --> <tag2> text </tag2>"
			);
		});
	});

});

function getFixtureNsDoc () {
	var xmlFilePath = path.resolve(__dirname, './fixture/fixture-ns.xml');
	var xmlContent = fs.readFileSync(xmlFilePath, {encoding: 'utf8'});
	var doc = makeDoc(xmlContent);
	DomUtils.expandDoc(doc);
	doc.xmlContent = xmlContent
	return doc;
}

describe('JSONDOMUtils test', function () {
	it('Testing fixture-ns', function () {
		var doc = getFixtureNsDoc();
		let nodes = DomUtils.getElementsByTagNameNS(null, 'root', doc.dom)
		assert.equal(nodes.length, 1)

		nodes = DomUtils.getElementsByTagNameNS('namespace1', 'node1', doc.dom)
		assert.equal(nodes.length, 1)

		nodes = DomUtils.getElementsByTagNameNS('namespace2', 'node3', doc.dom)
		assert.equal(nodes.length, 1)

		nodes = DomUtils.getElementsByTagNameNS('namespace-default', 'node5', doc.dom)
		assert.equal(nodes.length, 1)
	})

	it('get elements by DomUtils', function () {
		var doc = getFixtureNsDoc();
		var node = DomUtils.getChildTag(doc.dom, 'namespace1', 'node1');
		assert.equal(node, null)

		node = DomUtils.getChildTag(doc.dom, null, 'root');
		assert.equal(DomUtils.getAttribute(node, 'details'), 'set ns1');

		node = DomUtils.getChildTag(node, 'namespace1', 'node1');
		assert.equal(DomUtils.getAttribute(node, 'details'), 'get ns1');

		node = DomUtils.getChildTag(node, 'namespace2', 'node2');
		node = DomUtils.getChildTag(node, 'namespace2', 'node3');
		node = DomUtils.getChildTag(node, 'namespace-default', 'node4'); 
		node = DomUtils.getChildTag(node, 'namespace-default', 'node5');
		assert.equal(DomUtils.getAttribute(node, 'details'), 'get default namespace');

		let finalNode = DomUtils.getChildTag(node, 'namespace1', 'node6');
		assert.equal(DomUtils.getAttribute(finalNode, 'details'),'get ns1 again');

		var str = DomUtils.getChildTagValue(node, 'namespace1', 'node6');
		assert.equal(str, 'Hello, Goodbye');

		// TODO: DomUtils.getHTML is invalid
		// assert.equal(DomUtils.getHTML(doc), doc.xmlContent);
	})

	it('get elements by evaluate', function () {
		var doc = getFixtureNsDoc();

		var expr = '/*/ns1:node1/ns2:node2/ns2:node3/default:node4/default:node5[ns1:node6="Hello, Goodbye"]';
		var resArray = DomUtils.splitExpr(expr);
		assert.equal(resArray.length, 7);

		var node5 = DomUtils.getElementsByTagNameNS('namespace-default', 'node5', doc.dom)[0];
		assert.equal(DomUtils.getAttribute(node5, 'details'), 'get default namespace');

		var node6 = DomUtils.getChildTag(node5, 'namespace1', 'node6');
		var nodes = DomUtils.getElementsByContent('Hello, Goodbye', node6);
		assert.equal(nodes.length, 1);

		var node7Value = DomUtils.getChildTagIntValue(node5, 'namespace1', 'node7')
		assert.equal(node7Value, 1)

		var nodes = DomUtils.evaluateWithResolve(doc, expr, function(prefix) {
			var map = {ns1: 'namespace1', ns2: 'namespace2', 'default': 'namespace-default'};
			return map[prefix];
		});
		assert.equal(nodes.length, 1);
	});
})