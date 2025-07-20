# **Movie Recommendation System**

## Overview

This project implements the server-side functionality for a movie recommendation application. It provides a RESTful API for user management, movie management, category management, and integrates with a recommendation system.

## Prerequisites

- Docker
- Docker Compose

## Installation

**Running the application**
- Go to the project folder in the terminal.
- Build and start the containers:

```bash
docker-compose up --build
```

- In a new terminal, run:

```bash
docker exec -it web-ser /bin/bash
```

Here you can run the curl commands

## Curl commands examples

Below are examples of how to interact with the API using `curl` commands. Replace the placeholder values (e.g. `<userID>`, `<movieID>`, `<categoryID>`, `<username>`, `<password>`, `<name>`, `<movie title>`, `<category name>`, `<query>`) with your actual data.

### Add User

```bash
curl -i -X POST http://localhost:3000/api/users \
    -H "Content-Type: application/json" \
    -d '{"username": "<username>", "password": "<password>", "name": "<name>"}'
```

### Get User Details
```bash
curl -i http://localhost:3000/api/users/<userID> \
    -H "userId: <userID>"
```


### Login User
```bash
curl -i -X POST http://localhost:3000/api/users/tokens \
    -H "Content-Type: application/json" \
    -d '{"username": "<username>", "password": "<password>"}'
```


### Create Category
```bash
curl -i -X POST http://localhost:3000/api/categories \
    -H "Content-Type: application/json" \
    -H "userId: <userID>" \
    -d '{"name": "<category name>"}'
```


### Return All Categories
```bash
curl -i http://localhost:3000/api/categories
```


### Return a Category with a Certain ID
```bash
curl -i http://localhost:3000/api/categories/<categoryID>
```


### Patch Category
```bash
curl -i -X PATCH http://localhost:3000/api/categories/<categoryID>  \
    -H "Content-Type: application/json" \
    -H "userId: <userID>" \
    -d '{"name": "<new category name>"}'
```


### Delete Category
```bash
curl -i -X DELETE http://localhost:3000/api/categories/<categoryID>  \
    -H "userId: <userID>"
```

### Add New Movie
```bash
curl -i -X POST http://localhost:3000/api/movies \
    -H "Content-Type: application/json" \
    -H "userId: <userID>" \
    -d '{"title": "<movie title>", "categories": ["<category name>","<category name>"]}'
```

### Get Category
```bash
curl -i http://localhost:3000/api/movies/<movieID>
```

### Get Movies by Category
```bash
curl -i http://localhost:3000/api/movies  \
    -H "userId: <userID>"
```

### Replace Movie with PUT
```bash
curl -i -X PUT http://localhost:3000/api/movies/<movieID>  \
    -H "Content-Type: application/json" \
    -H "userId: <userID>" \
    -d '{"title": "<Updated movie>", "categories": ["<category name>","<category name>"]}'
```


### Delete Movie
```bash
curl -i -X DELETE http://localhost:3000/api/movies/<movieID>  \
    -H "userId: <userID>"
```

### Add Movie to Watch History
```bash
curl -i -X POST http://localhost:3000/api/movies/<movieID>/recommend  \
    -H "userId: <userID>"
```

### Get Recommendations
```bash
curl -i http://localhost:3000/api/movies/<movieID>/recommend  \
    -H "userId: <userID>"
```

### Search Movies
```bash
curl -i http://localhost:3000/api/movies/search/<query>
```

## Run example
![1](Pictures/1.png)
![2](Pictures/2.png)
![3](Pictures/3.png)
![4](Pictures/4.png)
![5](Pictures/5.png)
![6](Pictures/6.png)
![7](Pictures/7.png)