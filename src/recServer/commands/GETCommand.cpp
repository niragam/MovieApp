#include "GETCommand.h"

GETCommand::GETCommand(MovieManager &manager) : manager(manager) {}

// GET [userid] [movieid]: "200 Ok", two newlines, then the recommendations separated by
// spaces (the server adds the final newline). 404 if the user was never created.
void GETCommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string userId, referenceMovieId, extra;
    if (!(input >> userId >> referenceMovieId) || (input >> extra))
    {
        output << "400 Bad Request"; // exactly two arguments are required
        return;
    }

    if (!manager.getUser(userId))
    {
        output << "404 Not Found";
        return;
    }

    std::vector<std::string> recommendations = manager.recommendMovies(userId, referenceMovieId);
    output << "200 Ok\n\n";
    for (size_t i = 0; i < recommendations.size(); ++i)
    {
        output << (i ? " " : "") << recommendations[i];
    }
}
