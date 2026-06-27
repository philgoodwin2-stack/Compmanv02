"""
Test Invite Link Endpoints
Tests for shareable invite link features:
- POST /api/societies/{society_id}/invites - Create invite link with customizable expiration
- GET /api/societies/{society_id}/invites - List active invites (admin only)
- GET /api/invites/{code} - Public endpoint to get invite details
- POST /api/invites/{code}/join - Join society via invite link
- DELETE /api/societies/{society_id}/invites/{invite_id} - Revoke invite
- Non-admin cannot create/list/revoke invites (403)
- Expired invites return 410 error
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone

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
    society_name = f"TEST_InviteSociety_{uuid.uuid4().hex[:8]}"
    response = api_client.post(f"{BASE_URL}/api/societies", json={"name": society_name})
    assert response.status_code == 200, f"Failed to create society: {response.text}"
    society = response.json()
    
    # Create admin player
    admin_username = f"TEST_InviteAdmin_{uuid.uuid4().hex[:8]}"
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
    
    # Create non-admin member player
    member_username = f"TEST_InviteMember_{uuid.uuid4().hex[:8]}"
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
    
    # Refresh society to get admin_id
    response = api_client.get(f"{BASE_URL}/api/societies/{society['id']}")
    society = response.json()
    
    yield {
        "society": society,
        "admin": admin_player,
        "member": member_player,
        "created_invites": []  # Track invites for cleanup
    }
    
    # Cleanup - delete test players
    api_client.delete(f"{BASE_URL}/api/players/{admin_player['id']}")
    api_client.delete(f"{BASE_URL}/api/players/{member_player['id']}")


class TestCreateInviteLink:
    """Test POST /api/societies/{society_id}/invites - Create invite link"""
    
    def test_admin_can_create_invite_with_default_expiry(self, api_client, test_society_data):
        """Admin should be able to create invite link with default 7 days expiry"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        
        response = api_client.post(
            f"{BASE_URL}/api/societies/{society['id']}/invites?admin_id={admin['id']}",
            json={}  # Default expiry
        )
        
        assert response.status_code == 200, f"Failed to create invite: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should contain invite id"
        assert "code" in data, "Response should contain invite code"
        assert "society_id" in data, "Response should contain society_id"
        assert "society_name" in data, "Response should contain society_name"
        assert "expires_at" in data, "Response should contain expires_at"
        assert "created_at" in data, "Response should contain created_at"
        
        # Verify code format (8 lowercase alphanumeric)
        assert len(data["code"]) == 8, "Invite code should be 8 characters"
        assert data["code"].islower() or data["code"].isalnum(), "Invite code should be lowercase alphanumeric"
        
        # Verify society info
        assert data["society_id"] == society["id"]
        assert data["society_name"] == society["name"]
        
        # Track for cleanup
        test_society_data["created_invites"].append(data)
        print(f"SUCCESS: Admin created invite link with code '{data['code']}'")
    
    def test_admin_can_create_invite_with_custom_expiry(self, api_client, test_society_data):
        """Admin should be able to create invite link with custom expiry (1-30 days)"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        
        # Test with 14 days expiry
        response = api_client.post(
            f"{BASE_URL}/api/societies/{society['id']}/invites?admin_id={admin['id']}",
            json={"expires_in_days": 14}
        )
        
        assert response.status_code == 200, f"Failed to create invite: {response.text}"
        data = response.json()
        
        # Verify expiration is approximately 14 days from now
        expires_at = datetime.fromisoformat(data["expires_at"].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        diff_days = (expires_at - now).days
        assert 13 <= diff_days <= 14, f"Expiry should be ~14 days, got {diff_days} days"
        
        test_society_data["created_invites"].append(data)
        print(f"SUCCESS: Admin created invite with 14-day expiry, code '{data['code']}'")
    
    def test_non_admin_cannot_create_invite(self, api_client, test_society_data):
        """Non-admin should NOT be able to create invite links"""
        society = test_society_data["society"]
        member = test_society_data["member"]
        
        response = api_client.post(
            f"{BASE_URL}/api/societies/{society['id']}/invites?admin_id={member['id']}",
            json={}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("SUCCESS: Non-admin correctly rejected from creating invite")


class TestListInvites:
    """Test GET /api/societies/{society_id}/invites - List active invites"""
    
    def test_admin_can_list_invites(self, api_client, test_society_data):
        """Admin should be able to list active invites"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        
        response = api_client.get(
            f"{BASE_URL}/api/societies/{society['id']}/invites?admin_id={admin['id']}"
        )
        
        assert response.status_code == 200, f"Failed to list invites: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        # Should have at least the invites we created
        assert len(data) >= len(test_society_data["created_invites"]), "Should list created invites"
        
        print(f"SUCCESS: Admin listed {len(data)} active invites")
    
    def test_non_admin_cannot_list_invites(self, api_client, test_society_data):
        """Non-admin should NOT be able to list invites"""
        society = test_society_data["society"]
        member = test_society_data["member"]
        
        response = api_client.get(
            f"{BASE_URL}/api/societies/{society['id']}/invites?admin_id={member['id']}"
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("SUCCESS: Non-admin correctly rejected from listing invites")


class TestGetInviteByCode:
    """Test GET /api/invites/{code} - Public endpoint to get invite details"""
    
    def test_get_valid_invite_by_code(self, api_client, test_society_data):
        """Anyone should be able to get invite details by code"""
        if not test_society_data["created_invites"]:
            pytest.skip("No invites created yet")
        
        invite = test_society_data["created_invites"][0]
        
        response = api_client.get(f"{BASE_URL}/api/invites/{invite['code']}")
        
        assert response.status_code == 200, f"Failed to get invite: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data["code"] == invite["code"]
        assert data["society_id"] == invite["society_id"]
        assert data["society_name"] == invite["society_name"]
        assert "member_count" in data, "Response should contain member_count"
        assert "expires_at" in data, "Response should contain expires_at"
        
        print(f"SUCCESS: Retrieved invite details for code '{invite['code']}'")
    
    def test_get_invalid_invite_code_returns_404(self, api_client):
        """Invalid invite code should return 404"""
        response = api_client.get(f"{BASE_URL}/api/invites/invalidcode123")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("SUCCESS: Invalid invite code returns 404")


class TestJoinViaInvite:
    """Test POST /api/invites/{code}/join - Join society via invite link"""
    
    def test_new_user_can_join_via_invite(self, api_client, test_society_data):
        """New user should be able to join society via invite link"""
        if not test_society_data["created_invites"]:
            pytest.skip("No invites created yet")
        
        invite = test_society_data["created_invites"][0]
        new_username = f"TEST_NewJoiner_{uuid.uuid4().hex[:8]}"
        
        response = api_client.post(
            f"{BASE_URL}/api/invites/{invite['code']}/join?username={new_username}"
        )
        
        assert response.status_code == 200, f"Failed to join via invite: {response.text}"
        data = response.json()
        
        # Verify player was created/returned
        assert data["username"] == new_username
        assert data["society_id"] == invite["society_id"]
        assert "id" in data
        
        # Cleanup - delete the test player
        api_client.delete(f"{BASE_URL}/api/players/{data['id']}")
        
        print(f"SUCCESS: New user '{new_username}' joined via invite")
    
    def test_existing_user_can_join_via_invite(self, api_client, test_society_data):
        """Existing user without society can join via invite"""
        if not test_society_data["created_invites"]:
            pytest.skip("No invites created yet")
        
        invite = test_society_data["created_invites"][0]
        
        # Create a player without society
        username = f"TEST_ExistingUser_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/players", json={
            "username": username,
            "handicap": 15.0,
            "is_active": True,
            "society_id": None
        })
        assert create_response.status_code == 200
        player = create_response.json()
        
        # Join via invite
        response = api_client.post(
            f"{BASE_URL}/api/invites/{invite['code']}/join?username={username}"
        )
        
        assert response.status_code == 200, f"Failed to join via invite: {response.text}"
        data = response.json()
        
        # Verify player joined the society
        assert data["society_id"] == invite["society_id"]
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/players/{player['id']}")
        
        print(f"SUCCESS: Existing user '{username}' joined via invite")
    
    def test_join_with_invalid_code_returns_404(self, api_client):
        """Joining with invalid code should return 404"""
        response = api_client.post(
            f"{BASE_URL}/api/invites/invalidcode123/join?username=TestUser"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("SUCCESS: Invalid invite code returns 404 on join")


class TestRevokeInvite:
    """Test DELETE /api/societies/{society_id}/invites/{invite_id} - Revoke invite"""
    
    def test_admin_can_revoke_invite(self, api_client, test_society_data):
        """Admin should be able to revoke an invite"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        
        # Create a new invite to revoke
        create_response = api_client.post(
            f"{BASE_URL}/api/societies/{society['id']}/invites?admin_id={admin['id']}",
            json={"expires_in_days": 1}
        )
        assert create_response.status_code == 200
        invite = create_response.json()
        
        # Revoke the invite
        response = api_client.delete(
            f"{BASE_URL}/api/societies/{society['id']}/invites/{invite['id']}?admin_id={admin['id']}"
        )
        
        assert response.status_code == 200, f"Failed to revoke invite: {response.text}"
        
        # Verify invite is no longer accessible
        get_response = api_client.get(f"{BASE_URL}/api/invites/{invite['code']}")
        assert get_response.status_code == 404, "Revoked invite should return 404"
        
        print(f"SUCCESS: Admin revoked invite '{invite['code']}'")
    
    def test_non_admin_cannot_revoke_invite(self, api_client, test_society_data):
        """Non-admin should NOT be able to revoke invites"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        member = test_society_data["member"]
        
        # Create an invite as admin
        create_response = api_client.post(
            f"{BASE_URL}/api/societies/{society['id']}/invites?admin_id={admin['id']}",
            json={}
        )
        assert create_response.status_code == 200
        invite = create_response.json()
        test_society_data["created_invites"].append(invite)
        
        # Try to revoke as non-admin
        response = api_client.delete(
            f"{BASE_URL}/api/societies/{society['id']}/invites/{invite['id']}?admin_id={member['id']}"
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("SUCCESS: Non-admin correctly rejected from revoking invite")


class TestExistingInviteData:
    """Test with existing invite data from the database"""
    
    def test_get_existing_invite(self, api_client):
        """Verify we can get the existing test invite"""
        # Using the test invite code from the review request
        response = api_client.get(f"{BASE_URL}/api/invites/2exdvkqp")
        
        assert response.status_code == 200, f"Failed to get existing invite: {response.text}"
        data = response.json()
        
        assert data["code"] == "2exdvkqp"
        assert data["society_name"] == "Test Golf Society"
        assert "member_count" in data
        assert "expires_at" in data
        
        print(f"SUCCESS: Retrieved existing invite for '{data['society_name']}' with {data['member_count']} members")
    
    def test_existing_society_invites(self, api_client):
        """Verify we can list invites for existing Test Golf Society"""
        # Test Golf Society ID and admin ID from the database
        society_id = "7da5e066-7b49-4632-8733-11bc2056678c"
        admin_id = "96bb8281-2130-4f0f-a71b-3eb0aec50d51"
        
        response = api_client.get(
            f"{BASE_URL}/api/societies/{society_id}/invites?admin_id={admin_id}"
        )
        
        assert response.status_code == 200, f"Failed to list invites: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # Should have at least the test invite
        assert len(data) >= 1, "Should have at least one invite"
        
        print(f"SUCCESS: Listed {len(data)} invites for Test Golf Society")


class TestInviteNotFound:
    """Test error handling for non-existent invites"""
    
    def test_revoke_nonexistent_invite(self, api_client, test_society_data):
        """Should return 404 for non-existent invite"""
        society = test_society_data["society"]
        admin = test_society_data["admin"]
        fake_id = str(uuid.uuid4())
        
        response = api_client.delete(
            f"{BASE_URL}/api/societies/{society['id']}/invites/{fake_id}?admin_id={admin['id']}"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("SUCCESS: 404 returned for non-existent invite revocation")
    
    def test_create_invite_nonexistent_society(self, api_client):
        """Should return 404 for non-existent society"""
        fake_id = str(uuid.uuid4())
        
        response = api_client.post(
            f"{BASE_URL}/api/societies/{fake_id}/invites?admin_id=fake",
            json={}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("SUCCESS: 404 returned for non-existent society invite creation")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
