// Network-level tests: run a real App on a local port and talk to it over TCP.
#include "gtest/gtest.h"
#include "App.h"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cstdio>
#include <fstream>
#include <string>
#include <thread>
#include <vector>

namespace
{
const std::string serverDataFile = "testsServer_user_data.txt";

// Starts one App for the whole test binary (App::run never returns).
int serverPort()
{
    static int port = []
    {
        std::remove(serverDataFile.c_str());
        int chosen = 20000 + (getpid() % 20000);
        static std::string portArg = std::to_string(chosen);
        std::thread([]
                    {
                        // Intentionally leaked: the server threads outlive main(), so the App
                        // must never be destroyed by static destructors at exit.
                        App *app = new App(serverDataFile);
                        static char prog[] = "movieApp";
                        char *argv[] = {prog, portArg.data(), nullptr};
                        app->run(2, argv); })
            .detach();
        std::this_thread::sleep_for(std::chrono::milliseconds(300));
        return chosen;
    }();
    return port;
}

int connectToServer()
{
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(serverPort());
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);
    if (connect(fd, reinterpret_cast<sockaddr *>(&addr), sizeof(addr)) != 0)
    {
        close(fd);
        return -1;
    }
    timeval tv{5, 0};
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    return fd;
}

void sendAllBytes(int fd, const std::string &data)
{
    size_t sent = 0;
    while (sent < data.size())
    {
        ssize_t n = send(fd, data.data() + sent, data.size() - sent, MSG_NOSIGNAL);
        if (n <= 0)
            return;
        sent += static_cast<size_t>(n);
    }
}

// Reads until `lines` newline-terminated replies have arrived (or timeout/EOF).
std::string readLines(int fd, int lines)
{
    std::string data;
    char buf[1024];
    while (std::count(data.begin(), data.end(), '\n') < lines)
    {
        ssize_t n = recv(fd, buf, sizeof(buf), 0);
        if (n <= 0)
            break;
        data.append(buf, static_cast<size_t>(n));
    }
    return data;
}
} // namespace

// Regression test for the double close(): with fd reuse, a second close() on a
// recycled descriptor dropped other clients' connections under load.
TEST(ServerTest, ManyConcurrentClientsAllGetAResponse)
{
    int fd = connectToServer();
    ASSERT_GE(fd, 0);
    sendAllBytes(fd, "POST loadUser m0 m1\n");
    readLines(fd, 1);
    close(fd);

    std::atomic<int> answered{0};
    const int rounds = 3, clients = 150;
    for (int r = 0; r < rounds; ++r)
    {
        std::vector<std::thread> threads;
        for (int i = 0; i < clients; ++i)
        {
            threads.emplace_back([&answered, i]
                                 {
                int c = connectToServer();
                if (c < 0) return;
                sendAllBytes(c, "GET loadUser m" + std::to_string(i % 5) + "\n");
                std::string reply = readLines(c, 1);
                if (reply.rfind("200", 0) == 0) answered++;
                close(c); });
        }
        for (auto &t : threads)
            t.join();
    }
    EXPECT_EQ(answered.load(), rounds * clients);
}

// ---- Framing tests: drive App::handleClient directly over a socketpair ----

class FramingTest : public testing::Test
{
protected:
    const std::string dataFile = "testsFraming_user_data.txt";
    App app{dataFile};
    int fds[2] = {-1, -1};
    std::thread serverThread;

    void SetUp() override
    {
        std::remove(dataFile.c_str());
        ASSERT_EQ(socketpair(AF_UNIX, SOCK_STREAM, 0, fds), 0);
        timeval tv{5, 0};
        setsockopt(fds[0], SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
        serverThread = std::thread([this]
                                   { app.handleClient(fds[1]); close(fds[1]); });
    }

    void TearDown() override
    {
        shutdown(fds[0], SHUT_WR); // EOF ends the session
        serverThread.join();
        close(fds[0]);
        std::remove(dataFile.c_str());
    }

    std::vector<std::string> replies(int count)
    {
        std::string data = readLines(fds[0], count);
        std::vector<std::string> lines;
        size_t start = 0, nl;
        while ((nl = data.find('\n', start)) != std::string::npos)
        {
            lines.push_back(data.substr(start, nl - start));
            start = nl + 1;
        }
        return lines;
    }
};

TEST_F(FramingTest, CoalescedRequestsAreHandledSeparately)
{
    sendAllBytes(fds[0], "POST u1 m1\nPATCH u1 m2\nGET u1 m1\n");
    auto r = replies(3);
    ASSERT_EQ(r.size(), 3u);
    EXPECT_EQ(r[0], "201 Created");
    EXPECT_EQ(r[1], "204 No Content");
    EXPECT_EQ(r[2], "200 Ok");
    // No protocol words leaked into the user's history
    std::ifstream file(dataFile);
    std::string line;
    std::getline(file, line);
    EXPECT_EQ(line, "u1 m1 m2");
}

TEST_F(FramingTest, RequestSplitAcrossWritesIsReassembled)
{
    sendAllBytes(fds[0], "POST u1 ");
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    sendAllBytes(fds[0], "m1 m2\r\n");
    auto r = replies(1);
    ASSERT_EQ(r.size(), 1u);
    EXPECT_EQ(r[0], "201 Created");
}

TEST_F(FramingTest, EveryReplyIsOneTerminatedLine)
{
    sendAllBytes(fds[0], "POST a x y\nPOST b x z\nGET a x\nhelp\n");
    auto r = replies(4);
    ASSERT_EQ(r.size(), 4u);
    EXPECT_EQ(r[2], "200 Ok\tz");
    EXPECT_EQ(r[3].rfind("200 Ok\t", 0), 0u);
}

TEST_F(FramingTest, UnknownAndEmptyCommandsAreRejected)
{
    sendAllBytes(fds[0], "FOO bar\n\n");
    auto r = replies(2);
    ASSERT_EQ(r.size(), 2u);
    EXPECT_EQ(r[0], "400 Bad Request");
    EXPECT_EQ(r[1], "400 Bad Request");
}

TEST_F(FramingTest, OverlongLineIsRejectedAndConnectionClosed)
{
    std::string huge(70 * 1024, 'a');
    sendAllBytes(fds[0], huge);
    auto r = replies(1);
    ASSERT_EQ(r.size(), 1u);
    EXPECT_EQ(r[0], "400 Bad Request");
    char c;
    EXPECT_LE(recv(fds[0], &c, 1, 0), 0); // server closed the session (EOF or reset)
}

TEST_F(FramingTest, PatchCreatesUnknownUserAndGetOfUnknownUserIsEmpty)
{
    sendAllBytes(fds[0], "PATCH newUser m1 m2\nGET ghost m1\nPATCH other m1 m3\nGET newUser m1\n");
    auto r = replies(4);
    ASSERT_EQ(r.size(), 4u);
    EXPECT_EQ(r[0], "204 No Content");
    EXPECT_EQ(r[1], "200 Ok");
    EXPECT_EQ(r[2], "204 No Content");
    EXPECT_EQ(r[3], "200 Ok\tm3");
}
