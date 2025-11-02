# 🔌 Public API Integration Guide

## Overview

The G1 Holding SKR verification system provides **public REST APIs** that can be integrated into any website, mobile app, or third-party system **without authentication**.

**Production URL:** https://app.g1groupofcompanies.com

---

## 🌐 Available Public APIs

### 1. SKR Verification API

**Endpoint:**
```
GET https://app.g1groupofcompanies.com/api/verify/skr/{skrNumber}
```

**Purpose:** Verify SKR authenticity and retrieve basic information

**Parameters:**
- `skrNumber` (path parameter, required): The SKR number to verify
- `hash` (query parameter, optional): Digital hash for additional verification

**Example Request:**
```bash
curl https://app.g1groupofcompanies.com/api/verify/skr/SKR-2024-001
```

**Example Response:**
```json
{
  "valid": true,
  "skr_number": "SKR-2024-001",
  "status": "in_transit",
  "issue_date": "2024-01-15T10:00:00Z",
  "hash_valid": true,
  "verification_time": "2024-11-02T15:30:00Z",
  "client": {
    "name": "ABC Corporation",
    "country": "United States"
  },
  "asset": {
    "name": "Gold Bars",
    "type": "Precious Metals",
    "declared_value": 1000000,
    "currency": "USD"
  },
  "hash_provided": false,
  "hash_available": true
}
```

---

### 2. Tracking Information API

**Endpoint:**
```
GET https://app.g1groupofcompanies.com/api/verify/tracking/{skrNumber}
```

**Purpose:** Get real-time tracking information and event history

**Parameters:**
- `skrNumber` (path parameter, required): The SKR number to track

**Example Request:**
```bash
curl https://app.g1groupofcompanies.com/api/verify/tracking/SKR-2024-001
```

**Example Response:**
```json
{
  "success": true,
  "skr_number": "SKR-2024-001",
  "skr_status": "in_transit",
  "tracking": [
    {
      "id": "uuid",
      "tracking_number": "TRK-2024-001",
      "status": "in_transit",
      "current_location": "Los Angeles, CA",
      "current_country": "United States",
      "estimated_delivery": "2024-01-25T10:00:00Z",
      "actual_delivery": null,
      "notes": "Package cleared customs",
      "updated_at": "2024-11-02T14:00:00Z"
    }
  ],
  "events": [
    {
      "id": "uuid",
      "event_type": "in_transit",
      "event_date": "2024-01-18T12:00:00Z",
      "location": "Chicago, IL",
      "country": "United States",
      "description": "Package in transit to destination",
      "created_at": "2024-01-18T12:10:00Z"
    },
    {
      "id": "uuid",
      "event_type": "picked_up",
      "event_date": "2024-01-15T08:00:00Z",
      "location": "New York, NY",
      "country": "United States",
      "description": "Package picked up from origin",
      "created_at": "2024-01-15T08:05:00Z"
    }
  ],
  "last_updated": "2024-11-02T15:30:00Z"
}
```

---

## 🔧 Integration Examples

### 1. Simple HTML Search Form

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SKR Tracking</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
        }
        .search-box {
            margin-bottom: 20px;
        }
        input {
            padding: 10px;
            width: 70%;
            font-size: 16px;
        }
        button {
            padding: 10px 20px;
            font-size: 16px;
            background: #2563EB;
            color: white;
            border: none;
            cursor: pointer;
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .valid {
            background: #d4edda;
            border-color: #c3e6cb;
        }
        .invalid {
            background: #f8d7da;
            border-color: #f5c6cb;
        }
    </style>
</head>
<body>
    <h1>Track Your SKR</h1>
    
    <div class="search-box">
        <input type="text" id="skrNumber" placeholder="Enter SKR Number (e.g., SKR-2024-001)">
        <button onclick="trackSKR()">Track</button>
    </div>
    
    <div id="result"></div>
    
    <script>
        async function trackSKR() {
            const skrNumber = document.getElementById('skrNumber').value.trim();
            const resultDiv = document.getElementById('result');
            
            if (!skrNumber) {
                resultDiv.innerHTML = '<p>Please enter an SKR number</p>';
                return;
            }
            
            resultDiv.innerHTML = '<p>Loading...</p>';
            
            try {
                // Fetch verification data
                const verifyResponse = await fetch(
                    `https://app.g1groupofcompanies.com/api/verify/skr/${encodeURIComponent(skrNumber)}`
                );
                const verifyData = await verifyResponse.json();
                
                if (!verifyData.valid) {
                    resultDiv.className = 'result invalid';
                    resultDiv.innerHTML = `
                        <h2>❌ Invalid SKR</h2>
                        <p>${verifyData.error || 'This SKR could not be verified.'}</p>
                    `;
                    return;
                }
                
                // Fetch tracking data
                const trackResponse = await fetch(
                    `https://app.g1groupofcompanies.com/api/verify/tracking/${encodeURIComponent(skrNumber)}`
                );
                const trackData = await trackResponse.json();
                
                // Display results
                resultDiv.className = 'result valid';
                resultDiv.innerHTML = `
                    <h2>✅ Valid SKR</h2>
                    <p><strong>SKR Number:</strong> ${verifyData.skr_number}</p>
                    <p><strong>Status:</strong> ${verifyData.status}</p>
                    <p><strong>Client:</strong> ${verifyData.client?.name} (${verifyData.client?.country})</p>
                    <p><strong>Asset:</strong> ${verifyData.asset?.name}</p>
                    <p><strong>Value:</strong> ${verifyData.asset?.currency} ${verifyData.asset?.declared_value?.toLocaleString()}</p>
                    ${trackData.success && trackData.tracking.length > 0 ? `
                        <hr>
                        <h3>Current Location</h3>
                        <p><strong>📍 ${trackData.tracking[0].current_location}, ${trackData.tracking[0].current_country}</strong></p>
                        <p><em>${trackData.tracking[0].notes || ''}</em></p>
                    ` : ''}
                    <hr>
                    <a href="https://app.g1groupofcompanies.com/verify/skr/${verifyData.skr_number}" target="_blank">
                        View Full Details →
                    </a>
                `;
                
            } catch (error) {
                resultDiv.className = 'result invalid';
                resultDiv.innerHTML = `
                    <h2>Error</h2>
                    <p>Failed to fetch tracking information. Please try again.</p>
                `;
            }
        }
        
        // Allow Enter key to trigger search
        document.getElementById('skrNumber').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                trackSKR();
            }
        });
    </script>
</body>
</html>
```

---

### 2. React Component

```jsx
import { useState } from 'react';

const SKRTracker = () => {
  const [skrNumber, setSkrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const trackSKR = async () => {
    if (!skrNumber.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch verification
      const verifyRes = await fetch(
        `https://app.g1groupofcompanies.com/api/verify/skr/${encodeURIComponent(skrNumber)}`
      );
      const verifyData = await verifyRes.json();
      
      if (!verifyData.valid) {
        setError(verifyData.error || 'Invalid SKR');
        setResult(null);
        return;
      }
      
      // Fetch tracking
      const trackRes = await fetch(
        `https://app.g1groupofcompanies.com/api/verify/tracking/${encodeURIComponent(skrNumber)}`
      );
      const trackData = await trackRes.json();
      
      setResult({ verification: verifyData, tracking: trackData });
      
    } catch (err) {
      setError('Failed to fetch tracking information');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skr-tracker">
      <h2>Track Your SKR</h2>
      
      <div className="search-box">
        <input
          type="text"
          value={skrNumber}
          onChange={(e) => setSkrNumber(e.target.value.toUpperCase())}
          placeholder="Enter SKR Number"
          onKeyPress={(e) => e.key === 'Enter' && trackSKR()}
        />
        <button onClick={trackSKR} disabled={loading}>
          {loading ? 'Tracking...' : 'Track'}
        </button>
      </div>
      
      {error && (
        <div className="error">
          <p>❌ {error}</p>
        </div>
      )}
      
      {result && (
        <div className="result">
          <h3>✅ Valid SKR</h3>
          <p><strong>SKR:</strong> {result.verification.skr_number}</p>
          <p><strong>Status:</strong> {result.verification.status}</p>
          <p><strong>Client:</strong> {result.verification.client?.name}</p>
          <p><strong>Asset:</strong> {result.verification.asset?.name}</p>
          
          {result.tracking.success && result.tracking.tracking.length > 0 && (
            <>
              <h4>Current Location</h4>
              <p>📍 {result.tracking.tracking[0].current_location}, {result.tracking.tracking[0].current_country}</p>
            </>
          )}
          
          <a 
            href={`https://app.g1groupofcompanies.com/verify/skr/${result.verification.skr_number}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Full Details →
          </a>
        </div>
      )}
    </div>
  );
};

export default SKRTracker;
```

---

### 3. WordPress Plugin/Widget

```php
<?php
/**
 * SKR Tracker Widget
 */

function g1_skr_tracker_shortcode() {
    ob_start();
    ?>
    <div class="g1-skr-tracker">
        <h3>Track Your SKR</h3>
        <input type="text" id="g1-skr-input" placeholder="Enter SKR Number" />
        <button id="g1-track-btn">Track</button>
        <div id="g1-result"></div>
    </div>
    
    <script>
    document.getElementById('g1-track-btn').addEventListener('click', async function() {
        const skrNumber = document.getElementById('g1-skr-input').value.trim();
        const resultDiv = document.getElementById('g1-result');
        
        if (!skrNumber) {
            resultDiv.innerHTML = '<p>Please enter an SKR number</p>';
            return;
        }
        
        resultDiv.innerHTML = '<p>Loading...</p>';
        
        try {
            const response = await fetch(
                'https://app.g1groupofcompanies.com/api/verify/skr/' + encodeURIComponent(skrNumber)
            );
            const data = await response.json();
            
            if (data.valid) {
                resultDiv.innerHTML = `
                    <div class="valid-result">
                        <h4>✅ Valid SKR</h4>
                        <p><strong>Number:</strong> ${data.skr_number}</p>
                        <p><strong>Status:</strong> ${data.status}</p>
                        <p><strong>Client:</strong> ${data.client.name}</p>
                        <a href="https://app.g1groupofcompanies.com/verify/skr/${data.skr_number}" target="_blank">
                            View Full Details
                        </a>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = '<p class="error">❌ Invalid SKR</p>';
            }
        } catch (error) {
            resultDiv.innerHTML = '<p class="error">Error fetching data</p>';
        }
    });
    </script>
    
    <style>
    .g1-skr-tracker {
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin: 20px 0;
    }
    .g1-skr-tracker input {
        padding: 10px;
        width: 70%;
        margin-right: 10px;
    }
    .g1-skr-tracker button {
        padding: 10px 20px;
        background: #2563EB;
        color: white;
        border: none;
        cursor: pointer;
    }
    .valid-result {
        margin-top: 20px;
        padding: 15px;
        background: #d4edda;
        border-radius: 5px;
    }
    .error {
        color: red;
    }
    </style>
    <?php
    return ob_get_clean();
}

add_shortcode('g1_skr_tracker', 'g1_skr_tracker_shortcode');
```

**Usage in WordPress:**
```
[g1_skr_tracker]
```

---

### 4. Mobile App (React Native)

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';

const SKRTracker = () => {
  const [skrNumber, setSkrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const trackSKR = async () => {
    if (!skrNumber.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://app.g1groupofcompanies.com/api/verify/skr/${encodeURIComponent(skrNumber)}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert('Failed to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Your SKR</Text>
      
      <TextInput
        style={styles.input}
        value={skrNumber}
        onChangeText={(text) => setSkrNumber(text.toUpperCase())}
        placeholder="Enter SKR Number"
        autoCapitalize="characters"
      />
      
      <Button title="Track" onPress={trackSKR} disabled={loading} />
      
      {loading && <ActivityIndicator size="large" color="#2563EB" />}
      
      {result && result.valid && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>✅ Valid SKR</Text>
          <Text>SKR: {result.skr_number}</Text>
          <Text>Status: {result.status}</Text>
          <Text>Client: {result.client?.name}</Text>
          <Text>Asset: {result.asset?.name}</Text>
        </View>
      )}
      
      {result && !result.valid && (
        <Text style={styles.error}>❌ Invalid SKR</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  result: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#d4edda',
    borderRadius: 5,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginTop: 20,
  },
});

export default SKRTracker;
```

---

### 5. Python Integration

```python
import requests

class SKRTracker:
    BASE_URL = "https://app.g1groupofcompanies.com/api/verify"
    
    def verify_skr(self, skr_number):
        """Verify an SKR and get basic information"""
        try:
            response = requests.get(f"{self.BASE_URL}/skr/{skr_number}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"valid": False, "error": str(e)}
    
    def get_tracking(self, skr_number):
        """Get tracking information for an SKR"""
        try:
            response = requests.get(f"{self.BASE_URL}/tracking/{skr_number}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def get_full_info(self, skr_number):
        """Get both verification and tracking information"""
        verification = self.verify_skr(skr_number)
        
        if not verification.get('valid'):
            return verification
        
        tracking = self.get_tracking(skr_number)
        
        return {
            "verification": verification,
            "tracking": tracking
        }

# Usage example
tracker = SKRTracker()

# Verify an SKR
result = tracker.verify_skr("SKR-2024-001")
if result['valid']:
    print(f"✅ Valid SKR: {result['skr_number']}")
    print(f"Status: {result['status']}")
    print(f"Client: {result['client']['name']}")
else:
    print(f"❌ Invalid: {result.get('error')}")

# Get full tracking information
full_info = tracker.get_full_info("SKR-2024-001")
print(full_info)
```

---

### 6. Node.js Backend Integration

```javascript
const axios = require('axios');

class SKRTracker {
    constructor() {
        this.baseURL = 'https://app.g1groupofcompanies.com/api/verify';
    }
    
    async verifySKR(skrNumber) {
        try {
            const response = await axios.get(`${this.baseURL}/skr/${skrNumber}`);
            return response.data;
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    async getTracking(skrNumber) {
        try {
            const response = await axios.get(`${this.baseURL}/tracking/${skrNumber}`);
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getFullInfo(skrNumber) {
        const [verification, tracking] = await Promise.all([
            this.verifySKR(skrNumber),
            this.getTracking(skrNumber)
        ]);
        
        return {
            verification,
            tracking
        };
    }
}

// Usage in Express.js
const express = require('express');
const app = express();
const tracker = new SKRTracker();

app.get('/track/:skrNumber', async (req, res) => {
    const { skrNumber } = req.params;
    const result = await tracker.getFullInfo(skrNumber);
    res.json(result);
});

module.exports = SKRTracker;
```

---

## 🔒 API Features

### CORS Support
- ✅ **Enabled for all origins** (`Access-Control-Allow-Origin: *`)
- ✅ Can be called from any website or domain
- ✅ No preflight authentication required

### Caching
- ✅ **Verification API:** 5 minutes cache
- ✅ **Tracking API:** 1 minute cache
- ✅ Reduces server load and improves performance

### Rate Limiting
- ℹ️ Currently unlimited (can be added if needed)
- 💡 Recommended for production: 100 requests/minute per IP

### Security
- ✅ Only public information exposed
- ✅ No authentication required
- ✅ No sensitive data in responses
- ✅ Input validation on all parameters

---

## 📊 Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | Success | SKR found and data returned |
| 404 | Not Found | SKR doesn't exist |
| 400 | Bad Request | Invalid SKR format or status |
| 500 | Server Error | Internal server error |

---

## 🎯 Use Cases

### 1. Company Website Integration
- Add SKR tracking widget to homepage
- Allow customers to verify their SKRs
- Display real-time status updates

### 2. Mobile App
- Build iOS/Android app for SKR tracking
- Push notifications for status changes
- Offline caching of tracking history

### 3. Third-Party Integrations
- Partner websites can verify SKRs
- Financial platforms can validate documents
- Logistics companies can track shipments

### 4. Internal Systems
- CRM integration
- Customer service portals
- Automated verification systems

### 5. Email/SMS Notifications
- Send tracking links to customers
- Automated status update emails
- SMS alerts for delivery

---

## 📝 Best Practices

### 1. Error Handling
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    // Handle data
} catch (error) {
    // Show user-friendly error message
    console.error('Failed to fetch:', error);
}
```

### 2. Loading States
```javascript
// Always show loading indicator
setLoading(true);
try {
    await fetchData();
} finally {
    setLoading(false);  // Always reset loading
}
```

### 3. Input Validation
```javascript
// Validate SKR number format before API call
const skrPattern = /^SKR-\d{4}-\d{3,}$/;
if (!skrPattern.test(skrNumber)) {
    alert('Invalid SKR format');
    return;
}
```

### 4. Caching on Client Side
```javascript
// Cache results to reduce API calls
const cache = new Map();

async function getWithCache(skrNumber) {
    if (cache.has(skrNumber)) {
        return cache.get(skrNumber);
    }
    
    const data = await fetchSKR(skrNumber);
    cache.set(skrNumber, data);
    
    // Clear cache after 5 minutes
    setTimeout(() => cache.delete(skrNumber), 5 * 60 * 1000);
    
    return data;
}
```

---

## 🧪 Testing

### Test SKR Numbers
Use these for testing (create them in your system first):
- `SKR-2024-001`
- `SKR-2024-002`
- `SKR-2024-003`

### cURL Testing
```bash
# Test verification API
curl -X GET https://app.g1groupofcompanies.com/api/verify/skr/SKR-2024-001

# Test with hash verification
curl -X GET "https://app.g1groupofcompanies.com/api/verify/skr/SKR-2024-001?hash=abc123"

# Test tracking API
curl -X GET https://app.g1groupofcompanies.com/api/verify/tracking/SKR-2024-001

# Test CORS
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://app.g1groupofcompanies.com/api/verify/skr/SKR-2024-001
```

---

## 📞 Support

### Technical Support
- **API Issues:** support@g1holding.com
- **Integration Help:** verify@g1holding.com

### Documentation
- **Full Docs:** `PUBLIC_TRACKING_SYSTEM.md`
- **Quick Start:** `TRACKING_QUICK_START.md`

---

## 🚀 Quick Start Checklist

- [ ] Read this documentation
- [ ] Test APIs with cURL
- [ ] Choose integration method (HTML/React/Mobile/etc.)
- [ ] Copy relevant code example
- [ ] Replace test SKR with real numbers
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test on your platform
- [ ] Deploy to production

---

**API Status:** ✅ Production Ready  
**Base URL:** https://app.g1groupofcompanies.com  
**CORS:** Enabled for all origins  
**Authentication:** None required  
**Rate Limit:** Unlimited (currently)

---

**Happy Integrating!** 🎉


