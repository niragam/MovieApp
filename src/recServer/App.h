#ifndef APP_H
#define APP_H

#include "commands/ICommand.h"
#include "commands/POSTCommand.h"
#include "commands/PATCHCommand.h"
#include "commands/GETCommand.h"
#include "commands/DELETECommand.h"
#include "commands/helpCommand.h"
#include "MovieManager.h"

#include <map>
#include <string>
#include <sstream>
#include <memory>

// The App class handles the overall application functionality.
class App
{
private:
    MovieManager manager;  // Manages the movie-related data
    std::map<std::string, std::unique_ptr<ICommand>> commands;  // Stores available commands (e.g., POST, GET, etc.)
    std::string dataFile;  // Path to the data file where movie data is saved
    int server_fd = -1;

public:
    explicit App(std::string dataFile = "data/user_data.txt");

    bool executeCommand(const std::string &name, std::istringstream &input, std::ostringstream &output);

    std::string processLine(const std::string &line);

    // Handles the client communication by reading messages and sending responses
    void handleClient(int client_socket);

    // Initializes the server with the given port and address
    int initServer(int port, struct sockaddr_in &address);

    // Accepts multiple clients by continuously waiting for new connections
    void acceptMultipleClients(struct sockaddr_in &address);

    // Main function that runs the application, starting the server and accepting connections
    int run(int argc, char **argv);  
};

#endif
