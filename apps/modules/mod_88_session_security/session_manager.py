#!/usr/bin/env python3
import time
import uuid
import hashlib
from typing import Dict, List, Optional

class SessionDevice:
    def __init__(self, device_id: str, platform: str, os_version: str, ip_address: str, user_agent: str):
        self.device_id = device_id
        self.platform = platform
        self.os_version = os_version
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.fingerprint = self._calculate_fingerprint()

    def _calculate_fingerprint(self) -> str:
        raw = f"{self.device_id}:{self.platform}:{self.os_version}:{self.user_agent}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

class UserSession:
    def __init__(self, session_id: str, user_id: str, device: SessionDevice, ttl_seconds: int = 2592000): # 30 days
        self.session_id = session_id
        self.user_id = user_id
        self.device = device
        self.created_at = time.time()
        self.last_active = time.time()
        self.expires_at = self.created_at + ttl_seconds
        self.is_revoked = False

    @property
    def is_valid(self) -> bool:
        return not self.is_revoked and time.time() < self.expires_at

    def touch(self, ip_address: Optional[str] = None):
        self.last_active = time.time()
        if ip_address:
            self.device.ip_address = ip_address

class SessionManager:
    def __init__(self, max_concurrent_sessions: int = 5):
        self.max_concurrent_sessions = max_concurrent_sessions
        self._sessions: Dict[str, Dict[str, UserSession]] = {} # user_id -> {session_id: UserSession}

    def create_session(self, user_id: str, device: SessionDevice) -> UserSession:
        user_sessions = self._sessions.setdefault(user_id, {})
        
        # Enforce max concurrent sessions (evict oldest if exceeded)
        active_sessions = [s for s in user_sessions.values() if s.is_valid]
        if len(active_sessions) >= self.max_concurrent_sessions:
            active_sessions.sort(key=lambda s: s.last_active)
            oldest = active_sessions[0]
            oldest.is_revoked = True

        session_id = f"sess_{uuid.uuid4().hex}"
        session = UserSession(session_id=session_id, user_id=user_id, device=device)
        user_sessions[session_id] = session
        return session

    def validate_session(self, user_id: str, session_id: str, current_ip: Optional[str] = None) -> Optional[UserSession]:
        user_sessions = self._sessions.get(user_id, {})
        session = user_sessions.get(session_id)
        if not session or not session.is_valid:
            return None
        session.touch(current_ip)
        return session

    def revoke_session(self, user_id: str, session_id: str):
        if user_id in self._sessions and session_id in self._sessions[user_id]:
            self._sessions[user_id][session_id].is_revoked = True

    def revoke_all_except(self, user_id: str, current_session_id: str):
        if user_id in self._sessions:
            for sid, s in self._sessions[user_id].items():
                if sid != current_session_id:
                    s.is_revoked = True

    def list_active_sessions(self, user_id: str) -> List[dict]:
        user_sessions = self._sessions.get(user_id, {})
        return [
            {
                "session_id": s.session_id,
                "platform": s.device.platform,
                "ip_address": s.device.ip_address,
                "created_at": s.created_at,
                "last_active": s.last_active,
                "fingerprint": s.device.fingerprint
            }
            for s in user_sessions.values() if s.is_valid
        ]
