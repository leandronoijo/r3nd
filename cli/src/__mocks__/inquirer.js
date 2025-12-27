// Mock inquirer for Jest tests
const inquirer = {
  createPromptModule: jest.fn(() => jest.fn()),
  prompt: jest.fn()
};

module.exports = inquirer;
