#!/bin/bash

# =============================================================================
# populate_history.sh - Populate user history by simulating movie watches
# =============================================================================

set -e

API_URL="${API_URL:-http://localhost:3000/api}"

echo "User History Populator"
echo "============================"
echo "API URL: $API_URL"
echo ""

# Helper to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Login function
login() {
    local username=$1
    local password=$2
    # Login and extract token using grep/cut
    local response=$(curl -s -X POST "$API_URL/tokens" \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$username\", \"password\": \"$password\"}")
    
    if echo "$response" | grep -q "error"; then
        echo ""
    else
        echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
    fi
}

# -----------------------------------------------------------------------------
# 1. Login as Admin to get token for fetching movies
# -----------------------------------------------------------------------------
echo "Logging in as admin to fetch movie list..."
ADMIN_TOKEN=$(login "admin" "Admin123!")

if [ -z "$ADMIN_TOKEN" ]; then
    echo "Failed to login as admin. Ensure the database is seeded."
    exit 1
fi

# -----------------------------------------------------------------------------
# 2. Fetch all movies
# -----------------------------------------------------------------------------
echo "Fetching movie list..."
MOVIES_JSON=$(curl -s "$API_URL/movies" -H "Authorization: Bearer $ADMIN_TOKEN")

# Parse movie IDs using python for robustness
# API returns [{"category": "Name", "movies": [...]}, ...]
if command_exists python3; then
    MOVIE_IDS=($(echo "$MOVIES_JSON" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    ids = []
    # If list, could be list of categories or list of movies (checking structure)
    if isinstance(data, list):
        for item in data:
            if 'movies' in item: # It's a category
                for m in item['movies']:
                    mid = m.get('_id') or m.get('id')
                    if mid: ids.append(str(mid))
            else: # It's likely a movie object directly
                 mid = item.get('_id') or item.get('id')
                 if mid: ids.append(str(mid))
    elif isinstance(data, dict):
        # Fallback if wrapped in object
        pass
    print(' '.join(ids))
except Exception:
    print('')
"))
else
    echo "Error: python3 is required to parse movie JSON."
    exit 1
fi

TOTAL_MOVIES=${#MOVIE_IDS[@]}
echo "Found $TOTAL_MOVIES movies available for watching."
echo ""

if [ "$TOTAL_MOVIES" -eq 0 ]; then
    echo "No movies found. Please run seed_database.sh first."
    exit 1
fi

# -----------------------------------------------------------------------------
# 2. Iterate users and generate history
# -----------------------------------------------------------------------------
USERS=(
    "john_doe:Password1"
    "jane_smith:Password2"
    "movie_fan:Movies123"
    "cinephile:Cinema99"
    "admin:Admin123!"
)

echo "Generating watch history..."

for u in "${USERS[@]}"; do
    IFS=':' read -r USERNAME PASSWORD <<< "$u"
    echo -n "   User: $USERNAME ... "
    
    # Login and get token + userId
    LOGIN_RES=$(curl -s -X POST "$API_URL/tokens" \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")
    
    if echo "$LOGIN_RES" | grep -q "error"; then
        echo "Skipping (Login failed)"
        continue
    fi
    
    TOKEN=$(echo "$LOGIN_RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$LOGIN_RES" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
    
    # Determine number of movies to watch (random between 5 and 15)
    NUM_WATCHES=$((5 + RANDOM % 11))
    
    # Cap at total movies available
    if [ "$NUM_WATCHES" -gt "$TOTAL_MOVIES" ]; then
        NUM_WATCHES=$TOTAL_MOVIES
    fi
    
    echo -n "watching $NUM_WATCHES movies: "
    
    # Shuffle movie indices to pick random ones
    # Using shuf if available, else simple heuristic
    if command_exists shuf; then
        INDICES=($(shuf -i 0-$(($TOTAL_MOVIES - 1)) -n "$NUM_WATCHES"))
    else
        # Fallback if shuf is missing (less random but functional)
        INDICES=()
        for ((i=0; i<NUM_WATCHES; i++)); do
            INDICES+=($((RANDOM % TOTAL_MOVIES)))
        done
    fi
    
    count=0
    for idx in "${INDICES[@]}"; do
        MID=${MOVIE_IDS[$idx]}
        
        # Call the watch API (recommendation engine trigger)
        # Check HTTP status to catch silent failures
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/movies/$MID/recommend" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
            
        if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 204 ]; then
             echo -n "."
        else
             echo -n "[$HTTP_CODE]"
        fi
        count=$((count + 1))
    done
    
    echo " Done."
done

echo ""
echo "============================"
echo "History population complete!"
echo "============================"
