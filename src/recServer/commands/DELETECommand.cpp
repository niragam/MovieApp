#include "DELETECommand.h"

DELETECommand::DELETECommand(MovieManager &manager) : manager(manager) {}

// Function to add a user and their watched movies
void DELETECommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string userId;
    input >> userId; // Read user ID from input
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

        User user = manager.getUser(userId);
        if (user.getUserId() == "0")
        {
            output << "404 Not Found";
            return;
        }
        for (const auto &movie : movieIds)
        {
            if (!user.hasWatched(movie))
            {
                output << "404 Not Found";
                return;
            }
        }
        output << "204 No Content";
        manager.deleteMovies(userId, movieIds); // Delete movies from the user
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