/**
 * get mime type based on file extension
 * @param {String} filename
 * @return {String}
 */
function getMime(file) {
  // get extension
  var ext = file.split('.').pop();
  var extList = {
    css: "text/css",
    js: "application/javascript",
    gif: "image/gif",
    jpg: "image/jpeg",
    png: "image/png",
    html: "text/html"
  };
  return extList[ext] || 'text/plain';
}