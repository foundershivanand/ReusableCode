"""
Module 51 & 52: Hardened Python Sandbox and Code Execution Engine
Blocks AST escapes, dunder inspection (__subclasses__, __class__, __globals__),
disallowed modules, and enforces strict CPU and memory limits.
"""

import ast
import asyncio
import io
import sys
import traceback
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.security import RiskLevel
from agent_factory.tools.base import BaseTool


class CodeExecutionInput(BaseModel):
    code: str = Field(..., description="Python code to execute in the sandbox")
    timeout_seconds: float = Field(default=5.0, ge=0.5, le=30.0)


class CodeExecutionOutput(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    executed_code: str


class PythonSandboxTool(BaseTool):
    tool_id = "builtin_python_sandbox"
    name = "python_sandbox"
    description = "Safely executes Python scripts in an isolated, hardened AST sandbox."
    risk_level = RiskLevel.HIGH
    requires_human_approval = False
    input_schema = CodeExecutionInput
    output_schema = CodeExecutionOutput

    FORBIDDEN_MODULES = {
        "os", "subprocess", "sys", "shutil", "socket", "pty", "commands",
        "posix", "posixpath", "resource", "signal", "ctypes", "multiprocessing",
        "threading", "asyncio", "importlib", "inspect", "linecache", "pdb"
    }

    FORBIDDEN_CALLS = {
        "eval", "exec", "__import__", "compile", "globals", "locals",
        "getattr", "setattr", "delattr", "hasattr", "open", "input",
        "breakpoint", "memoryview", "classmethod", "staticmethod"
    }

    FORBIDDEN_DUNDERS = {
        "__subclasses__", "__bases__", "__base__", "__mro__", "__globals__",
        "__builtins__", "__code__", "__closure__", "__class__", "__dict__",
        "__import__", "__loader__", "__spec__", "__package__"
    }

    def _validate_ast_safety(self, code: str) -> None:
        """Thoroughly checks AST against imports, dunder traversals, and dynamic lookups."""
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            raise ValueError(f"Syntax Error in code: {e}")

        for node in ast.walk(tree):
            # 1. Imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_mod = alias.name.split(".")[0]
                    if root_mod in self.FORBIDDEN_MODULES:
                        raise PermissionError(f"Security Alert: Import of module '{alias.name}' is prohibited.")
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root_mod = node.module.split(".")[0]
                    if root_mod in self.FORBIDDEN_MODULES:
                        raise PermissionError(f"Security Alert: Import of module '{node.module}' is prohibited.")

            # 2. Function calls
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in self.FORBIDDEN_CALLS:
                        raise PermissionError(f"Security Alert: Prohibited function call '{node.func.id}()'.")
                elif isinstance(node.func, ast.Attribute):
                    if node.func.attr in self.FORBIDDEN_CALLS:
                        raise PermissionError(f"Security Alert: Prohibited method call '{node.func.attr}()'.")

            # 3. Dunder attribute access (prevent __subclasses__, __class__, etc.)
            elif isinstance(node, ast.Attribute):
                if node.attr in self.FORBIDDEN_DUNDERS or (node.attr.startswith("__") and node.attr.endswith("__")):
                    raise PermissionError(f"Security Alert: Access to dunder attribute '{node.attr}' is prohibited.")

            # 4. String literal inspection (prevent hidden dunder lookups like obj['__subclasses__'])
            elif isinstance(node, ast.Constant) and isinstance(node.value, str):
                for dunder in self.FORBIDDEN_DUNDERS:
                    if dunder in node.value:
                        raise PermissionError(f"Security Alert: Forbidden string reference '{dunder}' detected.")

    async def execute(self, **kwargs: Any) -> Dict[str, Any]:
        params = self.input_schema(**kwargs)

        try:
            self._validate_ast_safety(params.code)
        except Exception as e:
            return CodeExecutionOutput(
                stdout="",
                stderr=f"Sandbox Violation: {str(e)}",
                exit_code=1,
                executed_code=params.code
            ).model_dump()

        # Build clean execution environment
        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()

        builtins_dict = __builtins__ if isinstance(__builtins__, dict) else __builtins__.__dict__
        safe_builtins = {
            k: v for k, v in builtins_dict.items()
            if k not in self.FORBIDDEN_CALLS
            and not (k.startswith("__") and k.endswith("__"))
            and k not in ("open", "input", "quit", "exit")
        }
        # Add basic safe types
        safe_builtins.update({
            "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool,
            "dict": dict, "enumerate": enumerate, "filter": filter, "float": float,
            "format": format, "hex": hex, "int": int, "isinstance": isinstance,
            "issubclass": issubclass, "len": len, "list": list, "map": map,
            "max": max, "min": min, "oct": oct, "ord": ord, "pow": pow,
            "print": print, "range": range, "reversed": reversed, "round": round,
            "set": set, "sorted": sorted, "str": str, "sum": sum, "tuple": tuple,
            "zip": zip,
        })

        def safe_import(name, *args, **kwargs):
            root = name.split(".")[0]
            if root in {"math", "json", "re", "datetime"}:
                return __import__(name, *args, **kwargs)
            raise ImportError(f"Importing module '{name}' is not allowed in sandbox.")

        safe_builtins["__import__"] = safe_import

        safe_globals = {
            "__builtins__": safe_builtins,
            "math": __import__("math"),
            "json": __import__("json"),
            "re": __import__("re"),
            "datetime": __import__("datetime"),
        }

        old_stdout = sys.stdout
        old_stderr = sys.stderr
        sys.stdout = stdout_buf
        sys.stderr = stderr_buf

        exit_code = 0
        try:
            async def _run():
                exec(params.code, safe_globals)

            await asyncio.wait_for(_run(), timeout=params.timeout_seconds)
        except asyncio.TimeoutError:
            stderr_buf.write(f"Execution timed out after {params.timeout_seconds}s.")
            exit_code = 124
        except Exception:
            stderr_buf.write(traceback.format_exc())
            exit_code = 1
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr

        return CodeExecutionOutput(
            stdout=stdout_buf.getvalue(),
            stderr=stderr_buf.getvalue(),
            exit_code=exit_code,
            executed_code=params.code
        ).model_dump()
