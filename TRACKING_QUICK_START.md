# 🚀 Public Tracking System - Quick Start Guide

## 📍 Access URLs

### For End Users (No Login Required)

1. **Main Tracking Page**
   ```
   http://localhost:3000/verify
   ```
   - Enter SKR number to start tracking
   - Clean, user-friendly interface
   - Works on any device

2. **Direct SKR Tracking**
   ```
   http://localhost:3000/verify/skr/[YOUR-SKR-NUMBER]
   ```
   Example:
   ```
   http://localhost:3000/verify/skr/SKR-2024-001
   ```

### From Home Page
- Click the **"Verify SKR"** button on the home page
- It's prominently displayed next to "Access Dashboard"

---

## 🎯 What Users Can Do

### ✅ Verification Tab
- Verify SKR authenticity
- View SKR status (Issued, In Transit, Delivered, Closed)
- See client information (name, country)
- View asset details (type, value, currency)
- Verify digital hash (optional security feature)

### ✅ Tracking Tab
- View current tracking status
- See current location and country
- Check estimated/actual delivery dates
- Read latest notes and updates
- View tracking number

### ✅ History Tab
- Complete timeline of all events
- Event types with icons
- Location for each event
- Detailed descriptions
- Timestamps for everything

---

## 🔧 API Endpoints (Public Access)

### 1. Verify SKR
```bash
GET /api/verify/skr/[skrNumber]
```

**Example:**
```bash
curl http://localhost:3000/api/verify/skr/SKR-2024-001
```

**With Hash Verification:**
```bash
curl "http://localhost:3000/api/verify/skr/SKR-2024-001?hash=abc123"
```

### 2. Get Tracking Info
```bash
GET /api/verify/tracking/[skrNumber]
```

**Example:**
```bash
curl http://localhost:3000/api/verify/tracking/SKR-2024-001
```

---

## 📱 Features

| Feature | Status | Description |
|---------|--------|-------------|
| Public Access | ✅ | No authentication required |
| SKR Verification | ✅ | Verify document authenticity |
| Real-time Tracking | ✅ | Current location and status |
| Event History | ✅ | Complete timeline |
| Hash Verification | ✅ | Digital signature check |
| Mobile Responsive | ✅ | Works on all devices |
| CORS Enabled | ✅ | Can be integrated anywhere |
| Caching | ✅ | Fast performance |

---

## 🎨 User Interface

### Landing Page (`/verify`)
- Large search box for SKR number
- Feature showcase cards
- "What is an SKR?" educational section
- Support contact information
- Professional G1 Holding branding

### Details Page (`/verify/skr/[skrNumber]`)
- Three tabs: Verification, Tracking, History
- Color-coded status badges
- Timeline visualization
- Back to search button
- Last updated timestamps

---

## 🔐 Security

### Public Information Only
- ✅ SKR number, status, dates
- ✅ Basic client info (name, country)
- ✅ Asset type and declared value
- ✅ Tracking locations and events

### Protected Information
- ❌ Internal database IDs
- ❌ Client contact details
- ❌ Detailed financial data
- ❌ Internal notes
- ❌ User information

---

## 📊 Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Issued | Yellow | SKR created, awaiting pickup |
| In Transit | Orange | Currently being shipped |
| Delivered | Green | Successfully delivered |
| Closed | Purple | Transaction completed |
| Pending | Gray | Awaiting action |

---

## 🚦 Quick Test

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser to:
   ```
   http://localhost:3000/verify
   ```

3. Enter an existing SKR number (e.g., `SKR-2024-001`)

4. Click "Track & Verify SKR"

5. Explore the three tabs:
   - **Verification** - Check authenticity
   - **Tracking** - Current status
   - **History** - Full timeline

---

## 📞 Support Contacts

- **Verification Issues:** verify@g1groupofcompanies.com
- **General Support:** support@g1groupofcompanies.com

---

## 🔄 Integration Example

### JavaScript/React
```javascript
async function trackSKR(skrNumber) {
  try {
    // Get verification data
    const verifyRes = await fetch(
      `https://yourdomain.com/api/verify/skr/${skrNumber}`
    )
    const verification = await verifyRes.json()
    
    // Get tracking data
    const trackRes = await fetch(
      `https://yourdomain.com/api/verify/tracking/${skrNumber}`
    )
    const tracking = await trackRes.json()
    
    return {
      isValid: verification.valid,
      status: verification.status,
      currentLocation: tracking.tracking[0]?.current_location,
      events: tracking.events
    }
  } catch (error) {
    console.error('Tracking failed:', error)
    return null
  }
}

// Usage
const result = await trackSKR('SKR-2024-001')
console.log(result)
```

### Python
```python
import requests

def track_skr(skr_number):
    base_url = "https://yourdomain.com"
    
    # Get verification
    verify_res = requests.get(f"{base_url}/api/verify/skr/{skr_number}")
    verification = verify_res.json()
    
    # Get tracking
    track_res = requests.get(f"{base_url}/api/verify/tracking/{skr_number}")
    tracking = track_res.json()
    
    return {
        'is_valid': verification['valid'],
        'status': verification['status'],
        'current_location': tracking['tracking'][0]['current_location'],
        'events': tracking['events']
    }

# Usage
result = track_skr('SKR-2024-001')
print(result)
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Caching is enabled (5 min for verification, 1 min for tracking)
- CORS is enabled for all origins
- No rate limiting yet (can be added if needed)
- Mobile responsive on all pages
- Works without JavaScript (basic functionality)

---

**Ready to Use:** ✅ System is production-ready  
**Last Updated:** November 2, 2024

