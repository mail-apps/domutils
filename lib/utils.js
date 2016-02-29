'use strict'

var stringify = require('./stringify')
var legacy = require('./legacy')
var helpers = require('./helpers')
var querying = require('./querying')

var getText = stringify.getText

var JSONDomUtils = module.exports = {}

var TRANSFER_LIST = {'&lt;': '<', '&gt;': '>', '&amp;': '&',
'&apos;': "'", '&quot;': '"'}

function transfer (str) {
  var reg = /&lt;|&gt;|&amp;|&apos;|&quot;/g
  return str.replace(reg, function (match) {
    return TRANSFER_LIST[match]
  })
}

JSONDomUtils.getAttribute = function (node, key) {
  return transfer(node.attribs[key])
}

JSONDomUtils.extendElements = function (doc) {
  doc.type = 'doc'
  helpers.expandDoc(doc)
  doc.getElementsByTagNameNS = function (ns, name, recurse) {
    return this.getElementsByTagNameNS(ns, name, doc.dom, recurse)
  }.bind(this)
}

JSONDomUtils.getChildTag = function (node, ns, tagName) {
	var element = node && node.children || node
  var children = this.getElementsByTagNameNS(ns, tagName, element, false)
  if (children.length > 0) return children[0]
  return null
}

JSONDomUtils.getChildTags = function (node, ns, tagName) {
	var element = node && node.children || node
  return this.getElementsByTagNameNS(ns, tagName, element, false)
}

JSONDomUtils.getChildTagValue = function (node, ns, tagName) {
	var element = node && node.children || node
  var children = this.getElementsByTagNameNS(ns, tagName, element, false)
  if (children.length > 0) return transfer(getText(children[0]))
  return null
}

JSONDomUtils.getChildTagIntValue = function (node, ns, tagName) {
  var value = JSONDomUtils.getChildTagValue(node, ns, tagName)
  if (!value) return null
  return parseInt(value, 0)
}

JSONDomUtils.getHTML = function (doc) {
  return stringify.getOuterHTML(doc.dom)
}

var SEGMENT_REGEXP = /(\/?[\w:\*]+)|(\[[^\]]+\])/g
var NS_NAME_REGEXP = /^\/?((\w+):)?(\w+)/
var CONDITION_REGEXP = /^\[((\w+):)?(\w+)="(.+)"\]/

JSONDomUtils.splitExpr = function (expr) {
  var resArray = []
  for (;;) {
    var segmentRes = SEGMENT_REGEXP.exec(expr)
    if (!segmentRes) break
    resArray.push(segmentRes[0])
  }
  return resArray
}

JSONDomUtils.getElementsByContent = function (text, element) {
  function isTextEquality (elem) {
    if (elem.children == null) return false
    return getText(elem.children[0]) === text
  }
  return this.filter(isTextEquality, element, false)
}
