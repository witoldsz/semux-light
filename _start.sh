#!/bin/bash

export SEMUX_API_ADDR=http://127.0.0.1:5171
export SEMUX_API_USER=user
export SEMUX_API_PASS=123456

export SEMUX_LIGHT_PORT=8080
export SEMUX_LIGHT_BIND_IP=127.0.0.1

cd server && make deploy
