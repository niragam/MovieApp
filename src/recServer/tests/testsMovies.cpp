#include "gtest/gtest.h"
#include "MovieManager.h"
#include "user.h"
#include "App.h"
#include <fstream>
#include <sstream>
#include <vector>
#include <cstdio>
#include <iostream>

MovieManager manager;
// clean up the file
void cleanUpFile(const std::string &filename)
{
    std::remove(filename.c_str());
}

// Define the MovieRecommenderTest class
class MovieRecommenderTest : public testing::Test
{
protected:
    MovieManager manager; // setting up a manager
    const std::string testFile = "../data/user_data.txt";

    void TearDown() override
    {
        cleanUpFile(testFile);
    }
};

// Test adding a user
TEST_F(MovieRecommenderTest, AddUser_Success)
{
    EXPECT_TRUE(manager.addUser("101"));
    EXPECT_FALSE(manager.addUser("101"));
}

// Test adding movies
TEST_F(MovieRecommenderTest, AddMovies_Success)
{
    manager.addUser("101");
    std::vector<std::string> movies = {"1", "2", "3"}; // setting up the movies set
    EXPECT_TRUE(manager.addMovies("101", movies));
    EXPECT_FALSE(manager.addMovies("102", movies));
}

// Test adding invalid movies
TEST_F(MovieRecommenderTest, AddMovies_Invalid)
{
    manager.addUser("101");
    std::vector<std::string> movies = {"1", "2", "3"}; // setting up the movies set
    EXPECT_TRUE(manager.addMovies("101", movies));

    User user = manager.getUser("101");
    EXPECT_FALSE(user.hasWatched("4"));
    EXPECT_TRUE(user.hasWatched("1"));
    EXPECT_TRUE(user.hasWatched("3"));
}

// Test saving data to a file
TEST_F(MovieRecommenderTest, SaveData)
{
    manager.addUser("101");
    std::vector<std::string> movies = {"1", "2"}; // setting up the movies set
    EXPECT_TRUE(manager.addMovies("101", movies));

    manager.saveData(testFile); // saving all the data to the file

    std::ifstream file(testFile);
    if (!file.is_open())
    {
        std::cerr << "Failed to open file at path: " << testFile << std::endl;
    }
    ASSERT_TRUE(file.is_open());

    std::string line;
    std::getline(file, line);
    EXPECT_EQ(line, "101 1 2"); // checking if the file has these user and movies.

    file.close();
}

// Test loading data from a file
TEST_F(MovieRecommenderTest, LoadData)
{
    std::ofstream file(testFile);
    file << "101 1 2\n"; // inserting user and movies.
    file << "102 3 4\n"; // inserting user and movies.
    file.close();

    manager.loadData(testFile); // loading the data.

    EXPECT_TRUE(manager.getUser("101").hasWatched("1"));
    EXPECT_TRUE(manager.getUser("102").hasWatched("4"));
}

// Test if data saves from manager to manager
TEST_F(MovieRecommenderTest, Persistence_EndToEnd)
{
    manager.addUser("101");
    manager.addMovies("101", {"1", "2"});
    manager.saveData(testFile);

    MovieManager newManager;
    newManager.loadData(testFile); // loading the data.

    EXPECT_TRUE(newManager.getUser("101").hasWatched("1"));
    EXPECT_TRUE(newManager.getUser("101").hasWatched("2"));
}

// Test for movie recommendations
TEST_F(MovieRecommenderTest, ReturnsRecommendations)
{
    manager.addUser("101");
    manager.addMovies("101", {"100", "101", "102", "103", "106"});

    manager.addUser("102");
    manager.addMovies("102", {"100", "101", "104", "105", "109"});

    manager.addUser("103");
    manager.addMovies("103", {"100", "106", "107", "109", "110"});

    manager.addUser("104");
    manager.addMovies("104", {"105", "106", "108", "111", "112"});

    std::vector<std::string> recommendations = manager.recommendMovies("101", "104");

    EXPECT_FALSE(recommendations.empty());
    EXPECT_LE(recommendations.size(), 10);
}

// Test for movie recommendations (second test with different data)
TEST_F(MovieRecommenderTest, ReturnsRecommendations_SecondTest)
{
    manager.addUser("1");
    manager.addMovies("1", {"100", "101", "102", "103"});

    manager.addUser("2");
    manager.addMovies("2", {"101", "102", "104", "105", "106"});

    manager.addUser("3");
    manager.addMovies("3", {"100", "104", "105", "107", "108"});

    manager.addUser("4");
    manager.addMovies("4", {"101", "105", "106", "107", "109", "110"});

    manager.addUser("5");
    manager.addMovies("5", {"100", "102", "103", "105", "108", "111"});

    manager.addUser("6");
    manager.addMovies("6", {"100", "103", "104", "110", "111", "112", "113"});

    manager.addUser("7");
    manager.addMovies("7", {"102", "105", "106", "107", "108", "109", "110"});

    manager.addUser("8");
    manager.addMovies("8", {"101", "104", "105", "106", "109", "111", "114"});

    manager.addUser("9");
    manager.addMovies("9", {"100", "103", "105", "107", "112", "113", "115"});

    manager.addUser("10");
    manager.addMovies("10", {"100", "102", "105", "106", "107", "109", "110", "116"});

    std::vector<std::string> recommendations = manager.recommendMovies("1", "104");

    std::vector<std::string> expected = {"105", "106", "111", "110", "112", "113", "107", "108", "109", "114"};

    EXPECT_EQ(recommendations.size(), expected.size());
    for (size_t i = 0; i < expected.size(); ++i)
    {
        EXPECT_EQ(recommendations[i], expected[i]) << "Value at index " << i << " does not match.";
    }
}

// Test recommendations for a user with no watched movies
TEST_F(MovieRecommenderTest, Recommend_NoWatchedMovies)
{
    manager.addUser("101"); // User added without movies
    std::vector<std::string> recommendations = manager.recommendMovies("101", "104");
    EXPECT_TRUE(recommendations.empty()); // Recommendations should be empty
}

// Test recommendations when no similar users exist
TEST_F(MovieRecommenderTest, Recommend_NoSimilarUsers)
{
    manager.addUser("101");
    manager.addMovies("101", {"100", "101"}); // User watches unique movies
    manager.addUser("102");
    manager.addMovies("102", {"102", "103"}); // No overlap in movies

    std::vector<std::string> recommendations = manager.recommendMovies("101", "102");
    EXPECT_TRUE(recommendations.empty()); // No recommendations expected
}

// Test adding duplicate movies for the same user
TEST_F(MovieRecommenderTest, AddMovies_Duplicate)
{
    manager.addUser("101");
    std::vector<std::string> movies = {"1", "2", "3"};
    EXPECT_TRUE(manager.addMovies("101", movies)); // First addition should succeed

    EXPECT_TRUE(manager.addMovies("101", {"2", "3"})); // Adding duplicate movies should not create issues

    User user = manager.getUser("101");
    EXPECT_TRUE(user.hasWatched("1"));
    EXPECT_TRUE(user.hasWatched("2"));
    EXPECT_TRUE(user.hasWatched("3"));
    EXPECT_EQ(user.getMovies().size(), 3); // Verify no duplicates
}

// Test recommendations when all movies are already watched
TEST_F(MovieRecommenderTest, Recommend_AllMoviesWatched)
{
    manager.addUser("101");
    manager.addMovies("101", {"100", "101", "102", "103"}); // User watched all these movies

    manager.addUser("102");
    manager.addMovies("102", {"100", "101", "102", "103"}); // Another user watched the same

    std::vector<std::string> recommendations = manager.recommendMovies("101", "102");
    EXPECT_TRUE(recommendations.empty()); // No new recommendations expected
}

TEST_F(MovieRecommenderTest, UpdateExistingUser)
{
    manager.addUser("101");
    bool result = manager.addMovies("101", {"2"});
    EXPECT_TRUE(result);
}

TEST_F(MovieRecommenderTest, UpdateNonExistingUser)
{
    bool result = manager.addMovies("999", {"1", "2"});
    EXPECT_FALSE(result);
}

TEST_F(MovieRecommenderTest, MultipleFieldsUpdate)
{
    manager.addUser("101");
    bool result = manager.addMovies("101", {"1", "2"});
    EXPECT_TRUE(result);
}

// DELETE Tests
TEST_F(MovieRecommenderTest, DeleteSingleMovie)
{
    manager.addUser("101");
    manager.addMovies("101", {"1"});
    bool result = manager.deleteMovies("101", {"1"});
    EXPECT_TRUE(result);
}

TEST_F(MovieRecommenderTest, DeleteNonExistingUser)
{
    bool result = manager.deleteMovies("999", {"1"});
    EXPECT_FALSE(result);
}

TEST_F(MovieRecommenderTest, DeleteNonExistingMovie)
{
    manager.addUser("101");
    bool result = manager.deleteMovies("101", {"999"});
    EXPECT_FALSE(result);
}

TEST_F(MovieRecommenderTest, DeleteMultipleMovies)
{
    manager.addUser("101");
    manager.addMovies("101", {"1", "2", "3"});
    bool result = manager.deleteMovies("101", {"1", "2"});
    EXPECT_TRUE(result);
}

// Test for invalid port
TEST_F(MovieRecommenderTest, invalidInput)
{
    char *argv[] = {"./main", "invalid"};
    App app;
    EXPECT_EQ(app.run(2, argv), 1);
}

TEST_F(MovieRecommenderTest, NoPort)
{
    char *argv[] = {"./main"};
    App app;
    EXPECT_EQ(app.run(1, argv), 1);
}

// Run the tests
int main(int argc, char **argv)
{
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}