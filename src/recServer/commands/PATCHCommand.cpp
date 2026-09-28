#include "PATCHCommand.h"

PATCHCommand::PATCHCommand(MovieManager &manager) : manager(manager) {}

// Adds watched movies to a user, creating the user if needed
void PATCHCommand::execute(std::istringstream &input, std::ostream &output)
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