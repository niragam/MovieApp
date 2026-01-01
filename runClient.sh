#!/bin/bash

if [ "$#" -ne 2 ]; then
    exit 1
fi

IP_ADDRESS=$1
PORT=$2

python3 src/client.py $IP_ADDRESS $PORT