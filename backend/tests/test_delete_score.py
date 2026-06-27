"""
Test suite for DELETE /api/scores/{score_id} endpoint
Tests the ability to delete a player's score from a round and recalculate their handicap
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data - existing competition and player from the system
COMPETITION_ID = "cb43af26-3474-47fc-b1c4-424d5141882f"
PLAYER_ID = "074c4a77-5e00-4a0b-b829-29c8363238c8"  # Nathan D
ROUND_1_ID = "4c91c972-b1e9-4626-8aad-55b1e5c412d8"  # Round 1 - 35 pts
ROUND_2_ID = "7a81a920-3b56-4aa6-9ebd-7bce0b872058"  # Round 2 - 33 pts
SCORE_1_ID = "1f64bb27-bf77-49d7-9329-7b92b212b791"  # Score for Round 1
SCORE_2_ID = "91c473bc-44f2-4738-925f-832d86233cfe"  # Score for Round 2


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestDeleteScoreEndpoint:
    """Tests for DELETE /api/scores/{score_id} endpoint"""
    
    def test_delete_score_returns_404_for_nonexistent_score(self, api_client):
        """Test that deleting a non-existent score returns 404"""
        fake_score_id = str(uuid.uuid4())
        response = api_client.delete(f"{BASE_URL}/api/scores/{fake_score_id}")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
    
    def test_delete_score_endpoint_exists(self, api_client):
        """Test that the DELETE /api/scores/{score_id} endpoint exists"""
        # Use a fake ID to test endpoint existence (should return 404, not 405)
        fake_score_id = str(uuid.uuid4())
        response = api_client.delete(f"{BASE_URL}/api/scores/{fake_score_id}")
        
        # Should be 404 (not found) not 405 (method not allowed)
        assert response.status_code == 404
    
    def test_create_and_delete_score_flow(self, api_client):
        """Test creating a score and then deleting it"""
        # First, create a test round for this test
        test_round_data = {
            "competition_id": COMPETITION_ID,
            "round_number": 99,
            "name": "TEST_DeleteScoreRound",
            "date": "2026-01-15",
            "course_name": "Test Course",
            "slope_rating": 113,
            "course_rating": 72.0,
            "course_par": 72
        }
        
        round_response = api_client.post(f"{BASE_URL}/api/rounds", json=test_round_data)
        assert round_response.status_code == 200
        test_round = round_response.json()
        test_round_id = test_round["id"]
        
        try:
            # Create a score for this round
            score_data = {
                "round_id": test_round_id,
                "player_id": PLAYER_ID
            }
            score_response = api_client.post(f"{BASE_URL}/api/scores", json=score_data)
            assert score_response.status_code == 200
            test_score = score_response.json()
            test_score_id = test_score["id"]
            
            # Update the score with points
            points_data = {"total_stableford": 36}
            update_response = api_client.put(f"{BASE_URL}/api/scores/{test_score_id}/points", json=points_data)
            assert update_response.status_code == 200
            
            # Verify score exists
            verify_response = api_client.get(f"{BASE_URL}/api/scores?round_id={test_round_id}")
            assert verify_response.status_code == 200
            scores = verify_response.json()
            assert len(scores) == 1
            assert scores[0]["id"] == test_score_id
            
            # Delete the score
            delete_response = api_client.delete(f"{BASE_URL}/api/scores/{test_score_id}")
            assert delete_response.status_code == 200
            
            # Verify response contains expected fields
            delete_data = delete_response.json()
            assert "message" in delete_data
            assert "deleted" in delete_data["message"].lower()
            assert "player_id" in delete_data
            assert delete_data["player_id"] == PLAYER_ID
            
            # Verify score no longer exists
            verify_after_response = api_client.get(f"{BASE_URL}/api/scores?round_id={test_round_id}")
            assert verify_after_response.status_code == 200
            scores_after = verify_after_response.json()
            assert len(scores_after) == 0
            
        finally:
            # Cleanup: delete the test round
            api_client.delete(f"{BASE_URL}/api/rounds/{test_round_id}")
    
    def test_delete_score_recalculates_handicap(self, api_client):
        """Test that deleting a score recalculates the player's handicap"""
        # Create a test round
        test_round_data = {
            "competition_id": COMPETITION_ID,
            "round_number": 98,
            "name": "TEST_HandicapRecalcRound",
            "date": "2026-01-16",
            "course_name": "Test Course",
            "slope_rating": 113,
            "course_rating": 72.0,
            "course_par": 72
        }
        
        round_response = api_client.post(f"{BASE_URL}/api/rounds", json=test_round_data)
        assert round_response.status_code == 200
        test_round = round_response.json()
        test_round_id = test_round["id"]
        
        try:
            # Get player's handicap before
            player_before = api_client.get(f"{BASE_URL}/api/players/{PLAYER_ID}").json()
            handicap_before = player_before["handicap"]
            history_count_before = len(player_before.get("handicap_history", []))
            
            # Create and update a score
            score_data = {"round_id": test_round_id, "player_id": PLAYER_ID}
            score_response = api_client.post(f"{BASE_URL}/api/scores", json=score_data)
            assert score_response.status_code == 200
            test_score_id = score_response.json()["id"]
            
            # Update with points (this should add to handicap history)
            points_data = {"total_stableford": 40}  # Good score
            api_client.put(f"{BASE_URL}/api/scores/{test_score_id}/points", json=points_data)
            
            # Verify handicap history was updated
            player_after_score = api_client.get(f"{BASE_URL}/api/players/{PLAYER_ID}").json()
            history_count_after_score = len(player_after_score.get("handicap_history", []))
            assert history_count_after_score == history_count_before + 1
            
            # Delete the score
            delete_response = api_client.delete(f"{BASE_URL}/api/scores/{test_score_id}")
            assert delete_response.status_code == 200
            
            # Verify response indicates handicap was recalculated
            delete_data = delete_response.json()
            assert "handicap" in delete_data["message"].lower() or "new_handicap" in delete_data
            
            # Verify handicap history was pruned
            player_after_delete = api_client.get(f"{BASE_URL}/api/players/{PLAYER_ID}").json()
            history_count_after_delete = len(player_after_delete.get("handicap_history", []))
            assert history_count_after_delete == history_count_before
            
        finally:
            # Cleanup
            api_client.delete(f"{BASE_URL}/api/rounds/{test_round_id}")
    
    def test_delete_score_removes_from_leaderboard(self, api_client):
        """Test that deleting a score updates the leaderboard"""
        # Create a test round
        test_round_data = {
            "competition_id": COMPETITION_ID,
            "round_number": 97,
            "name": "TEST_LeaderboardRound",
            "date": "2026-01-17",
            "course_name": "Test Course",
            "slope_rating": 113,
            "course_rating": 72.0,
            "course_par": 72
        }
        
        round_response = api_client.post(f"{BASE_URL}/api/rounds", json=test_round_data)
        assert round_response.status_code == 200
        test_round = round_response.json()
        test_round_id = test_round["id"]
        
        try:
            # Get leaderboard before
            leaderboard_before = api_client.get(f"{BASE_URL}/api/leaderboard/{COMPETITION_ID}").json()
            player_entry_before = next((e for e in leaderboard_before if e["player_id"] == PLAYER_ID), None)
            rounds_before = player_entry_before["rounds_played"] if player_entry_before else 0
            
            # Create and update a score
            score_data = {"round_id": test_round_id, "player_id": PLAYER_ID}
            score_response = api_client.post(f"{BASE_URL}/api/scores", json=score_data)
            assert score_response.status_code == 200
            test_score_id = score_response.json()["id"]
            
            points_data = {"total_stableford": 36}
            api_client.put(f"{BASE_URL}/api/scores/{test_score_id}/points", json=points_data)
            
            # Verify leaderboard updated
            leaderboard_after_score = api_client.get(f"{BASE_URL}/api/leaderboard/{COMPETITION_ID}").json()
            player_entry_after_score = next((e for e in leaderboard_after_score if e["player_id"] == PLAYER_ID), None)
            assert player_entry_after_score is not None
            assert player_entry_after_score["rounds_played"] == rounds_before + 1
            
            # Delete the score
            delete_response = api_client.delete(f"{BASE_URL}/api/scores/{test_score_id}")
            assert delete_response.status_code == 200
            
            # Verify leaderboard updated after deletion
            leaderboard_after_delete = api_client.get(f"{BASE_URL}/api/leaderboard/{COMPETITION_ID}").json()
            player_entry_after_delete = next((e for e in leaderboard_after_delete if e["player_id"] == PLAYER_ID), None)
            if player_entry_after_delete:
                assert player_entry_after_delete["rounds_played"] == rounds_before
            
        finally:
            # Cleanup
            api_client.delete(f"{BASE_URL}/api/rounds/{test_round_id}")


class TestDeleteRoundCascade:
    """Tests for DELETE /api/rounds/{round_id} cascade deletion"""
    
    def test_delete_round_removes_scores_and_recalculates_handicaps(self, api_client):
        """Test that deleting a round also deletes scores and recalculates handicaps"""
        # Create a test round
        test_round_data = {
            "competition_id": COMPETITION_ID,
            "round_number": 96,
            "name": "TEST_CascadeDeleteRound",
            "date": "2026-01-18",
            "course_name": "Test Course",
            "slope_rating": 113,
            "course_rating": 72.0,
            "course_par": 72
        }
        
        round_response = api_client.post(f"{BASE_URL}/api/rounds", json=test_round_data)
        assert round_response.status_code == 200
        test_round = round_response.json()
        test_round_id = test_round["id"]
        
        # Get player's handicap history count before
        player_before = api_client.get(f"{BASE_URL}/api/players/{PLAYER_ID}").json()
        history_count_before = len(player_before.get("handicap_history", []))
        
        # Create and update a score
        score_data = {"round_id": test_round_id, "player_id": PLAYER_ID}
        score_response = api_client.post(f"{BASE_URL}/api/scores", json=score_data)
        assert score_response.status_code == 200
        test_score_id = score_response.json()["id"]
        
        points_data = {"total_stableford": 38}
        api_client.put(f"{BASE_URL}/api/scores/{test_score_id}/points", json=points_data)
        
        # Verify score exists
        scores_before_delete = api_client.get(f"{BASE_URL}/api/scores?round_id={test_round_id}").json()
        assert len(scores_before_delete) == 1
        
        # Verify handicap history was updated
        player_after_score = api_client.get(f"{BASE_URL}/api/players/{PLAYER_ID}").json()
        history_count_after_score = len(player_after_score.get("handicap_history", []))
        assert history_count_after_score == history_count_before + 1
        
        # Delete the round (should cascade delete scores and update handicaps)
        delete_response = api_client.delete(f"{BASE_URL}/api/rounds/{test_round_id}")
        assert delete_response.status_code == 200
        
        # Verify response indicates affected players
        delete_data = delete_response.json()
        assert "affected_players" in delete_data or "message" in delete_data
        
        # Verify scores were deleted
        scores_after_delete = api_client.get(f"{BASE_URL}/api/scores?round_id={test_round_id}").json()
        assert len(scores_after_delete) == 0
        
        # Verify handicap history was pruned
        player_after_delete = api_client.get(f"{BASE_URL}/api/players/{PLAYER_ID}").json()
        history_count_after_delete = len(player_after_delete.get("handicap_history", []))
        assert history_count_after_delete == history_count_before
        
        # Verify round no longer exists
        round_check = api_client.get(f"{BASE_URL}/api/rounds/{test_round_id}")
        assert round_check.status_code == 404


class TestExistingScoreData:
    """Tests using existing score data in the system"""
    
    def test_existing_scores_are_accessible(self, api_client):
        """Verify existing scores can be retrieved"""
        # Check Round 1 score
        response = api_client.get(f"{BASE_URL}/api/scores?round_id={ROUND_1_ID}")
        assert response.status_code == 200
        scores = response.json()
        assert len(scores) >= 1
        
        # Find Nathan D's score
        nathan_score = next((s for s in scores if s["player_id"] == PLAYER_ID), None)
        assert nathan_score is not None
        assert nathan_score["total_stableford"] == 35
    
    def test_player_handicap_history_contains_round_entries(self, api_client):
        """Verify player's handicap history contains entries for existing rounds"""
        response = api_client.get(f"{BASE_URL}/api/players/{PLAYER_ID}")
        assert response.status_code == 200
        player = response.json()
        
        handicap_history = player.get("handicap_history", [])
        assert len(handicap_history) > 0
        
        # Check for Round 1 entry
        round_1_entry = next((h for h in handicap_history if h.get("round_id") == ROUND_1_ID), None)
        assert round_1_entry is not None
        assert round_1_entry["score"] == 35
        
        # Check for Round 2 entry
        round_2_entry = next((h for h in handicap_history if h.get("round_id") == ROUND_2_ID), None)
        assert round_2_entry is not None
        assert round_2_entry["score"] == 33


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
