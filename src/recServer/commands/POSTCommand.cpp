#include "POSTCommand.h"

POSTCommand::POSTCommand(MovieManager &manager) : manager(manager) {}

void POSTCommand::execute(std::istringstream &input, std::ostream &output)
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
    if (!manager.addUser(userId))
    {
        output << "404 Not Found";
        return;
    }
    manager.addMovies(userId, movieIds);
    output << "201 Created";
}
