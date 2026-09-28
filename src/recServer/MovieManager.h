#ifndef MOVIEMANAGER_H
#define MOVIEMANAGER_H

#include "user.h"

#include <mutex>
#include <optional>
#include <shared_mutex>
#include <string>
#include <vector>

// Thread-safe store of users' watch histories plus the recommendation algorithm.
// Every public method takes managerMutex exactly once; private helpers assume it is held
// (std::shared_mutex is not recursive, so helpers must never lock it again).
class MovieManager
{
private:
    std::vector<User> users; // set of all the users in the program.
    mutable std::shared_mutex managerMutex;
    mutable std::mutex saveMutex; // serializes saveData; always taken before managerMutex

    User *findUser(const std::string &userId);             // requires managerMutex
    const User *findUser(const std::string &userId) const; // requires managerMutex
    static int countCommonMovies(const User &a, const User &b);

public:
    bool addUser(const std::string &userId);                                                       // false if the user already exists.
    std::optional<User> getUser(const std::string &userId) const;                                  // copy of the user, if present.
    bool addMovies(const std::string &userId, const std::vector<std::string> &movieIds);           // false if the user does not exist.
    void addUserMovies(const std::string &userId, const std::vector<std::string> &movieIds);       // add movies, creating the user if needed (atomic).
    bool deleteMovies(const std::string &userId, const std::vector<std::string> &movieIds);        // all-or-nothing; false if the user or any movie is missing.
    void saveData(const std::string &filename) const;                                              // atomically replaces the file.
    void loadData(const std::string &filename);                                                    // loading the data from this file.

    // Recommends up to 10 movies for userId based on reference movieId:
    // similarity(U,V) = movies watched by both; for every other user V who watched movieId
    // and has similarity > 0, each movie V watched (except movieId and movies U watched)
    // gains similarity(U,V). Sorted by score desc, then movie id asc.
    // Users with similarity 0 contribute nothing, so they are not candidates. An unknown
    // user has no history and gets no recommendations.
    std::vector<std::string> recommendMovies(const std::string &userId, const std::string &movieId) const;
};

#endif
