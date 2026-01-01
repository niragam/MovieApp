#include "helpCommand.h"
#include <iostream>

// Function to display help information
void helpCommand::execute(std::istringstream &input, std::ostream &output)
{
    std::string check;;
    if (input >> check) { // if there is more than 0 arguments 
        output << "400 Bad Request";
        return; // Ignore invalid input that cannot be converted
    }
    output << "200 Ok\n\n"
           << "DELETE, arguments: [userid] [movieid1] [movieid2] ...\n"
           << "GET, arguments: [userid] [movieid]\n"
           << "PATCH, arguments: [userid] [movieid1] [movieid2] ...\n"
           << "POST, arguments: [userid] [movieid1] [movieid2] ...\n"
           << "help";
}
