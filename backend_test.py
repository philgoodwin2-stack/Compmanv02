import requests
import sys
from datetime import datetime
import json

class GolfAPITester:
    def __init__(self, base_url="https://score-tracker-177.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = []  # Track created resources for cleanup

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = headers or {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_login_flow(self):
        """Test login with new and existing user"""
        timestamp = datetime.now().strftime('%H%M%S')
        username = f"test_user_{timestamp}"
        
        # Test login with new user (should create player)
        success, response = self.run_test(
            "Login (New User)",
            "POST", 
            "login",
            200,
            {"username": username}
        )
        
        if success and 'player' in response:
            player_id = response['player']['id']
            self.created_resources.append(('player', player_id))
            print(f"Created player: {response['player']['username']} (ID: {player_id})")
            
            # Test login with existing user
            success2, response2 = self.run_test(
                "Login (Existing User)",
                "POST",
                "login", 
                200,
                {"username": username}
            )
            return success and success2, response['player']
        
        return False, {}

    def test_player_management(self):
        """Test player CRUD operations"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Test get all players
        success1, players = self.run_test("Get All Players", "GET", "players", 200)
        
        # Test create player
        player_data = {
            "username": f"test_player_{timestamp}",
            "handicap": 12.5,
            "is_active": True
        }
        success2, player = self.run_test(
            "Create Player",
            "POST",
            "players",
            200,
            player_data
        )
        
        if success2 and 'id' in player:
            player_id = player['id']
            self.created_resources.append(('player', player_id))
            
            # Test get specific player
            success3, _ = self.run_test(
                "Get Specific Player", 
                "GET", 
                f"players/{player_id}",
                200
            )
            
            # Test update player
            update_data = {"handicap": 15.0, "is_active": False}
            success4, _ = self.run_test(
                "Update Player",
                "PUT",
                f"players/{player_id}",
                200,
                update_data
            )
            
            return all([success1, success2, success3, success4]), player_id
        
        return False, None

    def test_competition_management(self):
        """Test competition CRUD operations"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Test get all competitions
        success1, competitions = self.run_test("Get All Competitions", "GET", "competitions", 200)
        
        # Test create competition
        comp_data = {
            "name": f"Test Competition {timestamp}",
            "description": "Test tournament",
            "num_holes": 18,
            "status": "upcoming"
        }
        success2, competition = self.run_test(
            "Create Competition",
            "POST",
            "competitions",
            200,
            comp_data
        )
        
        if success2 and 'id' in competition:
            comp_id = competition['id']
            self.created_resources.append(('competition', comp_id))
            
            # Test get specific competition
            success3, _ = self.run_test(
                "Get Specific Competition",
                "GET",
                f"competitions/{comp_id}",
                200
            )
            
            # Test update competition status
            success4, _ = self.run_test(
                "Update Competition Status",
                "PUT",
                f"competitions/{comp_id}",
                200,
                {"status": "active"}
            )
            
            return all([success1, success2, success3, success4]), comp_id
        
        return False, None

    def test_player_competition_association(self, comp_id, player_id):
        """Test adding/removing players from competition"""
        if not comp_id or not player_id:
            print("❌ Skipping player-competition tests - missing IDs")
            return False
            
        # Test add player to competition
        success1, _ = self.run_test(
            "Add Player to Competition",
            "POST",
            f"competitions/{comp_id}/players/{player_id}",
            200
        )
        
        # Test remove player from competition  
        success2, _ = self.run_test(
            "Remove Player from Competition",
            "DELETE",
            f"competitions/{comp_id}/players/{player_id}",
            200
        )
        
        return success1 and success2

    def test_rounds_management(self, comp_id):
        """Test round CRUD operations"""
        if not comp_id:
            print("❌ Skipping rounds tests - missing competition ID")
            return False
            
        # Test get rounds (empty initially)
        success1, rounds = self.run_test(
            "Get Rounds",
            "GET",
            f"rounds?competition_id={comp_id}",
            200
        )
        
        # Test create round
        round_data = {
            "competition_id": comp_id,
            "round_number": 1,
            "name": "Round 1",
            "date": "2024-01-15",
            "course_par": 72
        }
        success2, round_obj = self.run_test(
            "Create Round",
            "POST",
            "rounds",
            200,
            round_data
        )
        
        if success2 and 'id' in round_obj:
            round_id = round_obj['id']
            self.created_resources.append(('round', round_id))
            
            # Test get specific round
            success3, _ = self.run_test(
                "Get Specific Round",
                "GET", 
                f"rounds/{round_id}",
                200
            )
            
            return all([success1, success2, success3]), round_id
        
        return False, None

    def test_scores_management(self, round_id, player_id):
        """Test score CRUD operations"""
        if not round_id or not player_id:
            print("❌ Skipping scores tests - missing IDs")
            return False
            
        # Test create score
        score_data = {
            "round_id": round_id,
            "player_id": player_id
        }
        success1, score = self.run_test(
            "Create Score",
            "POST",
            "scores",
            200,
            score_data
        )
        
        if success1 and 'id' in score:
            score_id = score['id']
            self.created_resources.append(('score', score_id))
            
            # Test get scores
            success2, _ = self.run_test(
                "Get Scores",
                "GET",
                f"scores?round_id={round_id}",
                200
            )
            
            # Test update score holes
            holes_data = [
                {"hole_number": 1, "par": 4, "strokes": 5},
                {"hole_number": 2, "par": 3, "strokes": 3},
                {"hole_number": 3, "par": 5, "strokes": 4}
            ]
            success3, _ = self.run_test(
                "Update Score Holes",
                "PUT",
                f"scores/{score_id}/holes",
                200,
                holes_data
            )
            
            return all([success1, success2, success3]), score_id
        
        return False, None

    def test_leaderboard(self, comp_id):
        """Test leaderboard functionality"""
        if not comp_id:
            print("❌ Skipping leaderboard test - missing competition ID")
            return False
            
        return self.run_test(
            "Get Leaderboard",
            "GET",
            f"leaderboard/{comp_id}",
            200
        )[0]

    def cleanup_resources(self):
        """Clean up created test resources"""
        print(f"\n🧹 Cleaning up {len(self.created_resources)} test resources...")
        
        # Clean in reverse order (scores, rounds, competitions, players)
        cleanup_order = ['score', 'round', 'competition', 'player']
        
        for resource_type in cleanup_order:
            for r_type, r_id in list(self.created_resources):
                if r_type == resource_type:
                    try:
                        if resource_type == 'player':
                            requests.delete(f"{self.api_url}/players/{r_id}")
                        elif resource_type == 'competition':
                            requests.delete(f"{self.api_url}/competitions/{r_id}")
                        elif resource_type == 'round':
                            requests.delete(f"{self.api_url}/rounds/{r_id}")
                        # Note: scores get cleaned up when rounds are deleted
                        print(f"✅ Cleaned up {resource_type}: {r_id}")
                        self.created_resources.remove((r_type, r_id))
                    except Exception as e:
                        print(f"⚠️  Could not clean up {resource_type} {r_id}: {e}")

def main():
    print("🏌️ Starting Golf Competition API Tests")
    print("=" * 50)
    
    tester = GolfAPITester()
    
    try:
        # Test 1: Root endpoint
        tester.test_root_endpoint()
        
        # Test 2: Login flow
        login_success, test_player = tester.test_login_flow()
        
        # Test 3: Player management
        player_success, player_id = tester.test_player_management()
        
        # Test 4: Competition management  
        comp_success, comp_id = tester.test_competition_management()
        
        # Test 5: Player-Competition association
        if comp_success and player_success:
            tester.test_player_competition_association(comp_id, player_id)
        
        # Test 6: Rounds management
        if comp_success:
            round_success, round_id = tester.test_rounds_management(comp_id)
        else:
            round_success, round_id = False, None
            
        # Test 7: Scores management
        if round_success and player_success:
            score_success, score_id = tester.test_scores_management(round_id, player_id)
        else:
            score_success = False
            
        # Test 8: Leaderboard
        if comp_success:
            tester.test_leaderboard(comp_id)
            
        # Print results
        print(f"\n📊 Test Results:")
        print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
        print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
        
        # Test core flows
        core_tests = [login_success, player_success, comp_success]
        if all(core_tests):
            print("✅ All core functionality working")
        else:
            print("❌ Some core functionality failing")
            
        return 0 if tester.tests_passed == tester.tests_run else 1
        
    finally:
        # Always cleanup
        tester.cleanup_resources()

if __name__ == "__main__":
    sys.exit(main())