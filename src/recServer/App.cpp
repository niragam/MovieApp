#include "App.h"
#include "threadpool/ThreadPool.h"

#include <algorithm>
#include <cerrno>
#include <csignal>
#include <iostream>
#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <chrono>
#include <sys/time.h>
#include <thread>
#include <vector>

App::App(std::string dataFile) : dataFile(std::move(dataFile))
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
    // A client that disconnects mid-reply must not kill the server (send uses MSG_NOSIGNAL too).
    std::signal(SIGPIPE, SIG_IGN);
    try
    {
        int port = std::stoi(argv[1]);  // Convert the port argument to an integer
        struct sockaddr_in address;
        manager.loadData(dataFile);  // Load saved data from file
        if (initServer(port, address) != 0)  // Initialize the server
        {
            return 1;  // Return error if server initialization fails
        }
        acceptMultipleClients(address);  // Start accepting clients

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
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) < 0)  // Create the socket
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

// Idle clients are disconnected after this long, so they cannot pin a worker forever.
static const int CLIENT_RECEIVE_TIMEOUT_SECONDS = 30;

// Accepts client connections and hands each one to the thread pool
void App::acceptMultipleClients(struct sockaddr_in &address)
{
    socklen_t addrlen = sizeof(address);
    // One worker per hardware thread (hardware_concurrency() may report 0)
    size_t workers = std::max(1u, std::thread::hardware_concurrency());
    ThreadPool pool(workers, [this](int client_socket) { handleClient(client_socket); });
    while (true)
    {
        int new_socket = accept(server_fd, (struct sockaddr *)&address, &addrlen);
        if (new_socket < 0)
        {
            if (errno == EMFILE || errno == ENFILE)
            {
                // Out of descriptors: back off instead of spinning at 100% CPU
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
            continue;
        }
        timeval timeout{CLIENT_RECEIVE_TIMEOUT_SECONDS, 0};
        setsockopt(new_socket, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
        pool.addTask(new_socket);  // The pool worker owns the socket from here on
    }
}

// Maximum accepted request line length; longer lines are rejected and the connection closed.
static const size_t MAX_LINE_LENGTH = 64 * 1024;

// Writes the whole buffer, retrying on partial writes. Returns false if the peer is gone.
static bool sendAll(int socket, const std::string &data)
{
    size_t sent = 0;
    while (sent < data.size())
    {
        ssize_t n = send(socket, data.data() + sent, data.size() - sent, MSG_NOSIGNAL);
        if (n < 0 && errno == EINTR)
        {
            continue;
        }
        if (n <= 0)
        {
            return false;
        }
        sent += static_cast<size_t>(n);
    }
    return true;
}

// Executes one request line and returns the newline-terminated response.
std::string App::processLine(const std::string &line)
{
    std::istringstream input(line);
    std::string command;
    input >> command;
    std::ostringstream output;
    if (executeCommand(command, input, output))
    {
        manager.saveData(dataFile);  // Persist only after commands that can change data
    }
    return output.str() + "\n";
}

// Protocol: every request is one line terminated by '\n' (a trailing '\r' is ignored),
// and every response is exactly one line terminated by '\n'. TCP is a byte stream, so
// bytes are buffered until complete lines are available; one read may carry several
// requests, or only part of one.
void App::handleClient(int client_socket)
{
    std::string buffer;
    char chunk[4096];
    while (true)
    {
        size_t newline;
        while ((newline = buffer.find('\n')) != std::string::npos)
        {
            std::string line = buffer.substr(0, newline);
            buffer.erase(0, newline + 1);
            if (!line.empty() && line.back() == '\r')
            {
                line.pop_back();
            }
            if (!sendAll(client_socket, processLine(line)))
            {
                return;
            }
        }
        if (buffer.size() > MAX_LINE_LENGTH)
        {
            sendAll(client_socket, "400 Bad Request\n");
            return;
        }
        ssize_t bytes_read = read(client_socket, chunk, sizeof(chunk));
        if (bytes_read < 0 && errno == EINTR)
        {
            continue;
        }
        if (bytes_read <= 0)  // EOF, error or receive timeout: end the session
        {
            return;
        }
        buffer.append(chunk, static_cast<size_t>(bytes_read));
    }
    // The socket is closed by the thread pool worker that owns it, not here.
}

bool App::executeCommand(const std::string &name, std::istringstream &input, std::ostringstream &output)
{
    auto it = commands.find(name);
    if (it == commands.end())
    {
        output << "400 Bad Request";  // Unknown command
        return false;
    }
    it->second->execute(input, output);
    return it->second->mutates();
}