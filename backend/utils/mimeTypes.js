import mime from 'mime-types';

function getMimeType(fileName) {
  return mime.lookup(fileName);
}

export default getMimeType;
