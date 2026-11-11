class ScreenshotPipeline:
    SCREENSHOT_DIMENSIONS = {
        "iphone_6_7": (1290, 2796),
        "iphone_6_5": (1242, 2688),
        "ipad_pro_12_9": (2048, 2732),
        "android_phone": (1080, 2400)
    }

    @classmethod
    def get_required_sizes(cls) -> dict:
        return cls.SCREENSHOT_DIMENSIONS
