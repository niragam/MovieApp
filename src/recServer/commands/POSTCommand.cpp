#include "POSTCommand.h"

POSTCommand::POSTCommand(MovieManager &manager) : manager(manager) {}

void POSTCommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string userId;
    input >> userId;         // Read user ID from input
    if (input.str().empty()) // if there is jusr one argument
    {
        output << "400 Bad Request";
        return; // Ignore invalid input that cannot be converted
    }
    try
    {
        std::vector<std::string> movieIds;
        std::string movieId;
        while (input >> movieId) // Read movie IDs from input
        {
            movieIds.push_back(movieId);                     // Add movie ID to the list
        }
        User user = manager.getUser(userId);

        if (movieIds.empty())
        {
            output << "400 Bad Request";
            return;
        }

        if (user.getUserId() != "0")
        {
            output << "404 Not Found";
            return;
        }

        output << "201 Created";
        manager.addUser(userId);             // Add user to the manager
        manager.addMovies(userId, movieIds); // Add movies to the user
    }
    catch (const std::invalid_argument &e)
    {
        output << "400 Bad Request";
        return; // Ignore invalid input that cannot be converted
    }
    catch (const std::out_of_range &e)
    {
        output << "400 Bad Request";
        return; // Ignore input values that are out of range
    }
}