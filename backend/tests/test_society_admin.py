"""
Test Society Admin Endpoints
Tests for society management features:
- PUT /api/societies/{society_id} - Update society name
- PUT /api/societies/{society_id} with regenerate_code=true - Generate new join code
- PUT /api/societies/{society_id}/admin/{player_id} - Transfer admin rights
- DELETE /api/societies/{society_id}/members/{player_id} - Remove member from society
- Verify non-admin users cannot call admin-only endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_society_data(api_client):
    """Create a test society with admin and member for testing"""
    # Create a unique society
    society_name = f"TEST_Society_{uuid.uuid4().hex[:8]}"
    response = api_client.post(f"{BASE_URL}/api/societies", json={"name": society_name})
    assert response.status_code == 200, f"Failed to create society: {response.text}"
    society = response.json()
    
    # Create admin player
    admin_username = f"TEST_Admin_{uuid.uuid4().hex[:8]}"
    response = api_client.post(f"{BASE_URL}/api/players", json={
        "username": admin_username,
        "handicap": 18.0,
        "is_active": True,
        "is_admin": False
    })
    assert response.status_code == 200, f"Failed to create admin player: {response.text}"
    admin_player = response.json()
    
    # Join society (first player becomes admin)
    response = api_client.post(f"{BASE_URL}/api/societies/{society['id']}/join?player_id={admin_player['id']}")
    assert response.status_code == 200, f"Failed to join society: {response.text}"
    
    # Create member player
    member_username = f"TEST_Member_{uuid.uuid4().hex[:8]}"
    response = api_client.post(f"{BASE_URL}/api/players", json={
        "username": member_username,
        "handicap": 18.0,
        "is_active": True,
        "is_admin": False
    })
    assert response.status_code == 200, f"Failed to create member player: {response.text}"
    member_player = response.json()
    
    # Join society as member
    response = api_client.post(f"{BASE_URL}/api/societies/{society['id']}/join?player_id={member_player['id']}")
    assert response.status_code == 200, f"Failed to join society as member: {response.text}"
    
    # Create another member for removal test
    member2_username = f"TEST_Member2_{uuid.uuid4().hex[:8]}"
    response = api_client.post(f"{BASE_URL}/api/players", json={
        "username": member2_username,
        "handicap": 18.0,
        "is_active": True,
        "is_admin": False
    })
    assert response.status_code == 200, f"Failed to create member2 player: {response.text}"
    member2_player = response.json()
    
    # Join society as member2
    response = api_client.post(f"{BASE_URL}/api/societies/{society['id']}/join?player_id={member2_player['id']}")
    assert response.status_code == 200, f"Failed to join society as member2: {response.text}"
    
    # Refresh society to get admin_id
    response = api_client.get(f"{BASE_URL}/api/societies/{society['id']}")
    society = response.json()
    
    yield {
        "society": society,
        "admin": admin_player,
        "member": member_player,
        "member2": member2_player
    }
    
    # Cleanup - delete test players and society
    api_client.delete(f"{BASE_URL}/api/players/{admin_player['id']}")
    api_client.delete(f"{BASE_URL}/api/players/{member_player['id']}")
    api_client.delete(f"{BASE_URL}/api/players/{member2_player['id']}")


class TestSocietyUpdateName:
    """Test PUT /api/societies/{society_id} - Update society name"""
    
    def test_admin_can_update_society_name(self, api_client, test_society_data):
        """Admin should be able to update society name"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        
        new_name = f"TEST_Updated_Society_{uuid.uuid4().hex[:8]}"
        response = api_client.put(
            f"{BASE_URL}/api/societies/{society['id']}?admin_id={admin['id']}",
            json={"name": new_name}
        )
        
        assert response.status_code == 200, f"Failed to update society: {response.text}"
        data = response.json()
        assert data["name"] == new_name, "Society name was not updated"
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/societies/{society['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == new_name
        
        # Update test_society_data with new name
        test_society_data["society"]["name"] = new_name
        print(f"SUCCESS: Admin updated society name to '{new_name}'")
    
    def test_non_admin_cannot_update_society_name(self, api_client, test_society_data):
        """Non-admin should NOT be able to update society name"""
        society = test_society_data["society"]
        member = test_society_data["member"]
        
        response = api_client.put(
            f"{BASE_URL}/api/societies/{society['id']}?admin_id={member['id']}",
            json={"name": "Unauthorized Update"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("SUCCESS: Non-admin correctly rejected from updating society name")


class TestSocietyRegenerateCode:
    """Test PUT /api/societies/{society_id} with regenerate_code=true"""
    
    def test_admin_can_regenerate_join_code(self, api_client, test_society_data):
        """Admin should be able to regenerate join code"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        old_code = society["join_code"]
        
        response = api_client.put(
            f"{BASE_URL}/api/societies/{society['id']}?admin_id={admin['id']}",
            json={"regenerate_code": True}
        )
        
        assert response.status_code == 200, f"Failed to regenerate code: {response.text}"
        data = response.json()
        assert data["join_code"] != old_code, "Join code was not regenerated"
        assert len(data["join_code"]) == 6, "Join code should be 6 characters"
        
        # Verify persistence
        get_response = api_client.get(f"{BASE_URL}/api/societies/{society['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["join_code"] == data["join_code"]
        
        # Update test data
        test_society_data["society"]["join_code"] = data["join_code"]
        print(f"SUCCESS: Admin regenerated join code from '{old_code}' to '{data['join_code']}'")
    
    def test_non_admin_cannot_regenerate_join_code(self, api_client, test_society_data):
        """Non-admin should NOT be able to regenerate join code"""
        society = test_society_data["society"]
        member = test_society_data["member"]
        
        response = api_client.put(
            f"{BASE_URL}/api/societies/{society['id']}?admin_id={member['id']}",
            json={"regenerate_code": True}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("SUCCESS: Non-admin correctly rejected from regenerating join code")


class TestRemoveMember:
    """Test DELETE /api/societies/{society_id}/members/{player_id}"""
    
    def test_admin_can_remove_member(self, api_client, test_society_data):
        """Admin should be able to remove a member"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        member2 = test_society_data["member2"]
        
        response = api_client.delete(
            f"{BASE_URL}/api/societies/{society['id']}/members/{member2['id']}?admin_id={admin['id']}"
        )
        
        assert response.status_code == 200, f"Failed to remove member: {response.text}"
        
        # Verify member was removed (society_id should be null)
        get_response = api_client.get(f"{BASE_URL}/api/players/{member2['id']}")
        assert get_response.status_code == 200
        player_data = get_response.json()
        assert player_data.get("society_id") is None, "Member's society_id should be null after removal"
        print(f"SUCCESS: Admin removed member '{member2['username']}' from society")
    
    def test_admin_cannot_remove_self(self, api_client, test_society_data):
        """Admin should NOT be able to remove themselves"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        
        response = api_client.delete(
            f"{BASE_URL}/api/societies/{society['id']}/members/{admin['id']}?admin_id={admin['id']}"
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("SUCCESS: Admin correctly prevented from removing self")
    
    def test_non_admin_cannot_remove_member(self, api_client, test_society_data):
        """Non-admin should NOT be able to remove members"""
        society = test_society_data["society"]
        member = test_society_data["member"]
        admin = test_society_data["admin"]
        
        response = api_client.delete(
            f"{BASE_URL}/api/societies/{society['id']}/members/{admin['id']}?admin_id={member['id']}"
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("SUCCESS: Non-admin correctly rejected from removing members")


class TestTransferAdmin:
    """Test PUT /api/societies/{society_id}/admin/{player_id}"""
    
    def test_admin_can_transfer_admin_rights(self, api_client, test_society_data):
        """Admin should be able to transfer admin rights to another member"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        member = test_society_data["member"]
        
        response = api_client.put(
            f"{BASE_URL}/api/societies/{society['id']}/admin/{member['id']}?current_admin_id={admin['id']}"
        )
        
        assert response.status_code == 200, f"Failed to transfer admin: {response.text}"
        
        # Verify new admin
        get_response = api_client.get(f"{BASE_URL}/api/players/{member['id']}")
        assert get_response.status_code == 200
        new_admin_data = get_response.json()
        assert new_admin_data.get("is_admin") == True, "New admin should have is_admin=True"
        
        # Verify old admin lost admin rights
        get_response = api_client.get(f"{BASE_URL}/api/players/{admin['id']}")
        assert get_response.status_code == 200
        old_admin_data = get_response.json()
        assert old_admin_data.get("is_admin") == False, "Old admin should have is_admin=False"
        
        # Verify society admin_id updated
        get_response = api_client.get(f"{BASE_URL}/api/societies/{society['id']}")
        assert get_response.status_code == 200
        society_data = get_response.json()
        assert society_data.get("admin_id") == member['id'], "Society admin_id should be updated"
        
        print(f"SUCCESS: Admin transferred to '{member['username']}'")
        
        # Update test data - swap admin and member roles
        test_society_data["admin"], test_society_data["member"] = test_society_data["member"], test_society_data["admin"]
        test_society_data["society"]["admin_id"] = member['id']
    
    def test_non_admin_cannot_transfer_admin(self, api_client, test_society_data):
        """Non-admin should NOT be able to transfer admin rights"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]  # This is now the new admin after transfer
        member = test_society_data["member"]  # This is now the old admin
        
        response = api_client.put(
            f"{BASE_URL}/api/societies/{society['id']}/admin/{member['id']}?current_admin_id={member['id']}"
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("SUCCESS: Non-admin correctly rejected from transferring admin rights")


class TestSocietyNotFound:
    """Test error handling for non-existent societies"""
    
    def test_update_nonexistent_society(self, api_client):
        """Should return 404 for non-existent society"""
        fake_id = str(uuid.uuid4())
        response = api_client.put(
            f"{BASE_URL}/api/societies/{fake_id}?admin_id=fake",
            json={"name": "Test"}
        )
        assert response.status_code == 404
        print("SUCCESS: 404 returned for non-existent society update")
    
    def test_remove_member_nonexistent_society(self, api_client):
        """Should return 404 for non-existent society"""
        fake_id = str(uuid.uuid4())
        response = api_client.delete(
            f"{BASE_URL}/api/societies/{fake_id}/members/fake?admin_id=fake"
        )
        assert response.status_code == 404
        print("SUCCESS: 404 returned for non-existent society member removal")
    
    def test_transfer_admin_nonexistent_society(self, api_client):
        """Should return 404 for non-existent society"""
        fake_id = str(uuid.uuid4())
        response = api_client.put(
            f"{BASE_URL}/api/societies/{fake_id}/admin/fake?current_admin_id=fake"
        )
        assert response.status_code == 404
        print("SUCCESS: 404 returned for non-existent society admin transfer")


class TestExistingSocietyData:
    """Test with existing society data from the database"""
    
    def test_get_existing_society(self, api_client):
        """Verify we can get existing societies"""
        response = api_client.get(f"{BASE_URL}/api/societies")
        assert response.status_code == 200
        societies = response.json()
        assert isinstance(societies, list)
        print(f"SUCCESS: Retrieved {len(societies)} societies")
    
    def test_get_existing_players(self, api_client):
        """Verify we can get existing players"""
        response = api_client.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        players = response.json()
        assert isinstance(players, list)
        
        # Check for admin players
        admins = [p for p in players if p.get("is_admin")]
        print(f"SUCCESS: Retrieved {len(players)} players, {len(admins)} admins")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
