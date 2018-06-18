
# Semux Light

The Semux Light Mainnet client is here: https://semux.online

You can also use the testnet installation here: https://testnet.semux.online.
Just create a testnet wallet, copy your address, claim 1000 testnet SEM here: https://www.semux.org/testnetfaucet and spent as you will :)

You can also:
- build and deploy the semux-light-server and semux-light-front yourself (see below), or
- download the semux-light-front package from "Release" tab, unzip, open `index.html` and it will use my backend hosted at semux.online server.

---

![semux-light](https://github.com/witoldsz/semux-light/raw/assets/semux-light-testnet.png)

## Try it yourself:

- You must have a Semux node running with API enabled

  `semux/config/semux.properties`
  ```
  […]
  #================
  # API
  #================

  # Be sure to set up authentication first before enabling API
  api.enabled = true

  # Listening address and port
  api.listenIp = 127.0.0.1
  api.listenPort = 5171

  # Basic authentication
  api.username = user
  api.password = 123456
  […]

  ```

- git clone and build Semux Light
    ```
    $ git clone https://github.com/witoldsz/semux-light.git
    $ cd semux-light
    $ make clean build
    ```

- adjust ./start.sh and launch it
    ```
    $ cat start.sh
    […]
    export SEMUX_API_ADDR=http://127.0.0.1:5171
    export SEMUX_API_USER=user
    export SEMUX_API_USER=123456

    export SEMUX_LIGHT_PORT=8080
    export SEMUX_LIGHT_BIND_IP=127.0.0.1
    […]

    $ ./start.sh
    node build/app.js
    server listening: { address: '127.0.0.1', family: 'IPv4', port: 8080 }

    ```

- open browser location: http://localhost:8080
