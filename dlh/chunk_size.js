/**
 * reduce a string of data into a defined length of chunks
 * @param {String} str input string
 * @param {Number} len length of chunks
 * @return {Array} chunks as array
 */
function chunkString(str, len) {
  var _size = Math.ceil(str.length/len),
      _ret  = new Array(_size),
      _offset
  ;

  for (var _i=0; _i<_size; _i++) {
    _offset = _i * len;
    _ret[_i] = str.substring(_offset, _offset + len);
  }

  return _ret;
}