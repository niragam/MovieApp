#include "PATCHCommand.h"

PATCHCommand::PATCHCommand(MovieManager &manager) : manager(manager) {}

// PATCH [userid] [movieid]...: adds watched movies, creating the user if needed
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
    // PATCH is an upsert: the web server sends a user's full history, so the
    // recommendation data can be rebuilt even if this server lost its state.
    manager.addUserMovies(userId, movieIds);
    output << "204 No Content";
}
