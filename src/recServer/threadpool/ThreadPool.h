#ifndef THREADPOOL_H
#define THREADPOOL_H

#include <vector>
#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <functional>

class ThreadPool {
private:
    std::vector<std::thread> workers;
    std::queue<int> tasks; // Queue of client sockets
    std::mutex queueMutex;
    std::condition_variable condition;
    std::atomic<bool> stop;

    // Handler function to process client sockets
    std::function<void(int)> clientHandler;

    void workerFunction();

public:
    ThreadPool(size_t numThreads, std::function<void(int)> handler);
    ~ThreadPool();

    void addTask(int clientSocket);
};

#endif // THREADPOOL_H
