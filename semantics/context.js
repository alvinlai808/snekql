/*
 * Semantic Analysis Context
 *
 * A context object holds state for the semantic analysis phase.
 *
 *   const Context = require('./semantics/context');
 */

const { IntType, StringType, DoubleType, BooleanType } = require("./builtins");
const { IdExp } = require("../ast");
require("./analyzer");

// When doing semantic analysis we pass around context objects.
//
// A context object holds:
//
//   1. A reference to the parent context (or null if this is the root context).
//      This allows to search for declarations from the current context outward.
//
//   2. A reference to the current function we are analyzing, if any. If we are
//      inside a function, then return expressions are legal, and we will be
//      able to type check them.
//
//   3. Whether we are in a loop (to know that a `break` is okay).
//
//   4. A map for looking up all identifiers declared in this context.

class Context {
  constructor({ parent = null, currentFunction = null, inLoop = false } = {}) {
    Object.assign(this, {
      parent,
      currentFunction,
      inLoop,
      locals: new Map(),
    });
  }

  createChildContextForFunctionBody(currentFunction) {
    // When entering a new function, we're not in a loop anymore
    return new Context({ parent: this, currentFunction, inLoop: false });
  }

  createChildContextForLoop() {
    // When entering a loop body, just set the inLoop field, retain others
    return new Context({
      parent: this,
      currentFunction: this.currentFunction,
      inLoop: true,
    });
  }

  createChildContextForBlock() {
    // For a block, we have to retain both the function and loop settings.
    return new Context({
      parent: this,
      currentFunction: this.currentFunction,
      inLoop: this.inLoop,
    });
  }

  // Adds a declaration to this context.
  add(declaration) {
    //if dec.id.constructor == IDEXP .ref too
    if (
      this.locals.has(declaration.id) ||
      this.locals.has(declaration.id.ref)
    ) {
      throw new Error(`${declaration.id} already declared in this scope`);
    }
    const entity = declaration;
    if (declaration.id.constructor === IdExp)
      this.locals.set(declaration.id.ref, entity);
    else this.locals.set(declaration.id, entity);

    if (declaration.id.ref === "d") {
      console.log(declaration.id.ref);
      console.log(this);
    }
  }

  // Returns the entity bound to the given identifier, starting from this
  // context and searching "outward" through enclosing contexts if necessary.
  lookup(id) {
    for (let context = this; context !== null; context = context.parent) {
      if (context.locals.has(id)) {
        return context.locals.get(id);
      }
    }
    throw new Error(`Identifier ${id} has not been declared`);
  }
}

Context.INITIAL = new Context();
[IntType, StringType, DoubleType, BooleanType].forEach((entity) => {
  Context.INITIAL.add(entity);
});

module.exports = Context;
