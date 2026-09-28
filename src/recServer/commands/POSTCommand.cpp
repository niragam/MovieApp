#include "POSTCommand.h"

POSTCommand::POSTCommand(MovieManager &manager) : manager(manager) {}

// POST [userid] [movieid]...: creates a user with watched movies; 404 if the user exists
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
    // addUser checks and inserts under one lock, so two concurrent POSTs cannot both win
    if (!manager.addUser(userId))
    {
        output << "404 Not Found";
        return;
    }
    manager.addMovies(userId, movieIds);
    output << "201 Created";
}
