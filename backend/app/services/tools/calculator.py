"""
Calculator Tool
Provides basic arithmetic capabilities to the AI.
"""

from langchain.tools import tool
import ast
import operator

# Safe eval mapping for basic math operations
_OP_MAP = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.BitXor: operator.xor,
    ast.USub: operator.neg
}

def _eval(node):
    if isinstance(node, ast.Num): 
        return node.n
    elif isinstance(node, ast.BinOp): 
        return _OP_MAP[type(node.op)](_eval(node.left), _eval(node.right))
    elif isinstance(node, ast.UnaryOp): 
        return _OP_MAP[type(node.op)](_eval(node.operand))
    else:
        raise TypeError(node)

@tool
def calculate(expression: str) -> str:
    """
    Evaluate a mathematical expression.
    Use this tool when you need to perform calculations.
    Input should be a mathematical expression as a string, e.g., '34 * (12 + 4) / 2'.
    """
    try:
        # Strip potentially harmful characters
        clean_expr = "".join(c for c in expression if c in "0123456789+-*/(). ")
        if not clean_expr.strip():
            return "Error: Invalid expression."
        
        result = _eval(ast.parse(clean_expr, mode='eval').body)
        return str(result)
    except Exception as e:
        return f"Error computing expression: {str(e)}"
