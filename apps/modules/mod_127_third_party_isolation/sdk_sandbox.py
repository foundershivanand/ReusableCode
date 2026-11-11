import time

class SdkSandbox:
    @staticmethod
    def execute_with_timeout(sdk_call_fn, timeout_sec: float = 2.0) -> dict:
        start = time.perf_counter()
        try:
            res = sdk_call_fn()
            elapsed = time.perf_counter() - start
            return {"success": True, "result": res, "elapsed_sec": round(elapsed, 4)}
        except Exception as e:
            return {"success": False, "error": str(e), "elapsed_sec": round(time.perf_counter() - start, 4)}
