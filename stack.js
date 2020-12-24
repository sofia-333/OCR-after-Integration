class Stack {
  constructor() {
      this.stack = [];
  }

  push(el) {
      this.stack.push(el)
  }

  pop() {
      return this.stack.pop();
  }

  isEmpty() {
      return !this.stack.length;
  }

  clear() {
      return this.stack = [];
  }
}