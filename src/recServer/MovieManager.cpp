#include "MovieManager.h"

#include <algorithm>
#include <cstdio>
#include <fstream>
#include <mutex>
#include <sstream>
#include <unordered_map>

#define MAX_RECOMMENDATIONS 10

User *MovieManager::findUser(const std::string &userId)
{
    auto it = users.find(userId);
    return it == users.end() ? nullptr : &it->second;
}

const User *MovieManager::findUser(const std::string &userId) const
{
    return const_cast<MovieManager *>(this)->findUser(userId);
}

User &MovieManager::getOrCreateUser(const std::string &userId)
{
    return users.try_emplace(userId, userId).first->second;
}

// Adds a new user to the system
bool MovieManager::addUser(const std::string &userId)
{
    std::unique_lock<std::shared_mutex> lock(managerMutex);
    return users.try_emplace(userId, userId).second;
}

std::optional<User> MovieManager::getUser(const std::string &userId) const
{
    std::shared_lock<std::shared_mutex> lock(managerMutex);
    const User *user = findUser(userId);
    if (!user)
    {
        return std::nullopt;
    }
    return *user;
}

// Adds movies to the specified user's list
bool MovieManager::addMovies(const std::string &userId, const std::vector<std::string> &movieIds)
{
    std::unique_lock<std::shared_mutex> lock(managerMutex);
    User *user = findUser(userId);
    if (!user)
    {
        return false;
    }
    for (const auto &movieId : movieIds)
    {
        user->addMovie(movieId);
    }
    return true;
}

void MovieManager::addUserMovies(const std::string &userId, const std::vector<std::string> &movieIds)
{
    std::unique_lock<std::shared_mutex> lock(managerMutex);
    User &user = getOrCreateUser(userId);
    for (const auto &movieId : movieIds)
    {
        user.addMovie(movieId);
    }
}

bool MovieManager::deleteMovies(const std::string &userId, const std::vector<std::string> &movieIds)
{
    std::unique_lock<std::shared_mutex> lock(managerMutex);
    User *user = findUser(userId);
    if (!user)
    {
        return false;
    }
    for (const auto &movieId : movieIds)
    {
        if (!user->hasWatched(movieId))
        {
            return false;
        }
    }
    for (const auto &movieId : movieIds)
    {
        user->deleteMovie(movieId);
    }
    return true;
}

void MovieManager::saveData(const std::string &filename) const
{
    std::lock_guard<std::mutex> saveLock(saveMutex);
    std::shared_lock<std::shared_mutex> lock(managerMutex);
    const std::string tmpName = filename + ".tmp";
    {
        std::ofstream file(tmpName, std::ios::trunc);
        if (!file)
        {
            return;
        }
        for (const auto &[userId, user] : users)
        {
            file << user.getUserId();
            for (const auto &movieId : user.getMovies())
            {
                file << " " << movieId;
            }
            file << "\n";
        }
        file.flush();
        if (!file)
        {
            std::remove(tmpName.c_str());
            return;
        }
    }
    std::rename(tmpName.c_str(), filename.c_str());
}

// Loads user data from a file
void MovieManager::loadData(const std::string &filename)
{
    std::ifstream file(filename);
    if (!file)
    {
        return;
    }

    std::string line;
    while (std::getline(file, line))
    {
        std::istringstream lineStream(line);
        std::string userId;
        if (!(lineStream >> userId))
        {
            continue;
        }
        std::vector<std::string> movieIds;
        std::string movieId;
        while (lineStream >> movieId)
        {
            movieIds.push_back(movieId);
        }
        addUserMovies(userId, movieIds);
    }
}

int MovieManager::countCommonMovies(const User &a, const User &b)
{
    const auto &smaller = a.getMovies().size() <= b.getMovies().size() ? a.getMovies() : b.getMovies();
    const User &larger = &smaller == &a.getMovies() ? b : a;
    int common = 0;
    for (const auto &movie : smaller)
    {
        if (larger.hasWatched(movie))
        {
            common++;
        }
    }
    return common;
}

std::vector<std::string> MovieManager::recommendMovies(const std::string &userId, const std::string &movieId) const
{
    std::shared_lock<std::shared_mutex> lock(managerMutex);
    std::vector<std::string> recommendations;

    const User *user = findUser(userId);
    if (!user)
    {
        return recommendations;
    }

    std::unordered_map<std::string, long long> movieRelevance;
    for (const auto &[otherId, other] : users)
    {
        if (otherId == userId || !other.hasWatched(movieId))
        {
            continue;
        }
        int similarity = countCommonMovies(*user, other);
        if (similarity == 0)
        {
            continue;
        }
        for (const std::string &candidate : other.getMovies())
        {
            if (candidate != movieId && !user->hasWatched(candidate))
            {
                movieRelevance[candidate] += similarity;
            }
        }
    }

    std::vector<std::pair<std::string, long long>> sorted(movieRelevance.begin(), movieRelevance.end());
    std::sort(sorted.begin(), sorted.end(),
              [](const auto &a, const auto &b)
              {
                  return (a.second > b.second) || ((a.second == b.second) && (a.first < b.first));
              });

    for (const auto &pair : sorted)
    {
        if (recommendations.size() >= MAX_RECOMMENDATIONS)
            break;
        recommendations.push_back(pair.first);
    }
    return recommendations;
}
