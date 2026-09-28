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
    // Single-line response, like every other command
    output << "200 Ok\t"
           << "DELETE [userid] [movieid1] [movieid2] ...; "
           << "GET [userid] [movieid]; "
           << "PATCH [userid] [movieid1] [movieid2] ...; "
           << "POST [userid] [movieid1] [movieid2] ...; "
           << "help";
}
