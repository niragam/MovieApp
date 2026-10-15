#!/bin/bash

# =============================================================================
# seed_database.sh - Populate database with sample users, categories, and movies
# =============================================================================

set -e

API_URL="${API_URL:-http://localhost:3000/api}"

echo "MovieApp Database Seeder"
echo "============================"
echo "API URL: $API_URL"
echo ""

# -----------------------------------------------------------------------------
# Helper function for API calls
# -----------------------------------------------------------------------------
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    
    if [ -n "$auth_header" ]; then
        curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $auth_header" \
            -d "$data"
    else
        curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# -----------------------------------------------------------------------------
# Wait for API to be ready
# -----------------------------------------------------------------------------
echo "Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s "$API_URL/categories" > /dev/null 2>&1; then
        echo "   API is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   API not responding after 30 seconds"
        exit 1
    fi
    sleep 1
done
echo ""

# -----------------------------------------------------------------------------
# Create Users
# -----------------------------------------------------------------------------
echo "Creating users..."

# Admin user
echo -n "   Creating admin user... "
ADMIN_SETUP_PASSWORD=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
ADMIN_RESULT=$(api_call POST "/users" "{\"username\": \"admin\", \"password\": \"$ADMIN_SETUP_PASSWORD\", \"name\": \"Administrator\"}")
if echo "$ADMIN_RESULT" | grep -q "error"; then
    echo "(may already exist)"
else
    echo "Done"
fi

# Regular users
USERS=(
    '{"username": "john_doe", "password": "Password1", "name": "John Doe"}'
    '{"username": "jane_smith", "password": "Password2", "name": "Jane Smith"}'
    '{"username": "movie_fan", "password": "Movies123", "name": "Movie Fan"}'
    '{"username": "cinephile", "password": "Cinema99", "name": "Cinema Lover"}'
)

for user in "${USERS[@]}"; do
    username=$(echo "$user" | grep -o '"username": "[^"]*"' | cut -d'"' -f4)
    echo -n "   Creating user: $username... "
    RESULT=$(api_call POST "/users" "$user")
    if echo "$RESULT" | grep -q "error"; then
        echo "(may already exist)"
    else
        echo "Done"
    fi
done

echo ""

# -----------------------------------------------------------------------------
# Set admin role and password
# -----------------------------------------------------------------------------
echo "Setting admin role and password..."
docker exec -i web-ser node <<'NODE'
const mongoose = require('mongoose');
const User = require('/app/src/apiServer/models/users');
const { hashPassword } = require('/app/src/apiServer/services/passwords');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.updateOne(
        { username: 'admin' },
        { $set: { role: 'admin', password: await hashPassword('admin') } }
    );
    if (result.matchedCount !== 1) throw new Error('Admin user was not created');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
}).finally(() => mongoose.disconnect());
NODE

# Login as admin to get a token with the admin role
LOGIN_RESULT=$(api_call POST "/tokens" '{"username": "admin", "password": "admin"}')
ADMIN_TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || true)
if [ -z "$ADMIN_TOKEN" ]; then
    echo "   Failed to login as admin. Error: $LOGIN_RESULT"
    exit 1
fi
echo "   Admin logged in successfully"
echo ""

# -----------------------------------------------------------------------------
# Create Categories
# -----------------------------------------------------------------------------
echo "Creating categories..."

CATEGORIES=(
    '{"name": "Action", "promoted": true}'
    '{"name": "Comedy", "promoted": true}'
    '{"name": "Drama", "promoted": true}'
    '{"name": "Sci-Fi", "promoted": true}'
    '{"name": "Horror", "promoted": false}'
    '{"name": "Romance", "promoted": false}'
    '{"name": "Thriller", "promoted": true}'
    '{"name": "Documentary", "promoted": false}'
    '{"name": "Animation", "promoted": true}'
    '{"name": "Fantasy", "promoted": false}'
)

for category in "${CATEGORIES[@]}"; do
    name=$(echo "$category" | grep -o '"name": "[^"]*"' | cut -d'"' -f4)
    echo -n "   Creating category: $name... "
    RESULT=$(api_call POST "/categories" "$category" "$ADMIN_TOKEN")
    if echo "$RESULT" | grep -q "error"; then
        echo "(may already exist)"
    else
        echo "Done"
    fi
done

echo ""

# -----------------------------------------------------------------------------
# Create Movies
# -----------------------------------------------------------------------------
echo "Creating movies..."

MOVIES=(
    '{"title": "The Matrix", "categories": ["Action", "Sci-Fi"], "description": "A computer hacker learns about the true nature of reality.", "duration": 136, "releaseDate": "1999-03-31"}'
    '{"title": "Inception", "categories": ["Action", "Sci-Fi", "Thriller"], "description": "A thief who steals corporate secrets through dream-sharing technology.", "duration": 148, "releaseDate": "2010-07-16"}'
    '{"title": "The Dark Knight", "categories": ["Action", "Drama", "Thriller"], "description": "Batman raises the stakes in his war on crime.", "duration": 152, "releaseDate": "2008-07-18"}'
    '{"title": "Pulp Fiction", "categories": ["Drama", "Thriller"], "description": "The lives of two mob hitmen, a boxer, and a pair of diner bandits intertwine.", "duration": 154, "releaseDate": "1994-10-14"}'
    '{"title": "The Shawshank Redemption", "categories": ["Drama"], "description": "Two imprisoned men bond over a number of years.", "duration": 142, "releaseDate": "1994-09-23"}'
    '{"title": "Forrest Gump", "categories": ["Drama", "Comedy", "Romance"], "description": "The story of a man with a low IQ who accomplished great things.", "duration": 142, "releaseDate": "1994-07-06"}'
    '{"title": "The Hangover", "categories": ["Comedy"], "description": "Three buddies wake up from a bachelor party with no memory.", "duration": 100, "releaseDate": "2009-06-05"}'
    '{"title": "Superbad", "categories": ["Comedy"], "description": "Two high school seniors try to make the most of their last weeks.", "duration": 113, "releaseDate": "2007-08-17"}'
    '{"title": "Interstellar", "categories": ["Sci-Fi", "Drama"], "description": "A team of explorers travel through a wormhole in space.", "duration": 169, "releaseDate": "2014-11-07"}'
    '{"title": "Blade Runner 2049", "categories": ["Sci-Fi", "Thriller"], "description": "A young blade runner discovers a secret.", "duration": 164, "releaseDate": "2017-10-06"}'
    '{"title": "The Conjuring", "categories": ["Horror", "Thriller"], "description": "Paranormal investigators help a family terrorized by a dark presence.", "duration": 112, "releaseDate": "2013-07-19"}'
    '{"title": "Get Out", "categories": ["Horror", "Thriller"], "description": "A young African-American visits his white girlfriends parents.", "duration": 104, "releaseDate": "2017-02-24"}'
    '{"title": "Titanic", "categories": ["Romance", "Drama"], "description": "A love story on the ill-fated R.M.S. Titanic.", "duration": 194, "releaseDate": "1997-12-19"}'
    '{"title": "The Notebook", "categories": ["Romance", "Drama"], "description": "A poor yet passionate young man falls for a rich young woman.", "duration": 123, "releaseDate": "2004-06-25"}'
    '{"title": "Toy Story", "categories": ["Animation", "Comedy"], "description": "A cowboy doll is threatened by a new spaceman figure.", "duration": 81, "releaseDate": "1995-11-22"}'
    '{"title": "Finding Nemo", "categories": ["Animation", "Comedy"], "description": "A clownfish father searches for his son.", "duration": 100, "releaseDate": "2003-05-30"}'
    '{"title": "The Lord of the Rings: The Fellowship", "categories": ["Fantasy", "Action"], "description": "A hobbit and his companions set out on a quest.", "duration": 178, "releaseDate": "2001-12-19"}'
    '{"title": "Avatar", "categories": ["Sci-Fi", "Action", "Fantasy"], "description": "A marine on an alien moon becomes torn between two worlds.", "duration": 162, "releaseDate": "2009-12-18"}'
    '{"title": "Planet Earth", "categories": ["Documentary"], "description": "A documentary series on the natural world.", "duration": 550, "releaseDate": "2006-03-05"}'
    '{"title": "Free Solo", "categories": ["Documentary"], "description": "A climber attempts to free solo El Capitan.", "duration": 100, "releaseDate": "2018-09-28"}'
)

VIDEO_BASE="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample"
VIDEOS=(BigBuckBunny ElephantsDream ForBiggerBlazes ForBiggerEscapes ForBiggerFun ForBiggerJoyrides ForBiggerMeltdowns Sintel TearsOfSteel SubaruOutbackOnStreetAndDirt)

index=0
for movie in "${MOVIES[@]}"; do
    title=$(echo "$movie" | grep -o '"title": "[^"]*"' | cut -d'"' -f4)
    echo -n "   Creating movie: $title... "
    label=$(echo "$title" | sed 's/[^A-Za-z0-9 ]//g; s/ /+/g')
    video="$VIDEO_BASE/${VIDEOS[$((index % ${#VIDEOS[@]}))]}.mp4"
    media="\"posterUrl\": \"https://placehold.co/400x600/141414/e50914?text=$label\", \"backdropUrl\": \"https://placehold.co/1280x720/1a1a1a/ffffff?text=$label\", \"videoUrl\": \"$video\""
    movie="{$media, ${movie#\{}"
    index=$((index + 1))
    RESULT=$(api_call POST "/movies" "$movie" "$ADMIN_TOKEN")
    if echo "$RESULT" | grep -q "error"; then
        echo "(may already exist or category missing)"
    else
        echo "Done"
    fi
done

echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo "============================"
echo "Database seeding complete!"
echo ""
echo "Created:"
echo "   • 5 users (1 admin + 4 regular)"
echo "   • 10 categories"
echo "   • 20 movies"
echo ""
echo "Test accounts:"
echo "   Admin:    admin / admin"
echo "   User 1:   john_doe / Password1"
echo "   User 2:   jane_smith / Password2"
echo "   User 3:   movie_fan / Movies123"
echo "   User 4:   cinephile / Cinema99"
echo ""
echo "Open http://localhost:5173 to start browsing!"
echo "============================"
