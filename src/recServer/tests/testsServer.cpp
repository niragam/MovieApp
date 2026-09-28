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

int serverPort()
{
    static int port = []
    {
        std::remove(serverDataFile.c_str());
        int chosen = 20000 + (getpid() % 20000);
        static std::string portArg = std::to_string(chosen);
        std::thread([]
                    {
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
}

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
        shutdown(fds[0], SHUT_WR);
        serverThread.join();
        close(fds[0]);
        std::remove(dataFile.c_str());
    }

    std::string readBytes(size_t count)
    {
        std::string data;
        char buf[1024];
        while (data.size() < count)
        {
            ssize_t n = recv(fds[0], buf, std::min(sizeof(buf), count - data.size()), 0);
            if (n <= 0)
                break;
            data.append(buf, static_cast<size_t>(n));
        }
        return data;
    }

    void expectReplies(const std::string &requests, const std::string &expected)
    {
        sendAllBytes(fds[0], requests);
        EXPECT_EQ(readBytes(expected.size()), expected);
    }
};

TEST_F(FramingTest, CoalescedRequestsAreHandledSeparately)
{
    expectReplies("POST u1 m1\nPATCH u1 m2\nGET u1 m1\n",
                  "201 Created\n204 No Content\n200 Ok\n\n\n");
    std::ifstream file(dataFile);
    std::string line;
    std::getline(file, line);
    EXPECT_EQ(line, "u1 m1 m2");
}

TEST_F(FramingTest, RequestSplitAcrossWritesIsReassembled)
{
    sendAllBytes(fds[0], "POST u1 ");
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    expectReplies("m1 m2\r\n", "201 Created\n");
}

TEST_F(FramingTest, GetReplyFormat)
{
    expectReplies("POST a x y\nPOST b x z w\nGET a x\n",
                  "201 Created\n201 Created\n200 Ok\n\nw z\n");
}

TEST_F(FramingTest, HelpListsCommandsAlphabeticallyWithHelpLast)
{
    expectReplies("help\n",
                  "DELETE, arguments: [userid] [movieid1] [movieid2] ...\n"
                  "GET, arguments: [userid] [movieid]\n"
                  "PATCH, arguments: [userid] [movieid1] [movieid2] ...\n"
                  "POST, arguments: [userid] [movieid1] [movieid2] ...\n"
                  "help\n");
}

TEST_F(FramingTest, UnknownAndMalformedCommandsAreRejected)
{
    expectReplies("FOO bar\n\nPOST onlyUser\nGET a\nhelp extra\n",
                  "400 Bad Request\n400 Bad Request\n400 Bad Request\n400 Bad Request\n400 Bad Request\n");
}

TEST_F(FramingTest, TabsAreNotSeparators)
{
    expectReplies("POST\tu1 m1\nPOST u1\tm1\nhelp\t\nPOST  u1   m1  \n",
                  "400 Bad Request\n400 Bad Request\n400 Bad Request\n201 Created\n");
}

TEST_F(FramingTest, UnknownUsersAre404ForPatchDeleteAndGet)
{
    expectReplies("PATCH ghost m1\nDELETE ghost m1\nGET ghost m1\nPOST u m1\nPOST u m2\nDELETE u m9\n",
                  "404 Not Found\n404 Not Found\n404 Not Found\n201 Created\n404 Not Found\n404 Not Found\n");
}

TEST_F(FramingTest, OverlongLineIsRejectedAndConnectionClosed)
{
    std::string huge(70 * 1024, 'a');
    expectReplies(huge, "400 Bad Request\n");
    char c;
    EXPECT_LE(recv(fds[0], &c, 1, 0), 0);
}
