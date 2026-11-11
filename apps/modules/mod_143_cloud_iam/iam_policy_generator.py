#!/usr/bin/env python3
import json

class IamPolicyGenerator:
    @staticmethod
    def generate_s3_scoped_policy(bucket_name: str) -> str:
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetObject", "s3:PutObject"],
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        }
        return json.dumps(policy, indent=2)
