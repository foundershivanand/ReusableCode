#!/usr/bin/env python3
class EmergencyController:
    def __init__(self):
        self.ai_disabled = False
        self.payments_frozen = False
        self.maintenance_mode = False

    def trigger_emergency_lockdown(self, scope: str):
        if scope == "AI":
            self.ai_disabled = True
        elif scope == "PAYMENTS":
            self.payments_frozen = True
        elif scope == "FULL":
            self.maintenance_mode = True
