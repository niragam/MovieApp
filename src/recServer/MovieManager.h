#ifndef MOVIEMANAGER_H
#define MOVIEMANAGER_H

#include "user.h"

#include <mutex>
#include <optional>
#include <shared_mutex>
#include <string>
#include <unordered_map>
#include <vector>

class MovieManager
{
private:
    std::unordered_map<std::string, User> users;
    mutable std::shared_mutex managerMutex;
    mutable std::mutex saveMutex;
    User *findUser(const std::string &userId);
    const User *findUser(const std::string &userId) const;
    User &getOrCreateUser(const std::string &userId);
    static int countCommonMovies(const User &a, const User &b);

public:
    bool addUser(const std::string &userId);
    std::optional<User> getUser(const std::string &userId) const;
    bool addMovies(const std::string &userId, const std::vector<std::string> &movieIds);
    void addUserMovies(const std::string &userId, const std::vector<std::string> &movieIds);
    bool deleteMovies(const std::string &userId, const std::vector<std::string> &movieIds);
    void saveData(const std::string &filename) const;
    void loadData(const std::string &filename); // loading the data from this file.

    std::vector<std::string> recommendMovies(const std::string &userId, const std::string &movieId) const;
};

#endif
