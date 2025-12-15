function info(...args) { console.log(...args); }
function warn(...args) { console.warn(...args); }
function error(...args) { console.error(...args); }
function debug(...args) { if (process.env.R3ND_DEBUG) console.debug(...args); }

module.exports = { info, warn, error, debug };
