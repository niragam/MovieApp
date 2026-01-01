#include "user.h"

User::User(const std::string& id) : id(id) {} // constructor.

const std::string& User::getUserId() const { // getting the id.
    return id;
}

const std::set<std::string>& User::getMovies() const { // getting the set of watched movies (of the user).
    return moviesWatched; 
}

bool User::hasWatched(const std::string& movieId) const { // checking if this user watched the movie.
    return moviesWatched.find(movieId) != moviesWatched.end();
}

bool User::addMovie(const std::string& movieId) { // adding the movie to this user's watched movies set.
    return moviesWatched.insert(movieId).second; 
}

bool User::deleteMovie(const std::string& movieId) { // deleting the movie to this user's watched movies set.
    return moviesWatched.erase(movieId) > 0; 
}



