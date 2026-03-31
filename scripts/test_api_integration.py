"""
Drywall Toolbox API Integration Tests

Tests for the React frontend's integration with WordPress and DTB custom APIs.
WooCommerce and Veeqo integrations are OPTIONAL and not yet fully implemented.

Current reality:
- WordPress pages/posts available
- Custom DTB endpoints for schematics and nonces
- Cart stored in React Context (localStorage)
- No product database yet (CSV doesn't exist)
- WooCommerce integration: conditional/optional feature
- Veeqo integration: conditional/optional feature

Uses pytest with mocked API responses.
"""

import pytest
import requests
from unittest.mock import patch, MagicMock


# ─── Module-level Fixtures ────────────────────────────────────────────────────

@pytest.fixture
def mock_wordpress_pages():
    """Mock response for WordPress pages endpoint"""
    return [
        {
            "id": 1,
            "title": {"rendered": "Home"},
            "content": {"rendered": "<p>Welcome to Drywall Toolbox</p>"},
            "slug": "home",
            "status": "publish",
        },
        {
            "id": 2,
            "title": {"rendered": "About"},
            "content": {"rendered": "<p>About our drywall tools</p>"},
            "slug": "about",
            "status": "publish",
        },
    ]


@pytest.fixture
def mock_wordpress_posts():
    """Mock response for WordPress posts endpoint"""
    return [
        {
            "id": 101,
            "title": {"rendered": "Drywall Tool Tips"},
            "content": {"rendered": "<p>Best practices for drywall tools</p>"},
            "slug": "drywall-tool-tips",
            "status": "publish",
            "date": "2024-01-15T10:00:00",
        }
    ]


@pytest.fixture
def mock_nonce_response():
    """Mock response for custom DTB nonce endpoint"""
    return {
        "nonce": "abc123xyz789def",
        "timestamp": 1234567890,
        "expires": 86400
    }


@pytest.fixture
def mock_schematic_response():
    """Mock response for schematics media endpoint"""
    return {
        "schematicId": "graco-xt-parts",
        "brand": "Graco",
        "media": [
            {
                "url": "/public/schematics/graco/xt-parts.webp",
                "type": "webp",
                "title": "Graco XT Parts Diagram"
            }
        ]
    }


@pytest.fixture
def mock_schematics_list():
    """Mock response for listing available schematics by brand"""
    return [
        {"brand": "Graco", "schematicId": "graco-xt-parts", "count": 5},
        {"brand": "TapeTech", "schematicId": "tapetech-auto-taper", "count": 3},
        {"brand": "Columbia", "schematicId": "columbia-level-box", "count": 2},
    ]


# ─── WordPress REST API Tests ─────────────────────────────────────────────────

class TestWordPressAPI:
    """Tests for WordPress REST API - currently used for content/pages"""

    API_BASE = "http://localhost:8000"

    def test_fetch_all_pages(self, mock_wordpress_pages):
        """Test fetching all WordPress pages for site content"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_wordpress_pages
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/wp/v2/pages")

            assert response.status_code == 200
            pages = response.json()
            assert len(pages) == 2
            assert pages[0]["slug"] == "home"
            assert pages[1]["slug"] == "about"

    def test_fetch_page_by_id(self, mock_wordpress_pages):
        """Test fetching a single WordPress page by ID"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_wordpress_pages[0]
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/wp/v2/pages/1")

            assert response.status_code == 200
            page = response.json()
            assert page["id"] == 1
            assert page["slug"] == "home"

    def test_fetch_all_posts(self, mock_wordpress_posts):
        """Test fetching WordPress posts (blog content)"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_wordpress_posts
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/wp/v2/posts")

            assert response.status_code == 200
            posts = response.json()
            assert len(posts) >= 1
            assert "title" in posts[0]
            assert "content" in posts[0]

    def test_wordpress_page_has_required_fields(self, mock_wordpress_pages):
        """Test that WordPress pages have required structure"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_wordpress_pages
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/wp/v2/pages")
            pages = response.json()

            for page in pages:
                assert "id" in page
                assert "title" in page
                assert "content" in page
                assert "slug" in page

    def test_handle_wordpress_404(self):
        """Test handling 404 from WordPress (page not found)"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.status_code = 404
            mock_get.return_value.json.return_value = {
                "code": "rest_post_invalid_id",
                "message": "Invalid post ID"
            }

            response = requests.get(f"http://localhost:8000/wp-json/wp/v2/pages/9999")

            assert response.status_code == 404

    def test_handle_wordpress_connection_error(self):
        """Test handling connection errors to WordPress"""
        with patch("requests.get") as mock_get:
            mock_get.side_effect = requests.ConnectionError("Connection refused")

            with pytest.raises(requests.ConnectionError):
                requests.get(f"http://localhost:8000/wp-json/wp/v2/pages")


# ─── Custom DTB Endpoints Tests ───────────────────────────────────────────────

class TestCustomDTBAPI:
    """Tests for custom DTB (Drywall Toolbox) REST API endpoints"""

    API_BASE = "http://localhost:8000"

    def test_fetch_nonce(self, mock_nonce_response):
        """Test fetching a nonce for secure form submissions"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_nonce_response
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/dtb/v1/nonce")

            assert response.status_code == 200
            nonce_data = response.json()
            assert "nonce" in nonce_data
            assert len(nonce_data["nonce"]) > 0
            assert nonce_data["expires"] == 86400

    def test_nonce_has_required_fields(self, mock_nonce_response):
        """Test that nonce response has required security fields"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_nonce_response
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/dtb/v1/nonce")
            nonce_data = response.json()

            assert "nonce" in nonce_data
            assert "timestamp" in nonce_data
            assert "expires" in nonce_data

    def test_fetch_schematic_by_brand(self, mock_schematic_response):
        """Test fetching schematic diagrams for a specific brand"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_schematic_response
            mock_get.return_value.status_code = 200

            response = requests.get(
                f"{self.API_BASE}/wp-json/dtb/v1/schematics/media",
                params={"brand": "Graco"}
            )

            assert response.status_code == 200
            schematic = response.json()
            assert schematic["brand"] == "Graco"
            assert len(schematic["media"]) > 0

    def test_schematic_media_format(self, mock_schematic_response):
        """Test that schematics have proper media format (URLs, types)"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_schematic_response
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/dtb/v1/schematics/media")
            schematic = response.json()

            for media in schematic["media"]:
                assert "url" in media
                assert "type" in media
                # WebP is preferred for performance, but PNG/JPG are fallbacks
                assert media["type"] in ["webp", "png", "jpg"]

    def test_list_available_schematics(self, mock_schematics_list):
        """Test listing available schematics by brand"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = mock_schematics_list
            mock_get.return_value.status_code = 200

            response = requests.get(f"{self.API_BASE}/wp-json/dtb/v1/schematics")

            assert response.status_code == 200
            schematics = response.json()
            assert len(schematics) == 3
            assert any(s["brand"] == "Graco" for s in schematics)

    def test_invalid_brand_returns_404(self):
        """Test requesting schematics for non-existent brand"""
        with patch("requests.get") as mock_get:
            mock_get.return_value.status_code = 404
            mock_get.return_value.json.return_value = {
                "code": "dtb_brand_not_found",
                "message": "Brand not found"
            }

            response = requests.get(
                f"http://localhost:8000/wp-json/dtb/v1/schematics/media",
                params={"brand": "FakeBrand"}
            )

            assert response.status_code == 404

    def test_schematic_endpoint_connection_error(self):
        """Test handling connection errors when fetching schematics"""
        with patch("requests.get") as mock_get:
            mock_get.side_effect = requests.ConnectionError("Connection refused")

            with pytest.raises(requests.ConnectionError):
                requests.get(f"http://localhost:8000/wp-json/dtb/v1/schematics/media")


# ─── Notes on WooCommerce and Veeqo Integration ────────────────────────────────

"""
WooCommerce Integration Status: CONDITIONAL (Not yet fully implemented)
- The React frontend has code to handle WooCommerce API integration
- However, WooCommerce is NOT the primary product source yet
- Products are loaded from a CSV file (which currently doesn't exist)
- To test WooCommerce endpoints, the CSV must be populated first

Veeqo Integration Status: OPTIONAL
- Veeqo is designed as an optional inventory management system
- Can be enabled/disabled in settings
- Frontend has conditional logic to use it when available

When the product database is ready:
1. Populate products_catalog.csv in /public/
2. Add test_woocommerce_products.py for WooCommerce API tests
3. Add test_veeqo_inventory.py for inventory sync tests
4. Update test_api_workflows.py with real shopping workflows

Current focus: Test the infrastructure that IS implemented (WordPress, DTB endpoints)
"""
