// Babel 6 doesn't support extending native class (Error, Array, ...)
// This function makes it possible to extend native classes with the same results as Babel 5
function extendableBuiltin(_class) {
  function ExtendableBuiltin() {
    _class.apply(this, arguments);
  }
  ExtendableBuiltin.prototype = Object.create(_class.prototype);
  Object.setPrototypeOf(ExtendableBuiltin, _class);

  return ExtendableBuiltin;
}

export default extendableBuiltin;
