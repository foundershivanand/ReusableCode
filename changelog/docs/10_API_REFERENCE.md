# API Reference: Changelog, Roadmap & What's New

## REST Endpoints

### GET `/api/changelog/items?audience={audience}`
Returns published changelog entries.

### GET `/api/changelog/unread?userId={userId}&audience={audience}`
Returns unread changelog entries for the given user.

### POST `/api/changelog/read`
Records a read receipt.
- Body: `{ userId: string, changelogId: string, deviceId?: string }`

### GET `/api/changelog/roadmap?status={status}`
Returns roadmap initiatives.

### POST `/api/changelog/roadmap/:id/upvote`
Upvotes a roadmap initiative.
- Body: `{ userId: string }`

### POST `/api/changelog/items`
Creates a draft changelog item.
- Body: `CreateChangelogInput`
