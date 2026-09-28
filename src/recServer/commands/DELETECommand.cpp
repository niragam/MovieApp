#include "DELETECommand.h"

DELETECommand::DELETECommand(MovieManager &manager) : manager(manager) {}

// DELETE [userid] [movieid]...: removes watched movies; 404 if the user or any movie is missing
void DELETECommand::execute(std::istringstream &input, std::ostream &output)
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
    // Checked and applied atomically inside the manager
    output << (manager.deleteMovies(userId, movieIds) ? "204 No Content" : "404 Not Found");
}
