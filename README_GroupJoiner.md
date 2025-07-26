# Telegram Group Joiner Tool

This tool allows you to join multiple Telegram groups using the same session ID as your main bot.

## Features

- ✅ Join multiple groups at once
- ✅ Uses the same session as your main bot
- ✅ Automatic rate limiting to avoid Telegram restrictions
- ✅ Check if already a member before joining
- ✅ Detailed progress reporting
- ✅ Command-line interface for easy management

## Prerequisites

Make sure you have the required dependencies installed:

```bash
npm install telegram input
```

## Usage

### 1. Join All Groups

To join all groups in the list:

```bash
node joinGroups.js join
```

### 2. Add a Group to the List

To add a new group to the join list:

```bash
node joinGroups.js add <group_name>
```

Example:

```bash
node joinGroups.js add mygroup
```

### 3. Remove a Group from the List

To remove a group from the join list:

```bash
node joinGroups.js remove <group_name>
```

Example:

```bash
node joinGroups.js remove mygroup
```

### 4. Display Current Group List

To see all groups currently in the list:

```bash
node joinGroups.js list
```

### 5. Show Help

To see all available commands:

```bash
node joinGroups.js
```

## Configuration

### Modifying the Group List

You can edit the `groupsToJoin` array in `joinGroups.js` to add or remove groups:

```javascript
const groupsToJoin = [
  "group1",
  "group2",
  "group3",
  // Add more groups here
];
```

### Session Management

The tool uses the same session ID as your main bot (`index.js`). If you need to update the session:

1. Update the `currentSession` variable in `joinGroups.js`
2. Or run the tool and it will prompt for a new session if needed

## Rate Limiting

The tool includes built-in rate limiting:

- 2-second delay between join attempts
- Automatic handling of Telegram flood wait errors
- Session management for avoiding conflicts

## Error Handling

The tool handles various error scenarios:

- ✅ Already a member of groups
- ✅ Private groups (cannot join)
- ✅ Groups requiring admin approval
- ✅ Network connection issues
- ✅ Session expiration

## Output Example

```
🚀 Starting group joining process...
📋 Total groups to process: 65
--------------------------------------------------
✅ Connected successfully using saved session!
👤 Logged in as: Your Name (@yourusername)
--------------------------------------------------

[1/65] Processing: KOLscope
🔄 Attempting to join: KOLscope
✅ Already a member of: KOLscope

[2/65] Processing: Saqlain666
🔄 Attempting to join: Saqlain666
✅ Successfully joined: Saqlain666
⏳ Waiting 2 seconds before next request...

==================================================
📊 JOINING SUMMARY
==================================================
✅ Successfully joined: 15 groups
👥 Already members: 45 groups
❌ Failed to join: 5 groups
📋 Total processed: 65 groups

❌ Failed Groups:
   - privategroup: Private channel
   - adminrequired: Requires admin approval

🎉 Group joining process completed!
🔌 Disconnected from Telegram
```

## Safety Notes

⚠️ **Important**:

- Use this tool responsibly
- Respect Telegram's terms of service
- Don't join too many groups too quickly
- The tool includes delays to avoid rate limiting

## Troubleshooting

### Session Issues

If you get session-related errors:

1. The tool will automatically prompt for a new session
2. Follow the prompts to enter your phone number and verification code
3. The new session will be displayed - save it for future use

### Rate Limiting

If you hit Telegram's rate limits:

1. Wait for the specified time period
2. Try again later
3. Consider reducing the number of groups in the list

### Group Not Found

If a group cannot be found:

1. Check the group name spelling
2. Ensure the group is public or you have an invite link
3. Some groups may have changed names or been deleted

## Integration with Main Bot

This tool is designed to work alongside your main Telegram bot:

- Uses the same session ID for consistency
- Can be run independently when you need to join new groups
- Doesn't interfere with the main bot's operation
- Can be used to update the group list in your main bot

## Support

If you encounter issues:

1. Check the error messages for specific details
2. Ensure all dependencies are installed
3. Verify your session is valid
4. Check that group names are correct
