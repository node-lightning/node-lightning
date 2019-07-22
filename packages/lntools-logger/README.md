# @lntools/logger

Logger for LNTools modules that supports multi-transport, multi-area and instance based logging using starndard `util.format` sprintf value formatting.

### Getting Started

```bash
npm install @lntools/logger
```

To use the module you will need to create an area logger:

```javascript
const { manager } = require('@lntools/logger');

const area = 'TEST';
const instanceId = '12345678';
const log = manager.create(area, instanceId);
```

Then you can write `debug`, `info`, `warn`, and `error` messages by passing a message an a variadic number of values. You can pass text, values, sprintf syle strings, or a string and a list of values that will be appended to the end of the message.

```javascript
log.debug('test');
log.info('hello');
log.warn("i'm warning you");
log.error('something went bad');
log.error(new Error('booooom'));
log.info('some stuff %j', { ok: true, foo: 'bar' });
log.info('some values', 1, 2, 3, 4);
log.info('using %s formatting', 'sprintf');
```

The above message swould wlook similar to:

```
2019-07-22T13:28:37.854Z [DBG] TEST 12345678: test
2019-07-22T13:28:37.855Z [INF] TEST 12345678: hello
2019-07-22T13:28:37.855Z [WRN] TEST 12345678: i'm warning you
2019-07-22T13:28:37.855Z [ERR] TEST 12345678: something went bad
2019-07-22T13:28:37.856Z [ERR] TEST 12345678: Error: booooom
    at Object.<anonymous> (/Users/bmancini/code/go/src/github.com/altangent/lntools/packages/lntools-logger/test.js:9:11)
    at Module._compile (internal/modules/cjs/loader.js:776:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)
    at Module.load (internal/modules/cjs/loader.js:653:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)
    at Function.Module._load (internal/modules/cjs/loader.js:585:3)
    at Function.Module.runMain (internal/modules/cjs/loader.js:829:12)
    at startup (internal/bootstrap/node.js:283:19)
    at bootstrapNodeJSCore (internal/bootstrap/node.js:622:3)
2019-07-22T13:28:37.856Z [INF] TEST 12345678: some stuff {"ok":true,"foo":"bar"}
2019-07-22T13:28:37.856Z [INF] TEST 12345678: some values 1 2 3 4
2019-07-22T13:28:37.856Z [INF] TEST 12345678: using sprintf formatting
```

### Output

The default instance of the logger will output to:

- `console`
- `lntools.log` file located at the root of the application runtime
