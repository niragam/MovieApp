#ifndef MOVIEMANAGER_H
#define MOVIEMANAGER_H

#include "user.h"

#include <vector>
#include <string>
#include <shared_mutex>
#include <mutex>


class MovieManager
{
private:
    std::vector<User> users; // set of all the users in the program.
    mutable std::shared_mutex managerMutex;

public:
    bool addUser(const std::string &userId);                                                       // adding the user to the program.
    User getUser(const std::string &userId);                                                       // getting the user.
    bool addMovies(const std::string &userId, const std::vector<std::string> &movieIds);     // add movies to this given user.
    bool deleteMovies(const std::string &userId, const std::vector<std::string> &movieIds);     // delete movies to this given user.
    void saveData(const std::string &filename) const;                                                    // saving the data to this file.
    void loadData(const std::string &filename);                                                          // loading the data from this file.
    int countCommonMovies(User user1, User user2);                                                       // count the amount of common movies between users.
    std::vector<std::string> recommendMovies(std::string userid, std::string movieId); // algorythm for calculatr recommendation
};

#endif