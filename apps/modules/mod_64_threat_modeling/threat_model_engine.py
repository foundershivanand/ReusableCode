import json
from dataclasses import dataclass, asdict
from typing import List, Dict

@dataclass
class ThreatEntry:
    threat_id: str
    category: str # Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
    component: str
    description: str
    impact: int # 1-5
    likelihood: int # 1-5
    mitigation_module: str

    @property
    def risk_score(self) -> int:
        return self.impact * self.likelihood

class StrideThreatModelEngine:
    def __init__(self):
        self.threat_catalog: List[ThreatEntry] = []

    def register_threat(self, threat: ThreatEntry):
        self.threat_catalog.append(threat)

    def evaluate_architecture(self, components: List[str]) -> Dict[str, any]:
        matched = [t for t in self.threat_catalog if t.component in components]
        high_risks = [t for t in matched if t.risk_score >= 15]
        med_risks = [t for t in matched if 8 <= t.risk_score < 15]
        low_risks = [t for t in matched if t.risk_score < 8]

        return {
            "total_threats_evaluated": len(matched),
            "high_risk_count": len(high_risks),
            "medium_risk_count": len(med_risks),
            "low_risk_count": len(low_risks),
            "is_acceptable": len(high_risks) == 0,
            "high_risks": [asdict(t) for t in high_risks]
        }
