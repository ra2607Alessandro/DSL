import Interpreter from "./int";
import Parser from "./parser";
import fs = require('fs');


const int = new Interpreter();
const parser = new Parser();
const test = fs.readFileSync("test.txt", "utf-8");
const t = parser.ProduceAst(test);
console.log(int.Interpret(t));
