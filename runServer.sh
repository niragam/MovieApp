#!/bin/bash

if [ "$#" -ne 1 ]; then
    exit 1
fi

PORT=$1

cd /usr/src/project/build
./movieApp $PORT