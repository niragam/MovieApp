#include "PATCHCommand.h"

PATCHCommand::PATCHCommand(MovieManager &manager) : manager(manager) {}

// PATCH [userid] [movieid]...: adds watched movies to a user created earlier by POST
void PATCHCommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string userId;
    std::vector<std::string> movieIds;
    std::string movieId;
    input >> userId;
    while (input >> movieId)
    {
        movieIds.push_back(movieId);
    }
    if (movieIds.empty())
    {
        output << "400 Bad Request";
        return;
    }
    // Only valid for an existing user (checked and applied under one lock)
    output << (manager.addMovies(userId, movieIds) ? "204 No Content" : "404 Not Found");
}
