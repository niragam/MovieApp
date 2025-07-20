#include "App.h"
#include "threadpool/ThreadPool.h"

#include <iostream>
#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <thread>
#include <vector>

const std::string App::dataFile = "data/user_data.txt";
int server_fd;

App::App()
{
    // Register commands for handling HTTP-like requests (POST, PATCH, GET, DELETE, help)
    commands["POST"] = std::make_unique<POSTCommand>(manager);
    commands["PATCH"] = std::make_unique<PATCHCommand>(manager);
    commands["GET"] = std::make_unique<GETCommand>(manager);
    commands["DELETE"] = std::make_unique<DELETECommand>(manager);
    commands["help"] = std::make_unique<helpCommand>();
}

int App::run(int argc, char **argv)
{
    if (argc != 2)  // Check if the correct number of arguments is provided
    {
        return 1;  // Return error if not
    }
    try
    {
        int port = std::stoi(argv[1]);  // Convert the port argument to an integer
        struct sockaddr_in address;
        manager.loadData(dataFile);  // Load saved data from file
        if (initServer(port, address) != 0)  // Initialize the server
        {
            return 1;  // Return error if server initialization fails
        }
        acceptMultipleClients(server_fd, address);  // Start accepting clients

        return 0;  // Success
    }
    catch (const std::exception &)
    {
        return 1;  // Return error if exception occurs (e.g., invalid port argument)
    }
}

// Initializes the server socket and binds it to the specified address and port
int App::initServer(int port, struct sockaddr_in &address)
{
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0)  // Create the socket
    {
        return 1;  // Return error code if socket creation fails
    }
    int opt = 1;
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0)  // Set socket options
    {
        return 1;
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);

    // Bind the socket to the address and port
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0)
    {
        return 1;  // Return error code if bind fails
    }
    if (listen(server_fd, SOMAXCONN) < 0)  // Start listening for incoming connections
    {
        return 1;
    }
    return 0;  // Success
}

// Accepts multiple client connections and creates a new thread for each client
void App::acceptMultipleClients(int server_fd, struct sockaddr_in &address)
{
    int new_socket;
    int addrlen = sizeof(address);
    // create a thread pool to handle client connections according to the number of threads in the system
    ThreadPool pool(std::thread::hardware_concurrency(), [this](int client_socket) { handleClient(client_socket); });
    while (true)
    {
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t *)&addrlen)) < 0)
        {
            continue;  // If accepting the client fails, try again
        }
        pool.addTask(new_socket);  // Add the client socket to the thread pool    
    }
}

void App::handleClient(int client_socket)
{
    while (true)
    {
        std::string received_message = receiveMessage(client_socket);
        if (received_message.empty())  // If no message is received, terminate the loop
        {
            break;
        }
        std::istringstream input(received_message);
        std::string command;
        input >> command;
        std::ostringstream output;
        executeCommand(command, input, output);  // Execute the command and capture the output
        std::string response = output.str();    // Convert output to string

        send(client_socket, response.c_str(), response.length(), 0);  // Send the response to the client
        manager.saveData(dataFile);  // Save data after handling each client
    }
    close(client_socket);  // Close the client socket after finishing the communication
}

// Receives a message from the client socket
std::string App::receiveMessage(int client_socket)
{
    std::vector<char> buffer(1024);  // Buffer to store incoming data
    std::string message;
    ssize_t bytes_read;

    // Read data until a newline or EOF is encountered
    while ((bytes_read = read(client_socket, buffer.data(), buffer.size())) > 0)
    {
        message.append(buffer.data(), bytes_read);
        if (message.find('\n') != std::string::npos)  // End of message found
        {
            break; 
        }
    }
    return message;
}

void App::executeCommand(const std::string &name, std::istringstream &input, std::ostringstream &output)
{
    auto it = commands.find(name);
    if (it != commands.end())  // If the command is found in the map
    {
        it->second->execute(input, output);  // Execute the corresponding command
    }
    else
    {
        output << "400 Bad Request";  // Return an error if command is not found
    }
}