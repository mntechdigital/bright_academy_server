# New API Endpoint Added

## Issue
The UI was displaying only one week's data (Week 2) despite having multiple weeks (Week 1 and Week 2) in the database for the same class, batch, and subject combination.

## Root Cause
The UI needs to fetch weekly marks data filtered by specific criteria (class, batch, subject, week, month, year) to display only the selected week's data. The existing endpoints didn't support this specific filtering combination.

## Solution
Added a new API endpoint that fetches weekly marks sheets with specific filters including week, month, and year to return only the selected week's data.

## New Endpoint

### `GET /weekly-marks-sheets/filter`

Fetches weekly marks sheets filtered by class, batch, subject, week, month, and year. Returns only the data matching the selected week.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stdClassId` | string | Yes | The class ID |
| `batchId` | string | No | The batch ID (optional) |
| `subjectId` | string | Yes | The subject ID |
| `week` | string | No | The week (e.g., "Week 1", "Week 2") |
| `month` | string | No | The month (e.g., "August") |
| `year` | string | No | The year (e.g., "2026") |

#### Example Request
```
GET /weekly-marks-sheets/filter?stdClassId=123&batchId=456&subjectId=789&week=Week+2&month=August&year=2026
```

#### Success Response (200 OK)
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Weekly marks sheets fetched successfully",
  "data": [
    {
      "id": "uuid-1",
      "month": "August",
      "week": "Week 2",
      "publishedDate": "2026-08-09",
      "year": "2026",
      "totalMarks": 25,
      "obtainedMarks": 20,
      "stdClassId": "123",
      "subjectId": "789",
      "batchId": "456",
      "stdClass": {
        "id": "123",
        "className": "class-3"
      },
      "subject": {
        "id": "789",
        "subjectName": "English"
      },
      "batch": {
        "id": "456",
        "name": "B-4"
      },
      "student": {
        "id": "student-uuid",
        "name": "Student Name"
      }
    }
  ]
}
```

#### Error Response (400 Bad Request)
```json
{
  "statusCode": 400,
  "success": false,
  "message": "stdClassId and subjectId are required",
  "data": null
}
```

## Implementation Details

### Files Modified
1. **src/app/modules/weekly-marks-sheet/weekly-marks-sheet.service.ts**
   - Added `getWeeklyMarksSheetsByFilters()` function
   - Accepts filters: stdClassId, batchId, subjectId, week, month, year
   - Returns only records matching all provided filters
   - Handles both records with batchId and null batchId for backward compatibility
   - Orders results by createdAt descending

2. **src/app/modules/weekly-marks-sheet/weekly-marks-sheet.controller.ts**
   - Added `getWeeklyMarksSheetsByFilters()` controller function
   - Validates required parameters (stdClassId and subjectId)
   - Extracts optional parameters from query (batchId, week, month, year)
   - Returns formatted response

3. **src/app/modules/weekly-marks-sheet/weekly-marks-sheet.routes.ts**
   - Added route: `GET /filter`
   - Placed before dynamic routes to avoid conflicts

## Usage in Frontend

Update the frontend to call this new endpoint when the user selects filters:

```javascript
// Example: Fetch data for Week 2, August 2026, class-3, batch B-4, subject English
const params = new URLSearchParams({
  stdClassId: '123',
  batchId: '456',
  subjectId: '789',
  week: 'Week 2',
  month: 'August',
  year: '2026'
});

const response = await fetch(`/weekly-marks-sheets/filter?${params}`);
const result = await response.json();

// result.data will contain only the selected week's data
console.log(result.data); // Array of weekly marks sheets for Week 2
```

## How This Fixes the Issue

**Before:**
- UI was likely calling `GET /weekly-marks-sheets` which returns all records with pagination
- Or calling an endpoint that didn't filter by the selected week
- Result: Only one week's data was showing (possibly due to pagination or incorrect filtering)

**After:**
- UI calls `GET /weekly-marks-sheets/filter` with all the selected filters including the specific week
- Backend returns only records matching that specific week
- Result: UI correctly displays only the selected week's data

## Testing

To test the endpoint:

1. Ensure the server is running
2. Make a GET request to `/weekly-marks-sheets/filter` with the required query parameters
3. Verify that only the selected week's data is returned
4. Test with different weeks to ensure filtering works correctly
5. Check that the UI now displays the correct week's data based on user selection

## Notes
- The endpoint includes related data (stdClass, subject, batch, student) in the response
- All filter parameters are optional except stdClassId and subjectId
- The batchId filter includes both records with the specified batchId and records with null batchId for backward compatibility
- Results are ordered by createdAt descending (most recent first)