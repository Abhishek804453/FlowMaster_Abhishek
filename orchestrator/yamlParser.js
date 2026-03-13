const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const workflowFile = path.join(__dirname, '../workflow-definition/loan-workflow.yaml');

const workflowSteps = yaml.load(fs.readFileSync(workflowFile, 'utf8')).workflow;

module.exports = workflowSteps;