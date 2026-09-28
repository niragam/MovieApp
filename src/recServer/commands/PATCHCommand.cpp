#include "PATCHCommand.h"

PATCHCommand::PATCHCommand(MovieManager &manager) : manager(manager) {}

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
    output << (manager.addMovies(userId, movieIds) ? "204 No Content" : "404 Not Found");
}
