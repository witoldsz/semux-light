
# Semux Light

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
