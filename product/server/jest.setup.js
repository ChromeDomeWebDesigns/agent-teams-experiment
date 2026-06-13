// Polyfill web globals that `undici` (pulled in transitively by
// `@firebase/rules-unit-testing`) references at module-load time. Jest's `node`
// test environment does not expose these by default, which otherwise throws
// "ReferenceError: ReadableStream is not defined" before any rules test can run.
// We only assign each global when it is missing, so the unit suites are unaffected.
const {
  ReadableStream,
  WritableStream,
  TransformStream,
} = require('node:stream/web')
const { TextEncoder, TextDecoder } = require('node:util')
const { MessageChannel, MessagePort } = require('node:worker_threads')

const polyfills = {
  ReadableStream,
  WritableStream,
  TransformStream,
  TextEncoder,
  TextDecoder,
  MessageChannel,
  MessagePort,
}

for (const [name, value] of Object.entries(polyfills)) {
  if (typeof globalThis[name] === 'undefined') {
    globalThis[name] = value
  }
}
