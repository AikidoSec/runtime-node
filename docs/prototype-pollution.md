# Protect against prototype pollution

Aikido guard can also protect your application against [prototype pollution attacks](https://www.aikido.dev/blog/prevent-prototype-pollution).

It works by calling [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) for some built-in JavaScript objects.

> The `Object.freeze()` method freezes an object. A frozen object can no longer be changed; freezing an object prevents new properties from being added to it, existing properties from being removed, prevents changing the enumerability, configurability, or writability of existing properties, and prevents the values of existing properties from being changed.

We believe that there are legitimate cases of prototype changes, but they should happen only during the initialization step. Hence, we recommend calling `preventPrototypePollution` when your application is initialised.

```js
import { preventPrototypePollution } from '@aikidosec/guard';

import express from 'express';

preventPrototypePollution(); // <-- Call this after your main imports

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```