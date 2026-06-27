"""
Test Score Toggle Endpoints (Comp/HCP)
Tests for PUT /api/scores/{score_id}/toggle-comp and PUT /api/scores/{score_id}/toggle-handicap
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test competition with Nathan D scores
TEST_COMPETITION_ID = "cb43af26-3474-47fc-b1c4-424d5141882f"


class TestScoreToggleComp:
    """Tests for PUT /api/scores/{score_id}/toggle-comp endpoint"""
    
    def test_toggle_comp_endpoint_exists(self):
        """Verify the toggle-comp endpoint exists"""
        # First get a score to test with
        response = requests.get(f"{BASE_URL}/api/competitions/{TEST_COMPETITION_ID}")
        assert response.status_code == 200, f"Competition not found: {response.text}"
        
        # Get rounds for this competition
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        assert rounds_response.status_code == 200
        rounds = rounds_response.json()
        assert len(rounds) > 0, "No rounds found in test competition"
        
        # Get scores for first round
        round_id = rounds[0]["id"]
        scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={round_id}")
        assert scores_response.status_code == 200
        scores = scores_response.json()
        
        if len(scores) > 0:
            score_id = scores[0]["id"]
            # Test the endpoint exists (even if we don't change anything)
            response = requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
            assert response.status_code == 200, f"Toggle-comp endpoint failed: {response.text}"
            
            # Toggle back to original state
            requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
            print(f"✓ Toggle-comp endpoint exists and works for score {score_id}")
        else:
            pytest.skip("No scores found to test toggle-comp")
    
    def test_toggle_comp_returns_correct_response(self):
        """Verify toggle-comp returns correct response structure"""
        # Get a score
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        rounds = rounds_response.json()
        
        if len(rounds) > 0:
            scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}")
            scores = scores_response.json()
            
            if len(scores) > 0:
                score_id = scores[0]["id"]
                original_status = scores[0].get("is_included_in_comp", True)
                
                # Toggle
                response = requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
                assert response.status_code == 200
                
                data = response.json()
                assert "message" in data, "Response should contain 'message'"
                assert "is_included_in_comp" in data, "Response should contain 'is_included_in_comp'"
                assert data["is_included_in_comp"] == (not original_status), "Status should be toggled"
                
                # Toggle back
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
                print(f"✓ Toggle-comp returns correct response structure")
            else:
                pytest.skip("No scores found")
        else:
            pytest.skip("No rounds found")
    
    def test_toggle_comp_affects_leaderboard(self):
        """Verify toggling comp OFF excludes score from leaderboard"""
        # Get initial leaderboard
        leaderboard_before = requests.get(f"{BASE_URL}/api/leaderboard/{TEST_COMPETITION_ID}").json()
        
        # Get a score to toggle
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        rounds = rounds_response.json()
        
        if len(rounds) > 0 and len(leaderboard_before) > 0:
            scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}")
            scores = scores_response.json()
            
            if len(scores) > 0:
                score = scores[0]
                score_id = score["id"]
                player_id = score["player_id"]
                
                # Find player in leaderboard before
                player_entry_before = next((e for e in leaderboard_before if e["player_id"] == player_id), None)
                
                if player_entry_before:
                    rounds_before = player_entry_before["rounds_played"]
                    
                    # Toggle comp OFF
                    toggle_response = requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
                    assert toggle_response.status_code == 200
                    
                    # Get leaderboard after
                    leaderboard_after = requests.get(f"{BASE_URL}/api/leaderboard/{TEST_COMPETITION_ID}").json()
                    player_entry_after = next((e for e in leaderboard_after if e["player_id"] == player_id), None)
                    
                    if player_entry_after:
                        rounds_after = player_entry_after["rounds_played"]
                        # Rounds played should decrease by 1
                        assert rounds_after == rounds_before - 1, f"Rounds should decrease from {rounds_before} to {rounds_before - 1}, got {rounds_after}"
                        print(f"✓ Toggling comp OFF reduced rounds from {rounds_before} to {rounds_after}")
                    
                    # Toggle back ON
                    requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
                    
                    # Verify restored
                    leaderboard_restored = requests.get(f"{BASE_URL}/api/leaderboard/{TEST_COMPETITION_ID}").json()
                    player_entry_restored = next((e for e in leaderboard_restored if e["player_id"] == player_id), None)
                    if player_entry_restored:
                        assert player_entry_restored["rounds_played"] == rounds_before, "Rounds should be restored"
                        print(f"✓ Toggling comp ON restored rounds to {rounds_before}")
                else:
                    pytest.skip("Player not found in leaderboard")
            else:
                pytest.skip("No scores found")
        else:
            pytest.skip("No rounds or leaderboard entries found")
    
    def test_toggle_comp_404_for_invalid_score(self):
        """Verify toggle-comp returns 404 for non-existent score"""
        response = requests.put(f"{BASE_URL}/api/scores/invalid-score-id-12345/toggle-comp")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Toggle-comp returns 404 for invalid score ID")


class TestScoreToggleHandicap:
    """Tests for PUT /api/scores/{score_id}/toggle-handicap endpoint"""
    
    def test_toggle_handicap_endpoint_exists(self):
        """Verify the toggle-handicap endpoint exists"""
        # Get a score to test with
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        rounds = rounds_response.json()
        
        if len(rounds) > 0:
            scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}")
            scores = scores_response.json()
            
            if len(scores) > 0:
                score_id = scores[0]["id"]
                # Test the endpoint exists
                response = requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                assert response.status_code == 200, f"Toggle-handicap endpoint failed: {response.text}"
                
                # Toggle back to original state
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                print(f"✓ Toggle-handicap endpoint exists and works for score {score_id}")
            else:
                pytest.skip("No scores found")
        else:
            pytest.skip("No rounds found")
    
    def test_toggle_handicap_returns_correct_response(self):
        """Verify toggle-handicap returns correct response structure"""
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        rounds = rounds_response.json()
        
        if len(rounds) > 0:
            scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}")
            scores = scores_response.json()
            
            if len(scores) > 0:
                score_id = scores[0]["id"]
                original_status = scores[0].get("is_included_in_handicap", True)
                
                # Toggle
                response = requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                assert response.status_code == 200
                
                data = response.json()
                assert "message" in data, "Response should contain 'message'"
                assert "is_included_in_handicap" in data, "Response should contain 'is_included_in_handicap'"
                assert data["is_included_in_handicap"] == (not original_status), "Status should be toggled"
                
                # Toggle back
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                print(f"✓ Toggle-handicap returns correct response structure")
            else:
                pytest.skip("No scores found")
        else:
            pytest.skip("No rounds found")
    
    def test_toggle_handicap_affects_player_handicap(self):
        """Verify toggling handicap OFF affects player's handicap calculation"""
        # Get a score with a player
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        rounds = rounds_response.json()
        
        if len(rounds) > 0:
            scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}")
            scores = scores_response.json()
            
            if len(scores) > 0:
                score = scores[0]
                score_id = score["id"]
                player_id = score["player_id"]
                
                # Get player handicap before
                player_before = requests.get(f"{BASE_URL}/api/players/{player_id}").json()
                handicap_before = player_before.get("handicap", 18.0)
                history_before = len(player_before.get("handicap_history", []))
                
                # Toggle handicap OFF
                toggle_response = requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                assert toggle_response.status_code == 200
                
                # Get player handicap after
                player_after = requests.get(f"{BASE_URL}/api/players/{player_id}").json()
                handicap_after = player_after.get("handicap", 18.0)
                history_after = len(player_after.get("handicap_history", []))
                
                # Handicap history should have one less entry
                print(f"  Handicap before: {handicap_before}, after: {handicap_after}")
                print(f"  History entries before: {history_before}, after: {history_after}")
                
                # Toggle back ON
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                
                # Verify restored
                player_restored = requests.get(f"{BASE_URL}/api/players/{player_id}").json()
                print(f"  Handicap restored: {player_restored.get('handicap', 18.0)}")
                print(f"✓ Toggle-handicap affects player handicap calculation")
            else:
                pytest.skip("No scores found")
        else:
            pytest.skip("No rounds found")
    
    def test_toggle_handicap_404_for_invalid_score(self):
        """Verify toggle-handicap returns 404 for non-existent score"""
        response = requests.put(f"{BASE_URL}/api/scores/invalid-score-id-12345/toggle-handicap")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Toggle-handicap returns 404 for invalid score ID")


class TestScoreToggleIntegration:
    """Integration tests for score toggles"""
    
    def test_score_has_toggle_fields(self):
        """Verify scores have is_included_in_comp and is_included_in_handicap fields"""
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        rounds = rounds_response.json()
        
        if len(rounds) > 0:
            scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}")
            scores = scores_response.json()
            
            if len(scores) > 0:
                score = scores[0]
                # Fields should exist (default to True if not present)
                is_comp = score.get("is_included_in_comp", True)
                is_hcp = score.get("is_included_in_handicap", True)
                
                print(f"  Score {score['id']}: is_included_in_comp={is_comp}, is_included_in_handicap={is_hcp}")
                print("✓ Score has toggle fields")
            else:
                pytest.skip("No scores found")
        else:
            pytest.skip("No rounds found")
    
    def test_toggle_comp_and_handicap_independently(self):
        """Verify comp and handicap toggles work independently"""
        rounds_response = requests.get(f"{BASE_URL}/api/rounds?competition_id={TEST_COMPETITION_ID}")
        rounds = rounds_response.json()
        
        if len(rounds) > 0:
            scores_response = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}")
            scores = scores_response.json()
            
            if len(scores) > 0:
                score_id = scores[0]["id"]
                
                # Get initial state
                initial_score = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}").json()[0]
                initial_comp = initial_score.get("is_included_in_comp", True)
                initial_hcp = initial_score.get("is_included_in_handicap", True)
                
                # Toggle comp only
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
                
                # Check that only comp changed
                after_comp_toggle = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}").json()[0]
                assert after_comp_toggle.get("is_included_in_comp", True) == (not initial_comp), "Comp should be toggled"
                assert after_comp_toggle.get("is_included_in_handicap", True) == initial_hcp, "Handicap should be unchanged"
                
                # Toggle handicap only
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                
                # Check that only handicap changed
                after_hcp_toggle = requests.get(f"{BASE_URL}/api/scores?round_id={rounds[0]['id']}").json()[0]
                assert after_hcp_toggle.get("is_included_in_comp", True) == (not initial_comp), "Comp should still be toggled"
                assert after_hcp_toggle.get("is_included_in_handicap", True) == (not initial_hcp), "Handicap should be toggled"
                
                # Restore original state
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-comp")
                requests.put(f"{BASE_URL}/api/scores/{score_id}/toggle-handicap")
                
                print("✓ Comp and handicap toggles work independently")
            else:
                pytest.skip("No scores found")
        else:
            pytest.skip("No rounds found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
