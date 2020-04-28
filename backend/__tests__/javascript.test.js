/*
 * JavaScript Code Generator Tests
 *
 * These tests check that the JavaScript generator produces the target
 * JavaScript that we expect.
 */

const parse = require("../../ast/parser");
const analyze = require("../../semantics/analyzer");
const generate = require("../javascript-generator");

const fixture = {
  hello: [
    String.raw`hiss("Hello, world\n")`,
    String.raw`console.log("Hello, world\n")`,
  ],
};

describe("The JavaScript generator", () => {
  Object.entries(fixture).forEach(([name, [source, expected]]) => {
    test(`produces the correct output for ${name}`, (done) => {
      const ast = parse(source);
      analyze(ast);
      expect(generate(ast)).toMatch(expected);
      done();
    });
  });
});

Object.entries(fixture).forEach(([name, [source, expected]]) => {
  const ast = parse(source);
  analyze(ast);
  console.log(
    `name: ${name}\n 
    source: ${source}\n 
    ast: ${ast}\n
    astType: ${typeof ast}\n
    astGenType: ${typeof generate(ast)}\n
    received: ${generate(ast)}\n
    expected: ${expected}\n 
    `
  );
});
