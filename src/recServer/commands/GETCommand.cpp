#include "GETCommand.h"
#include <iostream>

GETCommand::GETCommand(MovieManager &manager) : manager(manager) {}

// Function to recommend movies for a user based on a reference movie
void GETCommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string userId, referenceMovieId, check;
    input >> userId;
    if (input >> referenceMovieId)
    {
        if (input >> check) // if there is more than 2 arguments
        {
            output << "400 Bad Request";
            return; // Ignore invalid input that cannot be converted
        }
    }
    else
    {
        output << "400 Bad Request";
        return; // Ignore invalid input that cannot be converted
    }

    try
    {
        std::vector<std::string> recommendations = manager.recommendMovies(userId, referenceMovieId); // Get recommendations
        if (recommendations.empty())
        {
            output << "200 Ok\n\n"; // End the recommendations with a newline
            return;                 // No recommendations, exit the function
        }

        if (recommendations[0] == "0")
        { // if there is no user like that
            output << "404 Not Found";
            return;
        }
        output << "200 Ok\n\n";

        for (std::string rec : recommendations) // Output recommendations
        {
            output << rec << " ";
        }
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
    catch (const std::runtime_error &e)
    {
        output << "400 Bad Request";
        return; // Ignore runtime errors, such as user not found
    }
}