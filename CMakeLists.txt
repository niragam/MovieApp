cmake_minimum_required(VERSION 3.10)

project(MovieRecommendations)

# Set C++17 standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

set(SANITIZE "" CACHE STRING "Sanitizer to enable (thread, address)")
if(SANITIZE)
  add_compile_options(-fsanitize=${SANITIZE} -g -O1 -fno-omit-frame-pointer)
  add_link_options(-fsanitize=${SANITIZE})
endif()

option(BUILD_TESTS "Build the gtest test executables" ON)

# Include directories
include_directories(src/recServer)

# Add library
add_library(movie_lib
  src/recServer/MovieManager.cpp
  src/recServer/user.cpp
  src/recServer/App.cpp
  src/recServer/commands/POSTCommand.cpp
  src/recServer/commands/PATCHCommand.cpp
  src/recServer/commands/GETCommand.cpp
  src/recServer/commands/DELETECommand.cpp
  src/recServer/commands/helpCommand.cpp
  src/recServer/threadpool/ThreadPool.cpp
  )

# Add the necessary pthread library for multi-threading
target_link_libraries(movie_lib pthread)

# Add main executable
add_executable(movieApp src/recServer/main.cpp)
target_link_libraries(movieApp movie_lib pthread)

if(BUILD_TESTS)
  enable_testing()

  include(FetchContent)
  FetchContent_Declare(
    googletest
    URL https://github.com/google/googletest/archive/refs/tags/release-1.11.0.zip
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
  )
  set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
  FetchContent_MakeAvailable(googletest)

  add_executable(testsMovies src/recServer/tests/testsMovies.cpp)
  target_link_libraries(testsMovies gtest_main movie_lib pthread)
  add_test(NAME testsMovies COMMAND testsMovies)

  add_executable(testsServer src/recServer/tests/testsServer.cpp)
  target_link_libraries(testsServer gtest_main movie_lib pthread)
  add_test(NAME testsServer COMMAND testsServer)
endif()
