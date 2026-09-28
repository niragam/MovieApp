#include "gtest/gtest.h"
#include "MovieManager.h"
#include "user.h"
#include "App.h"
#include <atomic>
#include <cstdio>
#include <fstream>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

// clean up the file
void cleanUpFile(const std::string &filename)
{
    std::remove(filename.c_str());
    std::remove((filename + ".tmp").c_str());
}

// Define the MovieRecommenderTest class
class MovieRecommenderTest : public testing::Test
{
protected:
    MovieManager manager; // setting up a manager
    const std::string testFile = "testsMovies_user_data.txt"; // local to the test working dir

    void TearDown() override
    {
        cleanUpFile(testFile);
    }

    bool watched(const std::string &user, const std::string &movie)
    {
        auto found = manager.getUser(user);
        return found && found->hasWatched(movie);
    }
};

// ---- Users and movies ----

TEST_F(MovieRecommenderTest, AddUser_Success)
{
    EXPECT_TRUE(manager.addUser("101"));
    EXPECT_FALSE(manager.addUser("101"));
}

TEST_F(MovieRecommenderTest, AddMovies_Success)
{
    manager.addUser("101");
    std::vector<std::string> movies = {"1", "2", "3"};
    EXPECT_TRUE(manager.addMovies("101", movies));
    EXPECT_FALSE(manager.addMovies("102", movies)); // unknown user
    EXPECT_TRUE(watched("101", "1"));
    EXPECT_TRUE(watched("101", "3"));
    EXPECT_FALSE(watched("101", "4"));
}

TEST_F(MovieRecommenderTest, GetUnknownUserIsEmpty)
{
    EXPECT_FALSE(manager.getUser("nobody").has_value());
}

TEST_F(MovieRecommenderTest, AddMovies_Duplicate)
{
    manager.addUser("101");
    EXPECT_TRUE(manager.addMovies("101", {"1", "2", "3"}));
    EXPECT_TRUE(manager.addMovies("101", {"2", "3"}));
    EXPECT_EQ(manager.getUser("101")->getMovies().size(), 3u);
}

TEST_F(MovieRecommenderTest, AddUserMovies_CreatesUserIfMissing)
{
    manager.addUserMovies("new", {"a", "b"});
    manager.addUserMovies("new", {"b", "c"});
    ASSERT_TRUE(manager.getUser("new").has_value());
    EXPECT_EQ(manager.getUser("new")->getMovies().size(), 3u);
}

TEST_F(MovieRecommenderTest, DeleteMovies)
{
    manager.addUser("101");
    manager.addMovies("101", {"1", "2", "3"});
    EXPECT_TRUE(manager.deleteMovies("101", {"1", "2"}));
    EXPECT_FALSE(watched("101", "1"));
    EXPECT_TRUE(watched("101", "3"));
    EXPECT_FALSE(manager.deleteMovies("999", {"1"})); // unknown user
    EXPECT_FALSE(manager.deleteMovies("101", {"999"})); // not watched
}

TEST_F(MovieRecommenderTest, DeleteMovies_IsAllOrNothing)
{
    manager.addUser("101");
    manager.addMovies("101", {"1", "2"});
    EXPECT_FALSE(manager.deleteMovies("101", {"1", "missing"}));
    EXPECT_TRUE(watched("101", "1")); // nothing removed
}

// ---- Persistence ----

TEST_F(MovieRecommenderTest, SaveData)
{
    manager.addUser("101");
    EXPECT_TRUE(manager.addMovies("101", {"1", "2"}));
    manager.saveData(testFile);

    std::ifstream file(testFile);
    ASSERT_TRUE(file.is_open());
    std::string line;
    std::getline(file, line);
    EXPECT_EQ(line, "101 1 2");
    // Written via a temp file that is renamed into place
    EXPECT_FALSE(std::ifstream(testFile + ".tmp").good());
}

TEST_F(MovieRecommenderTest, LoadData)
{
    std::ofstream file(testFile);
    file << "101 1 2\n";
    file << "\n"; // blank lines are ignored
    file << "102 3 4\n";
    file.close();

    manager.loadData(testFile);

    EXPECT_TRUE(watched("101", "1"));
    EXPECT_TRUE(watched("102", "4"));
    EXPECT_FALSE(manager.getUser("").has_value());
}

TEST_F(MovieRecommenderTest, Persistence_EndToEnd)
{
    manager.addUser("101");
    manager.addMovies("101", {"1", "2"});
    manager.saveData(testFile);

    MovieManager newManager;
    newManager.loadData(testFile);

    EXPECT_TRUE(newManager.getUser("101")->hasWatched("1"));
    EXPECT_TRUE(newManager.getUser("101")->hasWatched("2"));
}

// ---- Recommendation algorithm ----

// Hand-worked example. U={A,B,C}; similarities: V1=2, V2=1, V3=1, V4=3 (didn't watch M),
// V5=0, V6=1. Scores: X=2+1=3, Y=1+1=2, P=1, Z=1 (P before Z by id). Q is excluded
// because V4 did not watch M; W because V5 has similarity 0.
TEST_F(MovieRecommenderTest, Recommend_HandWorkedExample)
{
    manager.addUserMovies("U", {"A", "B", "C"});
    manager.addUserMovies("V1", {"A", "B", "M", "X"});
    manager.addUserMovies("V2", {"A", "M", "X", "Y"});
    manager.addUserMovies("V3", {"C", "M", "Y", "Z"});
    manager.addUserMovies("V4", {"A", "B", "C", "Q"});
    manager.addUserMovies("V5", {"M", "W"});
    manager.addUserMovies("V6", {"B", "M", "P"});
    std::vector<std::string> expected = {"X", "Y", "P", "Z"};
    EXPECT_EQ(manager.recommendMovies("U", "M"), expected);
}

// Pins an exact 10-item order that includes several ties (106/111, 110/112/113, 107..114)
TEST_F(MovieRecommenderTest, Recommend_ExactOrderWithTies)
{
    manager.addUserMovies("1", {"100", "101", "102", "103"});
    manager.addUserMovies("2", {"101", "102", "104", "105", "106"});
    manager.addUserMovies("3", {"100", "104", "105", "107", "108"});
    manager.addUserMovies("4", {"101", "105", "106", "107", "109", "110"});
    manager.addUserMovies("5", {"100", "102", "103", "105", "108", "111"});
    manager.addUserMovies("6", {"100", "103", "104", "110", "111", "112", "113"});
    manager.addUserMovies("7", {"102", "105", "106", "107", "108", "109", "110"});
    manager.addUserMovies("8", {"101", "104", "105", "106", "109", "111", "114"});
    manager.addUserMovies("9", {"100", "103", "105", "107", "112", "113", "115"});
    manager.addUserMovies("10", {"100", "102", "105", "106", "107", "109", "110", "116"});

    std::vector<std::string> expected = {"105", "106", "111", "110", "112", "113", "107", "108", "109", "114"};
    EXPECT_EQ(manager.recommendMovies("1", "104"), expected);
}

TEST_F(MovieRecommenderTest, Recommend_CapsAtTenWithIdTieBreak)
{
    // One similar user who watched M and 15 other movies: all tie on score 1
    manager.addUserMovies("U", {"shared"});
    std::vector<std::string> theirs = {"shared", "M"};
    for (int i = 0; i < 15; ++i)
    {
        theirs.push_back("m" + std::to_string(10 + i)); // m10..m24, same length ids
    }
    manager.addUserMovies("V", theirs);
    auto result = manager.recommendMovies("U", "M");
    ASSERT_EQ(result.size(), 10u);
    EXPECT_EQ(result.front(), "m10");
    EXPECT_EQ(result.back(), "m19");
}

TEST_F(MovieRecommenderTest, Recommend_ExcludesWatchedAndReferenceMovie)
{
    manager.addUserMovies("U", {"a", "b"});
    manager.addUserMovies("V", {"a", "b", "M", "c"});
    std::vector<std::string> expected = {"c"};
    EXPECT_EQ(manager.recommendMovies("U", "M"), expected);
}

// Chosen behaviour: users with similarity 0 are not candidates (they add 0 anyway), so a
// user sharing nothing with anyone who watched M gets no recommendations.
TEST_F(MovieRecommenderTest, Recommend_ZeroSimilarityGivesNothing)
{
    manager.addUserMovies("U", {"x"});
    manager.addUserMovies("V", {"M", "K"});
    EXPECT_TRUE(manager.recommendMovies("U", "M").empty());
    manager.addUser("Empty");
    EXPECT_TRUE(manager.recommendMovies("Empty", "M").empty());
}

TEST_F(MovieRecommenderTest, Recommend_UnknownUserOrMovieIsEmpty)
{
    manager.addUserMovies("U", {"a"});
    manager.addUserMovies("V", {"a", "M", "c"});
    EXPECT_TRUE(manager.recommendMovies("ghost", "M").empty());
    EXPECT_TRUE(manager.recommendMovies("U", "never-watched").empty());
}

TEST_F(MovieRecommenderTest, Recommend_AllMoviesWatched)
{
    manager.addUserMovies("101", {"100", "101", "102", "103"});
    manager.addUserMovies("102", {"100", "101", "102", "103"});
    EXPECT_TRUE(manager.recommendMovies("101", "102").empty());
}

// A user whose id is "0" is a normal user (there is no sentinel id any more)
TEST_F(MovieRecommenderTest, UserIdZeroIsOrdinary)
{
    manager.addUserMovies("0", {"a"});
    manager.addUserMovies("V", {"a", "M", "c"});
    std::vector<std::string> expected = {"c"};
    EXPECT_EQ(manager.recommendMovies("0", "M"), expected);
}

// ---- Concurrency (run under -DSANITIZE=thread to detect races) ----

TEST_F(MovieRecommenderTest, ConcurrentReadsWritesAndSaves)
{
    for (int u = 0; u < 20; ++u)
    {
        manager.addUserMovies("u" + std::to_string(u), {"M", "m" + std::to_string(u)});
    }
    std::atomic<bool> failed{false};
    std::vector<std::thread> threads;
    for (int t = 0; t < 8; ++t)
    {
        threads.emplace_back([this, t, &failed]
                             {
            for (int i = 0; i < 200; ++i) {
                std::string user = "u" + std::to_string((t * 7 + i) % 20);
                switch (i % 4) {
                case 0: manager.addUserMovies(user, {"m" + std::to_string(i)}); break;
                case 1: if (manager.recommendMovies(user, "M").size() > 10) failed = true; break;
                case 2: manager.getUser(user); break;
                case 3: if (t == 0) manager.saveData(testFile); break;
                }
            } });
    }
    for (auto &thread : threads)
    {
        thread.join();
    }
    EXPECT_FALSE(failed.load());
    MovieManager reloaded;
    manager.saveData(testFile);
    reloaded.loadData(testFile);
    EXPECT_EQ(reloaded.getUser("u0")->getMovies(), manager.getUser("u0")->getMovies());
}

// ---- App argument handling ----

TEST_F(MovieRecommenderTest, invalidInput)
{
    const char *argv[] = {"./main", "invalid"};
    App app;
    EXPECT_EQ(app.run(2, const_cast<char **>(argv)), 1);
}

TEST_F(MovieRecommenderTest, NoPort)
{
    const char *argv[] = {"./main"};
    App app;
    EXPECT_EQ(app.run(1, const_cast<char **>(argv)), 1);
}

// Run the tests
int main(int argc, char **argv)
{
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
