# Event Status Automatic Update System

## Overview

This system automatically updates event statuses when events become past events. Events that have passed their scheduled time are automatically marked as "completed" instead of remaining "active" or "pending".

## How It Works

### 1. Automatic Cloud Function
- **Function Name**: `updatePastEvents`
- **Schedule**: Runs every hour automatically
- **Purpose**: Scans all active and pending events and updates past events to "completed" status

### 2. Manual Trigger Function
- **Function Name**: `manualUpdatePastEvents`
- **Access**: Available to admins and superadmins
- **Purpose**: Allows manual triggering of the past events update process

## Event Status Flow

1. **Pending** → Events created by retirees awaiting admin approval
2. **Active** → Approved events that are currently ongoing or upcoming
3. **Completed** → Events that have passed their scheduled time (automatically updated)

## Implementation Details

### Cloud Functions (functions/index.js)

#### Automatic Update Function
```javascript
exports.updatePastEvents = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  // Scans all active and pending events
  // Updates past events to 'completed' status
  // Adds completedAt timestamp
});
```

#### Manual Update Function
```javascript
exports.manualUpdatePastEvents = functions.https.onCall(async (data, context) => {
  // Same logic as automatic function
  // Requires admin/superadmin authentication
});
```

### Frontend Updates

#### Status Colors
- **Pending**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Active**: Green (`bg-green-100 text-green-800`)
- **Completed**: Blue (`bg-blue-100 text-blue-800`)

#### Calendar Display
- Completed events show with gray background and "Completed" badge
- Past events that aren't completed show "Past" badge
- Completed events are non-interactive (no click events)

#### Filtering
- New "Completed Events" filter option in calendar
- Completed events are included in event listings for admins and superadmins
- Retirees can see their own completed events

## Admin Controls

### Manual Update Button
- Available in both Admin and SuperAdmin dashboards
- Blue "Update Past Events" button with sync icon
- Shows success/error messages with toast notifications
- Displays count of updated events

### Access Control
- Only admins and superadmins can manually trigger updates
- Automatic updates run server-side without user intervention

## Date/Time Handling

The system handles multiple date formats:
- DD-MM-YYYY (primary format)
- YYYY-MM-DD (fallback format)

Time considerations:
- Uses `timeTo` (end time) if available
- Falls back to `timeFrom` (start time)
- Defaults to end of day (23:59:59) if no time specified

## Translations

Added translations for "completed" status:
- **English**: "Completed"
- **Hebrew**: "הושלם"
- **Arabic**: "مكتمل"

## Benefits

1. **Data Accuracy**: Events are automatically marked as completed when they pass
2. **User Experience**: Clear visual distinction between active and completed events
3. **Analytics**: Better tracking of event lifecycle and completion rates
4. **Performance**: Reduces need for manual status updates
5. **Consistency**: Ensures all past events are properly categorized

## Monitoring

- Cloud function logs show which events are updated
- Manual updates provide immediate feedback on success/failure
- Toast notifications inform users of update results

## Future Enhancements

Potential improvements:
- Email notifications when events are automatically completed
- Analytics dashboard showing completion rates
- Bulk status update tools for admins
- Event completion feedback collection 