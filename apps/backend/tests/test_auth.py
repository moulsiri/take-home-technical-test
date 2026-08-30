import pytest

@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post("/auth/register", json={
        "email": "test@example.com",
        "name": "Test User",
        "password": "strongPassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Success"
    
    # Check that HTTPOnly cookies were set for tokens
    cookies = response.cookies
    assert "accessToken" in cookies
    assert "refreshToken" in cookies

@pytest.mark.asyncio
async def test_login_user(client):
    # Register first
    await client.post("/auth/register", json={
        "email": "login@example.com",
        "name": "Login User",
        "password": "loginPassword123"
    })
    
    # Attempt login
    response = await client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "loginPassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Success"
    
    cookies = response.cookies
    assert "accessToken" in cookies
    assert "refreshToken" in cookies

@pytest.mark.asyncio
async def test_protected_route_unauthorized(client):
    # Without cookies, this should fail with 401
    response = await client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

@pytest.mark.asyncio
async def test_protected_route_authorized(client):
    # Register and automatically get logged in
    register_res = await client.post("/auth/register", json={
        "email": "auth@example.com",
        "name": "Auth User",
        "password": "authPassword123"
    })
    
    # We should have the cookies in the client session now
    response = await client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "auth@example.com"
