class Calculate:

    def check_brackets(self, expr):
        stack = []
        match = {')': '(', ']': '[', '}': '{'}

        for ch in expr:
            if ch in '([{':
                stack.append(ch)
            elif ch in ')]}':
                if not stack or stack[-1] != match[ch]:
                    return "ERROR"
                stack.pop()

        return "OK" if not stack else "ERROR"

    def infix_to_postfix(self, expr):
        prec = {'+': 1, '-': 1, '*': 2, '/': 2}
        stack, result = [], []

        for token in expr.split():
            if token == '(':
                stack.append(token)
            elif token == ')':
                while stack and stack[-1] != '(':
                    result.append(stack.pop())
                stack.pop()  # '(' 제거
            elif token in prec:
                while stack and stack[-1] != '(' and prec.get(stack[-1], 0) >= prec[token]:
                    result.append(stack.pop())
                stack.append(token)
            else:
                result.append(token)  

        while stack:
            result.append(stack.pop())

        return ' '.join(result)

    def evaluate_postfix(self, expr):
        stack = []
        tokens = expr.split()

        for token in tokens:
            if token.lstrip('-').isdigit():
                stack.append(int(token))
            else:
                b = stack.pop()
                a = stack.pop()
                if   token == '+': stack.append(a + b)
                elif token == '-': stack.append(a - b)
                elif token == '*': stack.append(a * b)
                elif token == '/': stack.append(int(a / b))

        return stack[0]

    def evaluate_infix(self, expr):
        """중위식을 바로 계산 (두 메서드 연결)"""
        postfix = self.infix_to_postfix(expr)
        return self.evaluate_postfix(postfix)


calc = Calculate()

print(calc.check_brackets("{ A[ (i+1) ]=0; }"))   
print(calc.check_brackets("A( (i+1] )=0;"))         

print(calc.infix_to_postfix("8 / 2 - 3 + 3 * 2"))  
print(calc.evaluate_postfix("8 2 / 3 - 3 2 * +"))   
print(calc.evaluate_infix("8 / 2 - 3 + 3 * 2"))    
