// ThreadPool.cpp
#include "ThreadPool.h"
#include <unistd.h> // For close()
#include <iostream>

ThreadPool::ThreadPool(size_t numThreads, std::function<void(int)> handler) : stop(false), clientHandler(handler) {
    for (size_t i = 0; i < numThreads; ++i) {
        workers.emplace_back([this]() { workerFunction(); });
    }
}

ThreadPool::~ThreadPool() {
    {
        std::unique_lock<std::mutex> lock(queueMutex);
        stop = true;
    }

    condition.notify_all();
    for (std::thread &worker : workers) {
        if (worker.joinable()) {
            worker.join();
        }
    }
}

void ThreadPool::addTask(int clientSocket) {
    {
        std::unique_lock<std::mutex> lock(queueMutex);
        tasks.push(clientSocket);
    }
    condition.notify_one();
}

void ThreadPool::workerFunction() {
    while (true) {
        int clientSocket;
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            condition.wait(lock, [this]() { return stop || !tasks.empty(); });

            if (stop && tasks.empty())
                return;

            clientSocket = tasks.front();
            tasks.pop();
        }

        // Process the client outside the critical section
        clientHandler(clientSocket);

        // Close the client socket after processing
        close(clientSocket);
    }
}
