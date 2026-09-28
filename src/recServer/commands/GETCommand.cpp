#include "GETCommand.h"

GETCommand::GETCommand(MovieManager &manager) : manager(manager) {}

// GET [userid] [movieid]: "200 Ok" plus "\t<id1> <id2> ..." when there are recommendations
void GETCommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string userId, referenceMovieId, extra;
    if (!(input >> userId >> referenceMovieId) || (input >> extra))
    {
        output << "400 Bad Request"; // exactly two arguments are required
        return;
    }

    std::vector<std::string> recommendations = manager.recommendMovies(userId, referenceMovieId);
    output << "200 Ok";
    for (size_t i = 0; i < recommendations.size(); ++i)
    {
        output << (i ? " " : "\t") << recommendations[i];
    }
}
