// The semantic analyzer
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
  Null,
  Member,
  SubscriptedRangeable,
  IfStmt,
  Break,
  Rule,
  Arr,
  FunctionDeclaration,
  ArrayType,
  Types,
  Param,
  Params,
  Return,
  VariableDeclaration,
} = require("../ast");
const { IntType, StringType, DoubleType, BooleanType } = require("./builtins");
const check = require("./check");
const Context = require("./context");

module.exports = function(exp) {
  exp.analyze(Context.INITIAL);
};

Program.prototype.analyze = function(context) {
  this.statements.forEach((s) => {
    // console.log(s);
    s.analyze(context);
    //do signature analysis in here?
  });
};

Assignment.prototype.analyze = function(context) {
  this.source.analyze(context);
  this.target.analyze(context);
};

Break.prototype.analyze = function(context) {
  check.inLoop(context, "break");
};

BinaryExp.prototype.analyze = function(context) {
  this.left.analyze(context);
  this.right.analyze(context);
  if (/[-+*/&|]/.test(this.op)) {
    check.isInteger(this.left);
    check.isInteger(this.right);
    this.type = IntType;
  } else if (/<=?|>=?/.test(this.op)) {
    check.expressionsHaveTheSameType(this.left, this.right);
    check.isInteger(this.left);
    check.isInteger(this.right);
    this.type = BooleanType;
  } else {
    check.expressionsHaveTheSameType(this.left, this.right);
    this.type = StringType;
  }
};

VariableDeclaration.prototype.analyze = function(context) {
  this.optionalSource.analyze(context);
  if (this.type) this.type = context.lookup(this.type);
  else this.type = this.optionalSource.type;
  context.add(this);
};

// Needs function declarations to be defined
Call.prototype.analyze = function(context) {
  this.callee = context.lookup(this.callee);
  check.isFunction(this.callee, "Attempt to call a non-function");
  this.args.forEach((arg) => arg.analyze(context));
  check.legalArguments(this.args, this.callee.params);
  this.type = this.callee.returnType;
};

// Function analysis is broken up into two parts in order to support (nutual)
// recursion. First we have to do semantic analysis just on the signature
// (including the return type). This is so other functions that may be declared
// before this one have calls to this one checked.
// FunctionDeclaration.prototype.analyzeSignature = function(context) {
//   this.bodyContext = context.createChildContextForFunctionBody();
//   this.parameters.forEach((p) => p.analyze(this.bodyContext));
//   // this.returnType = !this.returnType
//   //   ? undefined
//   //   : context.lookup(this.returnType);
// };

FunctionDeclaration.prototype.analyze = function(context) {
  //1. Disallow function decs in suites only top-level program
  //2. Break this into 2 functions
  let bodyContext = context.createChildContextForFunctionBody();
  this.parameters.analyze(bodyContext);
  this.suite.analyze(bodyContext);
  context.add(this);
  //add this function to the above context

  // check.isAssignableTo(
  //   this.body,
  //   this.returnType,
  //   "Type mismatch in function return"
  // );
  // delete this.bodyContext; // This was only temporary, delete to keep output clean.
};

IdExp.prototype.analyze = function(context) {
  this.ref = context.lookup(this.ref);
  this.type = this.ref.type;
};

Literal.prototype.analyze = function() {
  if (Number.isInteger(this.value)) {
    this.type = IntType;
  } else if (!Number.isInteger(this.value)) {
    this.type = DoubleType;
  } else if (typeof variable === "boolean") {
    this.type = BooleanType;
  } else {
    this.type = StringType;
  }
};

NegationExp.prototype.analyze = function(context) {
  this.operand.analyze(context);
  check.isInteger(this.operand, "Operand of negation");
  this.type = IntType;
};

Print.prototype.analyze = function(context) {
  this.expression.analyze(context);
};

Param.prototype.analyze = function(context) {
  this.type = context.lookup(this.type.id);
  context.add(this);
};

Params.prototype.analyze = function(context) {
  this.parameters.forEach((s) => s.analyze(context));
};

Suite.prototype.analyze = function(context) {
  //Do more analysis? Like letexp?
  this.stmt.forEach((s) => s.analyze(context));
};

WhileExp.prototype.analyze = function(context) {
  this.test.analyze(context);
  check.isBoolean(this.test, "Test in while");
  const suiteContext = context.createChildContextForLoop();
  this.body.analyze(suiteContext);
};
