const { TextEncoder, TextDecoder } = require('util');

// Add TextEncoder and TextDecoder to the global object
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
