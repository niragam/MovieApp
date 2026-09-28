#include "GETCommand.h"

GETCommand::GETCommand(MovieManager &manager) : manager(manager) {}

void GETCommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string userId, referenceMovieId, extra;
    if (!(input >> userId >> referenceMovieId) || (input >> extra))
    {
        output << "400 Bad Request";
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
