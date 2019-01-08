# cordant-google-utils

This package is meant to ease the usage of Google API for our usage.

Developed by [Cordant Group](https://cordantgroup.com)

## Usage

In order to use this package, first install it running the following

```bat
npm install cordant-google-utils
``` 

Import the package, within Javascript
```javascript
const GoogleUtils = require('cordant-google-utils');
```

 or Typescript
 ```typescript
import GoogleUtils from 'cordant-google-utils';
```

and use it in your code.

## Services

The current version covers the following services

- Impersonation through JWT tokens
- calendar
  - createEvent
