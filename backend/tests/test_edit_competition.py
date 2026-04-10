"""
Test Edit Competition Feature
Tests PUT /api/competitions/{id} endpoint for updating competition details
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEditCompetition:
    """Tests for PUT /api/competitions/{id} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test competition before each test"""
        self.test_comp_id = None
        # Create a test competition
        payload = {
            "name": f"TEST_EditComp_{uuid.uuid4().hex[:8]}",
            "description": "Original description",
            "num_holes": 18,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "min_rounds": 13,
            "society_id": None
        }
        response = requests.post(f"{BASE_URL}/api/competitions", json=payload)
        assert response.status_code == 200, f"Failed to create test competition: {response.text}"
        self.test_comp = response.json()
        self.test_comp_id = self.test_comp["id"]
        yield
        # Cleanup
        if self.test_comp_id:
            requests.delete(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
    
    def test_update_competition_name(self):
        """Test updating competition name"""
        new_name = f"TEST_UpdatedName_{uuid.uuid4().hex[:8]}"
        payload = {"name": new_name}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200, f"Failed to update name: {response.text}"
        
        data = response.json()
        assert data["name"] == new_name, f"Name not updated. Expected: {new_name}, Got: {data['name']}"
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == new_name
        print(f"✓ Competition name updated successfully to: {new_name}")
    
    def test_update_competition_description(self):
        """Test updating competition description"""
        new_description = "Updated description for testing"
        payload = {"description": new_description}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200, f"Failed to update description: {response.text}"
        
        data = response.json()
        assert data["description"] == new_description
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
        assert get_response.json()["description"] == new_description
        print(f"✓ Competition description updated successfully")
    
    def test_update_competition_start_date(self):
        """Test updating competition start_date"""
        new_start_date = "2026-03-15"
        payload = {"start_date": new_start_date}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200, f"Failed to update start_date: {response.text}"
        
        data = response.json()
        assert data["start_date"] == new_start_date
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
        assert get_response.json()["start_date"] == new_start_date
        print(f"✓ Competition start_date updated to: {new_start_date}")
    
    def test_update_competition_end_date(self):
        """Test updating competition end_date"""
        new_end_date = "2026-11-30"
        payload = {"end_date": new_end_date}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200, f"Failed to update end_date: {response.text}"
        
        data = response.json()
        assert data["end_date"] == new_end_date
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
        assert get_response.json()["end_date"] == new_end_date
        print(f"✓ Competition end_date updated to: {new_end_date}")
    
    def test_update_competition_min_rounds(self):
        """Test updating competition min_rounds"""
        new_min_rounds = 10
        payload = {"min_rounds": new_min_rounds}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200, f"Failed to update min_rounds: {response.text}"
        
        data = response.json()
        assert data["min_rounds"] == new_min_rounds
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
        assert get_response.json()["min_rounds"] == new_min_rounds
        print(f"✓ Competition min_rounds updated to: {new_min_rounds}")
    
    def test_update_multiple_fields(self):
        """Test updating multiple fields at once"""
        payload = {
            "name": f"TEST_MultiUpdate_{uuid.uuid4().hex[:8]}",
            "description": "Multi-field update test",
            "start_date": "2026-04-01",
            "end_date": "2026-10-31",
            "min_rounds": 8
        }
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200, f"Failed to update multiple fields: {response.text}"
        
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["description"] == payload["description"]
        assert data["start_date"] == payload["start_date"]
        assert data["end_date"] == payload["end_date"]
        assert data["min_rounds"] == payload["min_rounds"]
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
        get_data = get_response.json()
        assert get_data["name"] == payload["name"]
        assert get_data["description"] == payload["description"]
        assert get_data["start_date"] == payload["start_date"]
        assert get_data["end_date"] == payload["end_date"]
        assert get_data["min_rounds"] == payload["min_rounds"]
        print(f"✓ Multiple fields updated successfully")
    
    def test_update_nonexistent_competition(self):
        """Test updating a competition that doesn't exist"""
        fake_id = str(uuid.uuid4())
        payload = {"name": "Should Fail"}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{fake_id}", json=payload)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly returns 404 for non-existent competition")
    
    def test_update_with_empty_payload(self):
        """Test updating with empty payload returns 400"""
        payload = {}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 400, f"Expected 400 for empty payload, got {response.status_code}"
        print(f"✓ Correctly returns 400 for empty payload")
    
    def test_update_preserves_unchanged_fields(self):
        """Test that updating one field preserves other fields"""
        # Get original values
        original = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}").json()
        
        # Update only name
        new_name = f"TEST_PreserveFields_{uuid.uuid4().hex[:8]}"
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json={"name": new_name})
        assert response.status_code == 200
        
        # Verify other fields are preserved
        updated = response.json()
        assert updated["name"] == new_name
        assert updated["description"] == original["description"]
        assert updated["num_holes"] == original["num_holes"]
        assert updated["min_rounds"] == original["min_rounds"]
        print(f"✓ Unchanged fields preserved correctly")
    
    def test_update_status_field(self):
        """Test updating competition status"""
        payload = {"status": "active"}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200, f"Failed to update status: {response.text}"
        
        data = response.json()
        assert data["status"] == "active"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
        assert get_response.json()["status"] == "active"
        print(f"✓ Competition status updated to: active")


class TestEditCompetitionEdgeCases:
    """Edge case tests for competition editing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test competition before each test"""
        self.test_comp_id = None
        payload = {
            "name": f"TEST_EdgeCase_{uuid.uuid4().hex[:8]}",
            "description": "Edge case testing",
            "num_holes": 18,
            "min_rounds": 13
        }
        response = requests.post(f"{BASE_URL}/api/competitions", json=payload)
        assert response.status_code == 200
        self.test_comp = response.json()
        self.test_comp_id = self.test_comp["id"]
        yield
        if self.test_comp_id:
            requests.delete(f"{BASE_URL}/api/competitions/{self.test_comp_id}")
    
    def test_update_with_null_dates(self):
        """Test setting dates to null"""
        # First set dates
        requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json={
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        })
        
        # Now set to null - Note: This may not work depending on backend implementation
        # The backend uses Optional fields, so null should be valid
        payload = {"start_date": None, "end_date": None}
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        
        # Check if backend accepts null values
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Dates can be set to null. start_date: {data.get('start_date')}, end_date: {data.get('end_date')}")
        else:
            print(f"Note: Backend may not accept null values for dates (status: {response.status_code})")
    
    def test_update_with_empty_string_description(self):
        """Test setting description to empty string"""
        payload = {"description": ""}
        
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["description"] == ""
        print(f"✓ Description can be set to empty string")
    
    def test_update_min_rounds_boundary(self):
        """Test min_rounds with boundary values"""
        # Test minimum value (1)
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json={"min_rounds": 1})
        assert response.status_code == 200
        assert response.json()["min_rounds"] == 1
        
        # Test higher value
        response = requests.put(f"{BASE_URL}/api/competitions/{self.test_comp_id}", json={"min_rounds": 52})
        assert response.status_code == 200
        assert response.json()["min_rounds"] == 52
        print(f"✓ min_rounds boundary values work correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
