class DeviceTestMatrix:
    TARGET_DEVICES = [
        {"platform": "Android", "model": "Pixel 8", "api_level": 34},
        {"platform": "Android", "model": "Galaxy S23", "api_level": 33},
        {"platform": "iOS", "model": "iPhone 15 Pro", "os_version": "17.4"},
        {"platform": "iOS", "model": "iPhone SE 3rd Gen", "os_version": "16.5"}
    ]

    @classmethod
    def get_matrix(cls) -> list:
        return cls.TARGET_DEVICES
