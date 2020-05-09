const {
  Program,
  BinaryExp,
  Literal,
  IdExp,
  Print,
  Assignment,
  NegationExp,
  WhileExp,
  Suite,
  ForExp,
  Call,
  Argument,
  SubscriptedRangeable,
  IfStmt,
  Break,
  Rule,
  Arr,
  FunctionDeclaration,
  Param,
  Params,
  Return,
  VariableDeclaration,
  Null,
} = require("../ast");

module.exports = (program) => program.optimize();

function isZero(e) {
  return e instanceof Literal && e.value === 0;
}

function isOne(e) {
  return e instanceof Literal && e.value === 1;
}

function bothLiterals(b) {
  return b.left instanceof Literal && b.right instanceof Literal;
}

Assignment.prototype.optimize = function () {
  this.target = this.target.optimize();
  this.source = this.source.optimize();
  if (this.target === this.source) {
    return null;
  }
  return this;
};

Break.prototype.optimize = function () {
  return this;
};

ForExp.prototype.optimize = function () {
  this.iterable = this.iterable.optimize();
  this.suite = this.suite.optimize();
  return this;
};

Call.prototype.optimize = function () {
  this.args = this.args.map((arg) => arg.optimize());
  this.callee = this.callee.optimize();
  return this;
};

IdExp.prototype.optimize = function () {
  return this;
};

IfStmt.prototype.optimize = function () {
  this.test = this.test.optimize();
  this.consequent = this.consequent.optimize();
  this.alternate = this.alternate.optimize();
  if (isZero(this.test)) {
    return this.alternate;
  }
  return this;
};

Literal.prototype.optimize = function () {
  return this;
};

NegationExp.prototype.optimize = function () {
  this.operand = this.operand.optimize();
  if (this.operand instanceof Literal) {
    return new Literal(-this.operand.value);
  }
  return this;
};

Param.prototype.optimize = function () {
  return this;
};

WhileExp.prototype.optimize = function () {
  this.test = this.test.optimize();
  if (this.test instanceof Literal && this.test.value == "false") {
    return new Null();
  }
  this.body = this.body.optimize();
  return this;
};

Program.prototype.optimize = function () {
  // Will detect all function declarations, and if no calls have been made to them
  // we remove them from the program.
  let functionDecs = new Map();
  this.statements.forEach((s, i) => {
    if (s.constructor == FunctionDeclaration) functionDecs.set(s.id.ref, s);
    if (s.constructor == Call && functionDecs.has(s.callee.id.ref))
      functionDecs.delete(s.callee.id.ref);
  });

  functionDecs.forEach((s) => {
    if (s.constructor == FunctionDeclaration && functionDecs.has(s.id.ref))
      this.statements.splice(
        this.statements.indexOf(functionDecs.get(s.id.ref)),
        1
      );
  });

  this.statements = this.statements.map((s) => s.optimize());
  return this;
};

BinaryExp.prototype.optimize = function () {
  this.left = this.left.optimize();
  this.right = this.right.optimize();
  if (this.op === "+" && isZero(this.right)) return this.left;
  if (this.op === "+" && isZero(this.left)) return this.right;
  if (this.op === "*" && isZero(this.right)) return new Literal(0);
  if (this.op === "*" && isZero(this.left)) return new Literal(0);
  if (this.op === "*" && isOne(this.right)) return this.left;
  if (this.op === "*" && isOne(this.left)) return this.right;

  if (bothLiterals(this)) {
    const [x, y] = [this.left.value, this.right.value];
    if (this.op === "+") return new Literal(x + y);
    if (this.op === "*") return new Literal(x * y);
    if (this.op === "/") return new Literal(x / y);
  }

  // Added logical operator optimization for boolean expressions
  if (this.op === "and" && this.right.value === "false") return this.right;
  if (this.op === "and" && this.left.value === "false") return this.left;
  if (this.op === "or" && this.right.value === "true") return this.right;
  if (this.op === "or" && this.left.value === "true") return this.left;
  if (this.left.value === "false" && this.right.value === "false")
    return this.left;
  if (this.left.value === "true" || this.right.value === "true")
    return this.left;

  return this;
};

Print.prototype.optimize = function () {
  this.expression = this.expression.optimize();
  return this;
};

Suite.prototype.optimize = function () {
  // If a return statement appears more than once in the body of a suite, it will remove it
  this.stmt
    .filter((s) => s.constructor === Return)
    .forEach((s, i) => {
      if (i !== 0) this.stmt.splice(this.stmt.indexOf(s), 1);
    });

  this.stmt = this.stmt.map((s) => s.optimize());
  return this;
};

Argument.prototype.optimize = function () {
  this.expression = this.expression.optimize();
  return this;
};

SubscriptedRangeable.prototype.optimize = function () {
  if (this.secondExp !== null) this.secondExp = this.secondExp.optimize();
  this.firstExp = this.firstExp.optimize();
  return this;
};

// Optimizations added for if, else if, and else statements
IfStmt.prototype.optimize = function () {
  this.firstCondition = this.firstCondition.optimize();
  this.firstSuite = this.firstSuite.optimize();
  if (this.potentialConditions[0] !== undefined)
    this.potentialConditions.map((condition, i) => {
      condition.optimize();
      this.potentialBlocks[i] = this.potentialBlocks[i].optimize();
    });
  if (this.elseCaseSuite !== null)
    this.elseCaseSuite = this.elseCaseSuite.optimize();
  return this;
};

Rule.prototype.optimize = function () {
  this.expressions = this.expressions.optimize();
  return this;
};

Arr.prototype.optimize = function () {
  this.expressions = this.expressions.map((e) => e.optimize());
  return this;
};

FunctionDeclaration.prototype.optimize = function () {
  this.suite = this.suite.optimize();
  return this;
};

Params.prototype.optimize = function () {
  this.parameters = this.parameters.map((s) => s.optimize());
  return this;
};

Return.prototype.optimize = function () {
  return this;
};

VariableDeclaration.prototype.optimize = function () {
  if (this.optionalSource.type !== null) {
    this.optionalSource = this.optionalSource.optimize();
    return this;
  } else return this;
};
