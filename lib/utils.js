'use strict'

var stringify = require('./stringify')
var helpers = require('./helpers')

var JSONDomUtils = module.exports = {}

var TRANSFER_LIST = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&apos;': "'",
  '&quot;': '"'
}

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
  if (children.length > 0) return transfer(this.getText(children[0]))
  return null
}

JSONDomUtils.getChildTagIntValue = function (node, ns, tagName) {
  var value = JSONDomUtils.getChildTagValue.call(this, node, ns, tagName)
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
  let getText = this.getText
  function isTextEquality (elem) {
    if (!elem || elem.children == null) return false
    return getText(elem.children[0]) === text
  }
  return this.filter(isTextEquality, element, false)
}

JSONDomUtils.evaluateWithResolve = function (doc, expr, XPathNSResolve) {
  if (doc.dom) {
    doc = doc.dom
  } else if (!Array.isArray(doc)) {
    doc = [doc]
  }
  let getElementsByTagNameNS = this.getElementsByTagNameNS
  let getElementsByContent = this.getElementsByContent

  return JSONDomUtils.splitExpr(expr).reduce(function (elements, str) {
    var regRes = null
    let resElements = []
    if (str === '/*') {
      elements.forEach(function (element) {
        if (element.children) {
          resElements = resElements.concat(element.children)
        }
      })
      return resElements
    } else if ((regRes = NS_NAME_REGEXP.exec(str)) != null) {
      let ns = regRes[2]
      if (ns) ns = XPathNSResolve(ns)
      let name = regRes[3]
      elements.forEach(function (element) {
        if (!element || !element.children) return
        var res = getElementsByTagNameNS(ns, name, element.children, false)
        resElements = resElements.concat(res)
      })
      return resElements
    } else {
      regRes = CONDITION_REGEXP.exec(str)
      let ns = regRes[2]
      if (ns) ns = XPathNSResolve[ns]
      var text = regRes[4]
      elements.forEach(function (element) {
        if (!element || !element.children) return
        var nodes = getElementsByContent(text, element.children)
        if (nodes.length > 0) {
          resElements.push(element)
        }
      })
      return resElements
    }
  }, [{children: doc}])
}
