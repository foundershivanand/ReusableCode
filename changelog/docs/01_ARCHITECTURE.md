# Architecture: Changelog, Roadmap & What's New

## Overview
The Changelog module provides release communication, public roadmaps, and What's New user notification infrastructure. It manages release notes with multi-device unread tracking and audience segmentation.

## Core Features
1. **Publication Workflow**:
   - `DRAFT` -> `REVIEW` -> `SCHEDULED` -> `PUBLISHED` -> `ARCHIVED`
   - Only users with `publisher` or `admin` roles can transition items into `PUBLISHED`.
2. **Multi-Device Unread Synchronization**:
   - Reads are recorded per `(userId, changelogId)` with optional `deviceId` tracking. A user marking an update as read on mobile automatically clears the unread badge on desktop.
3. **Audience Segmentation**:
   - Updates can be targeted to `ALL`, `BETA_USERS`, `INTERNAL_ONLY`, or `PRO_USERS`.
4. **Roadmap Integration & Upvoting**:
   - Users can view upcoming quarterly initiatives and cast deduplicated upvotes.
   - Completed roadmap items can link directly to the corresponding published changelog item.
