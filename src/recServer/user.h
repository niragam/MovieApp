#ifndef USER_H
#define USER_H

#include <string>
#include <set>

class User
{
private:
    std::string id; // uniqe id
    std::set<std::string> moviesWatched; // set of the movies the user has watched

public:
    User(const std::string &id); //constructor
    const std::string &getUserId() const; // getter for the user's id
    const std::set<std::string> &getMovies() const; // getter for the set of the movies the user has watched
    bool hasWatched(const std::string &movieId) const; // checks if the user has watched this movie
    bool addMovie(const std::string &movieId); //adding the movie to the userws movies list
    bool deleteMovie(const std::string& movieId); //deleting the movie to the userws movies list

    // Declare friend function
    friend bool operator<(const User &lhs, const User &rhs);
};

inline bool operator<(const User &lhs, const User &rhs)
{
    return lhs.id < rhs.id;
}

#endif
